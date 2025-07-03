// src/services/pdfAPI.jsx
import axios from 'axios';
const VITE_API_URL = import.meta.env.VITE_API_URL;

const PYTHON_API_URL = import.meta.env.PYTHON_API_URL;; // FastAPI endpoint

export const searchPDF = async (relativePath, searchText, ocrMode, systemId=null) => {
  try {
    const formData = new FormData();
    // const relativePath = '../backend/' + filepath;

    let decryptedPath = relativePath;

    if (relativePath.endsWith('.enc')) {
      const { decryptedPath: dp } = await tempDecryptFolder(
        relativePath,
        systemId
      );
      decryptedPath = dp;
    }

    formData.append('filepath', decryptedPath);
    formData.append('search_text', searchText);
    formData.append('ocr_mode', ocrMode);

    console.log('pdfAPI',decryptedPath);

    const response = await axios.post(`${PYTHON_API_URL}/python-api/search_pdf`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Search failed:', error.response?.data || error.message);
    throw error;
  }
};

export const searchMultiplePDFs = async (folderPath, searchText, searchMode = 'first_match_any_pdf', ocrMode, systemId=null) => {
  const formData = new FormData();

  const { decryptedDir } = await tempDecryptFolder(
    folderPath,
    systemId
  );

  console.log('DD',decryptedDir);

  formData.append('folder_path', decryptedDir);
  formData.append('search_text', searchText);
  formData.append('search_mode', searchMode);
  formData.append('ocr_mode', ocrMode);

  const response = await axios.post(`${PYTHON_API_URL}/python-api/search_pdfs_in_directory`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    withCredentials: true,
  });

  return response.data;
};


export const uploadAndSearchPDF = async (file, searchText, ocrMode, deleteAfterSearch, systemId = null) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('search_text', searchText);
  formData.append('ocr_mode', ocrMode);
  formData.append('delete_after_search', deleteAfterSearch);


  if (deleteAfterSearch) {
    // Temporary File Processing
    const response = await axios.post(`${PYTHON_API_URL}/python-api/search_uploaded_pdf`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
    });
    return response.data;

  } else {
    // Permanent File handling
    const saveFormData = new FormData();
    saveFormData.append('file', file);
    
    // 1. First save the file permanently
    const saveResponse = await axios.post(
      `${VITE_API_URL}/api/save-perm-file/${systemId}`, 
      saveFormData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    // 2. Then search the saved file using searchPDF
    // Construct the relative path that matches your backend structure
    const relativePath = `uploads/system-${systemId}/perm/${saveResponse.data.filename}`;
    //call searchPDF(relativePath, searchText, ocrMode)
    return await searchPDF(relativePath, searchText, ocrMode);
  }
};

export const tempDecryptFolder = async (encryptedPath, systemId = '') => {
  // send JSON, not multipart
  const { data } = await axios.post(
    `${VITE_API_URL}/api/decrypt-files/${systemId}`,
    { path: encryptedPath },
    { timeout: 30000 }
  );
  // data.decryptedPath for single file, or data.decryptedDir for directory
  return data;
};

export const uploadTempFile = async (file, systemId = null) => {

  // Temporary File handling
  const saveFormData = new FormData();
  saveFormData.append('file', file);
  
  // 1. First save the file temporarily
  const uploadResponse = await axios.post(
    `${VITE_API_URL}/api/upload-temp-file/${systemId}`, 
    saveFormData,
    { headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000 // 30 second timeout
   }
  );

    return uploadResponse.data ;


  // // 2. Then search the saved file using searchPDF
  // // Construct the relative path that matches your backend structure
  // const relativePath = `uploads/system-${systemId}/temp/${uploadResponse.data.filename}`;
  // //call searchPDF(relativePath, searchText, ocrMode)
  // // return await searchPDF(relativePath, searchText, ocrMode);
  // return relativePath
};

export const cleanupTempFiles = async(systemId) => {
    try {
        const response = await axios.get(`${VITE_API_URL}/api/cleanup-temp-files/${systemId}`);
        // return response.data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

export const getAllPermFiles = async (systemId) => {
    try {
        const response = await axios.get(`${VITE_API_URL}/api/list-permanent-files/${systemId}`);
        return response.data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};


// app.post("/upload", upload.single("pdf"), (req, res) => {
//     const pdfPath = path.join(__dirname, req.file.path);

//     execFile("python3", ["ocr_script.py", pdfPath], (err, stdout, stderr) => {
//         fs.unlinkSync(pdfPath); // Clean up uploaded file
//         if (err) {
//             console.error(stderr);
//             return res.status(500).json({ error: "OCR processing failed" });
//         }
//         const passportIds = JSON.parse(stdout);
//         res.json({ passportIds });
//     });
// });