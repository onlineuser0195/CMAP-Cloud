from fastapi import FastAPI, File, UploadFile, HTTPException, Form, APIRouter
from fastapi.responses import JSONResponse
from fastapi.middleware.cors  import CORSMiddleware
import fitz  # PyMuPDF
from pdf2image import convert_from_path
import pytesseract
import os
from typing import List, Dict
import tempfile
from PIL import Image

# app = FastAPI()

ocr_router = APIRouter()

# Allow your React app's origin
# Enhanced CORS Configuration
ocr_router.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:80",
        "http://127.0.0.1",
        "http://127.0.0.1:80",
        "https://cloud-voy.com",
        "http://cmap.eastus.cloudapp.azure.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)


def extract_text_direct(pdf_path) -> Dict[int, str]:
    """Extract text from PDF with page numbers using PyMuPDF"""
    doc = fitz.open(pdf_path)
    text_pages = {}
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text()
        text_pages[page_num + 1] = text  # Using 1-based page numbering
    return text_pages

def extract_text_ocr(pdf_path) -> Dict[int, str]:
    """Extract text from PDF using OCR with page numbers"""
    images = convert_from_path(pdf_path)
    text_pages = {}
    for page_num, image in enumerate(images, start=1):
        text = pytesseract.image_to_string(image)
        text_pages[page_num] = text
    return text_pages

def extract_text_ocr_from_image(image_path) -> Dict[int, str]:
    """Extract text from PDF using OCR with page numbers"""
    # images = convert_from_path(pdf_path)
    text_pages = {}
    with Image.open(image_path) as image:
        text = pytesseract.image_to_string(image)
        text_pages[1] = text
    return text_pages

def needs_ocr(pdf_path) -> bool:
    """Check if PDF needs OCR processing"""
    doc = fitz.open(pdf_path)
    for page in doc:
        if page.get_text().strip():
            return False
    return True

def search_in_text(text_pages: Dict[int, str], search_text: str) -> List[Dict[str, str]]:
    """Search for plain text in extracted text (case-insensitive)"""
    matches = []
    search_lower = search_text.lower()
    
    for page_num, text in text_pages.items():
        text_lower = text.lower()
        index = 0
        
        while True:
            index = text_lower.find(search_lower, index)
            if index == -1:
                break
                
            # Get the original case match
            original_match = text[index:index+len(search_text)]
            
            # Get surrounding context
            start_pos = max(0, index - 20)
            end_pos = min(len(text), index + len(search_text) + 20)
            context = text[start_pos:end_pos].replace('\n', ' ').strip()
            
            matches.append({
                "page": page_num,
                "match": original_match,
                "context": context,
                "position": index
            })
            
            index += len(search_text)  # Move past this match
    
    return matches


# Explicit OPTIONS handler
@ocr_router.options("/search_pdf")
async def preflight_handler():
    return JSONResponse(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "http://localhost",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    )

@ocr_router.post("/search_pdf")
async def search_pdf(
    filepath: str = Form(...),  # Just the filename, not full path
    search_text: str = Form(...),
    ocr_mode: str = Form("scanned")
):
    
    if '../' in filepath:
    # or not filepath.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Invalid file path")
    
    print(filepath)
    
    abs_path = os.path.join('../backend', filepath.lstrip('/'))

    # abs_path = filepath.lstrip('/')

    print(abs_path)
    
    if not os.path.exists(abs_path):
        raise HTTPException(404, "File not found. Upload file first via React.")
    
    try:
        # Your existing processing logic needs_ocr(filepath)

        ext = os.path.splitext(abs_path)[1].lower()

        if ext == '.pdf':
            if ocr_mode=='scanned':
                text_pages = extract_text_ocr(abs_path)
            else:
                text_pages = extract_text_direct(abs_path)
        elif ext in ['.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.webp']:
            text_pages = extract_text_ocr_from_image(abs_path)
        # text_pages = extract_text_ocr(abs_path)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        print(text_pages)
        
        results = search_in_text(text_pages, search_text)
        
        return {
            "search_text": search_text,
            "matches": results,
            "ocr_mode": ocr_mode,
            "filename": abs_path.split('/')[-1]  # Return for reference
        }
    except Exception as e:
        raise HTTPException(500, f"Processing failed: {str(e)}")
    
