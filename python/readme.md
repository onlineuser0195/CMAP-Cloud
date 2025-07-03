To run python ocr FastAPI:

If using Windows, download:
1. Tesseract 
https://github.com/UB-Mannheim/tesseract/wiki

2. Poppler
https://poppler.freedesktop.org/
https://github.com/oschwartz10612/poppler-windows/releases/tag/v24.08.0-0

(For Linux:
sudo apt install tesseract-ocr
sudo apt install -y tesseract-ocr-eng
sudo apt install poppler-utils
)

To verify installaiton:
tesseract --version
tesseract --list-langs
pdftoppm -v

Then =>

cd python_ocr
python -m venv venv
pip install requirements.txt
(
# # if you still have missing requirements, you can directnly pip install the following:
# # pip install fastapi uvicorn python-multipart fitz pytesseract pdf2image pillow
# # sudo apt install poppler-utils tesseract-ocr
)
RUN:
python image_ocr_service.py
OR
uvicorn image_ocr_service:app --reload

TESTING:
# # curl -X POST http://localhost:8000/search_pdf -H "Content-Type: application/json" -d '{"filepath":"test.pdf","search_text":"sample"}'
# # curl -X POST -F "pdf=@sample.pdf" http://127.0.0.1:8000/process_pdf