@ocr_router.post("/search_pdfs_in_directory")
async def search_pdfs_in_directory(
    folder_path: str = Form(...),
    search_text: str = Form(...),
    search_mode: str = Form("all_matches"),
    ocr_mode: str = Form("scanned")  # "scanned" or "text"
):
    if '../' in folder_path or not folder_path.startswith('/uploads'):
        raise HTTPException(status_code=400, detail="Invalid folder path")

    abs_dir_path = os.path.join('../backend', folder_path.lstrip('/'))

    if not os.path.exists(abs_dir_path) or not os.path.isdir(abs_dir_path):
        raise HTTPException(status_code=404, detail="Directory not found")

    results_by_file = []

    supported_image_exts = ('.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.webp')

    for filename in os.listdir(abs_dir_path):
        # if filename.endswith('.pdf'):
        if not (filename.endswith('.pdf') or filename.lower().endswith(supported_image_exts)):
            continue

        abs_file_path = os.path.join(abs_dir_path, filename)
        result = {
            "filename": filename,
            "matches": [],
            "ocr_mode": ocr_mode
        }
        try:
            print('Checking in', abs_file_path)
            if filename.endswith('.pdf'):
                if ocr_mode == "scanned":
                    images = convert_from_path(abs_file_path)
                    for page_num, image in enumerate(images, start=1):
                        text = pytesseract.image_to_string(image)
                        match_data = search_in_text({page_num: text}, search_text)
                        
                        if match_data:
                            result["matches"].extend(match_data)

                            if search_mode == "first_match_any_pdf":
                                return {
                                    "folder": folder_path,
                                    "search_text": search_text,
                                    "results": [result]
                                }
                            elif search_mode == "first_match_per_pdf":
                                break  # stop searching this file
                else:  # text-based PDF
                    doc = fitz.open(abs_file_path)
                    for page_num in range(len(doc)):
                        page = doc.load_page(page_num)
                        text = page.get_text()
                        match_data = search_in_text({page_num + 1: text}, search_text)

                        if match_data:
                            result["matches"].extend(match_data)

                            if search_mode == "first_match_any_pdf":
                                return {
                                    "folder": folder_path,
                                    "search_text": search_text,
                                    "results": [result]
                                }
                            elif search_mode == "first_match_per_pdf":
                                break  # Stop processing this file after first match
            else:
                # --- Handle image files ---
                with Image.open(abs_file_path) as image:
                    text = pytesseract.image_to_string(image)
                    match_data = search_in_text({1: text}, search_text)

                    if match_data:
                        result["matches"].extend(match_data)

                        if search_mode == "first_match_any_pdf":
                            return {
                                "folder": folder_path,
                                "search_text": search_text,
                                "results": [result]
                            }
            if result["matches"]:
                results_by_file.append(result)

        except Exception as e:
            results_by_file.append({
                "filename": filename,
                "error": str(e),
                "matches": []
            })

    return {
        "folder": folder_path,
        "search_text": search_text,
        "results": results_by_file
    }


@ocr_router.post("/search_uploaded_pdf")
async def search_uploaded_pdf(
    file: UploadFile = File(...),
    search_text: str = Form(...),
    ocr_mode: str = Form("scanned")
):
    temp_path = None
    try:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
        
        # Auto-create a temp file (no folder management needed)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp:
            content = await file.read()
            temp.write(content)
            temp_path = temp.name  # OS-managed temp path
        

        if ocr_mode == "scanned":
            text_pages = extract_text_ocr(temp_path)
        else:
            text_pages = extract_text_direct(temp_path)

        results = search_in_text(text_pages, search_text)

        # os.unlink(temp_path)  
        # os.remove(temp_path)

        return {
            "filename": file.filename,
            "matches": results,
            "ocr_used": (ocr_mode == "scanned")
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to process uploaded PDF: {str(e)}")
    finally:
        # Cleanup temp file if it was created
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)  # unlink and remove are the same
            except Exception as cleanup_error:
                print(f"Failed to cleanup temp file: {cleanup_error}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(ocr_router, host="0.0.0.0", port=8000, log_level="debug" )