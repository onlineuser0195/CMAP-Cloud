import React, { useState, useEffect } from 'react';
import { pdfAPI } from '../api/api';
import '../styles/layouts/PDFSearch.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PDFSearch = ({ systemId, formId }) => {
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState(null);
  const [searchMode, setSearchMode] = useState("first_match_any_pdf");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("search"); // "search" or "upload"
  const [ocrMode, setOcrMode] = useState("scanned"); // "scanned" or "text"
  const [uploadFile, setUploadFile] = useState(null);
  const [deleteAfterSearch, setDeleteAfterSearch] = useState(true);
  const [existingFiles, setExistingFiles] = useState([]);
  const [selectedExistingFile, setSelectedExistingFile] = useState("");
  const [currentTempFilePath, setCurrentTempFilePath] = useState(null);
  const [uploadSubTab, setUploadSubTab] = useState("upload_new"); // "upload" or "existing"

useEffect(() => {
  const fetchFiles = async () => {
    try {
      const res = await pdfAPI.getAllPermFiles(systemId);
      setExistingFiles(res.files || []);
    } catch (err) {
      console.error("Failed to fetch permanent files:", err);
      setExistingFiles([]);
    }
  };
  
  // Fetch when tab changes to upload
  if (activeTab === "upload") {
    fetchFiles();
  }
  
  // Also fetch when uploadFile changes (in case of new permanent uploads)
}, [activeTab, uploadFile, systemId]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (currentTempFilePath) {
        pdfAPI.cleanupTempFiles(systemId).catch(console.error);
      }
    };
  }, [currentTempFilePath]);
  
  const handleSearch = async () => {
    setLoading(true);
    try {
        if (activeTab === "search") {
        const folder = `/uploads/system-${systemId}/form-${formId}/`;
        const data = await pdfAPI.searchMultiplePDFs(folder, searchText, searchMode, ocrMode, systemId);
        setResults(data.results);
        } else if (selectedExistingFile) {
        const filepath = `/uploads/system-${systemId}/perm/${selectedExistingFile}`;
        const data = await pdfAPI.searchPDF(filepath, searchText, ocrMode, systemId);
        setResults(data.matches ? [{ filename: selectedExistingFile, matches: data.matches }] : []);
        }  else if (uploadFile && deleteAfterSearch) {
          let tempPath = currentTempFilePath;
          if (!tempPath) {
            const uploadResponse = await pdfAPI.uploadTempFile(uploadFile, systemId);
            tempPath = uploadResponse.path;
            setCurrentTempFilePath(tempPath); // Store for future searches
          }
          // Search existing temp file
          const data = await pdfAPI.searchPDF(
            tempPath,
            // || uploadFile.name
            searchText,
            ocrMode,
            systemId
          );
          setResults(data.matches ? [{ filename: data.filename, matches: data.matches }] : []);
        } else if (uploadFile && !deleteAfterSearch) {
        const data = await pdfAPI.uploadAndSearchPDF(uploadFile, searchText, ocrMode, deleteAfterSearch, systemId);
        setResults(data.matches ? [{ filename: data.filename, matches: data.matches }] : []);

        // If we saved permanently, update the file list and select the new file
        if (!deleteAfterSearch) {
          const res = await pdfAPI.getAllPermFiles(systemId);
          setExistingFiles(res.files || []);
          setSelectedExistingFile(data.filename);
          setUploadFile(null); // Clear the upload file input
          setUploadSubTab('existing');
        }


        } else {
        toast.error("Please upload or select a file.");
        }
    } catch (err) {
        console.error(err);
        toast.error("Search failed.");
    } finally {
        setLoading(false);
    }
  };


  const handleFileChange = (e) => {
    if (currentTempFilePath) {
      pdfAPI.cleanupTempFiles(systemId).catch(console.error);
      setCurrentTempFilePath(null);
    }
    setUploadFile(e.target.files[0]);
    setSelectedExistingFile("");
    setUploadSubTab("upload_new");
  };

  return (
    <div className="container mt-4">
        <div className="mb-3 d-flex justify-content-center">
            <ul className="nav nav-tabs main-tabs">
                <li className="nav-item">
                <button className={`nav-link ${activeTab === "search" ? "active" : ""}`}
                    onClick={() => setActiveTab("search")}>
                    <i className="fas fa-search me-2"></i>
                    Search in Attachments
                </button>
                </li>
                <li className="nav-item">
                <button className={`nav-link ${activeTab === "upload" ? "active" : ""}`}
                    onClick={() => setActiveTab("upload")}>
                    <i className="fas fa-upload me-2"></i>
                    Upload and Search
                </button>
                </li>
            </ul>
        </div>
        <div className="form-check form-switch mb-3">
            <input
                className="form-check-input"
                type="checkbox"
                id="ocrToggle"
                checked={ocrMode === "scanned"}
                onChange={() => setOcrMode(ocrMode === "scanned" ? "text" : "scanned")}
            />
            <label className="form-check-label" htmlFor="ocrToggle">
                {ocrMode === "scanned" ? "Scanned PDF/Image (OCR)" : "Text-based PDF/Image (OCR)"}
            </label>
        </div>
        {/* <h4>Search All Attachments</h4> */}
        <div className="input-group mb-3">
            <input
            type="text"
            className="form-control"
            placeholder="Enter search text..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            />
           {activeTab === "search" && <div>
                {/* <label className="form-label">Search Mode</label> */}
                <select
                    className="form-select"
                    value={searchMode}
                    onChange={(e) => setSearchMode(e.target.value)}
                >
                    <option value="" disabled>--Select a Search Mode--</option>
                    <option value="first_match_any_pdf">First Match in Any File</option>
                    <option value="first_match_per_pdf">First Match in Each File</option>
                    <option value="all_matches">All Matches in All Files</option>
                </select>
            </div>}
            <button className="btn btn-primary" onClick={handleSearch} disabled={!searchText || loading}>
                {loading ? "Searching..." : "Search"}
            </button>
        </div>


        {activeTab === "upload" && (
            <>
              <div className="mb-3 sub-tabs-container">
                <ul className="nav nav-tabs sub-tabs">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${uploadSubTab === "upload_new" ? "active" : ""}`}
                      onClick={() => setUploadSubTab("upload_new")}
                    >
                      <i className="fas fa-file-upload me-2"></i>
                      Upload New
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${uploadSubTab === "existing" ? "active" : ""}`}
                      onClick={() => setUploadSubTab("existing")}
                    >
                      <i className="fas fa-folder-open me-2"></i>
                      Existing File
                    </button>
                  </li>
                </ul>
              </div>

              {uploadSubTab === "upload_new" ? (
                <>
                  <div className="mb-3">
                    <input
                      type="file"
                      accept="application/pdf, image/*"
                      className="form-control"
                      onChange={handleFileChange}
                      key={selectedExistingFile || "default"} // Reset when a file is selected
                      value={selectedExistingFile ? "" : undefined} // Clear when selecting existing file
                    />
                  </div>
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="deleteToggle"
                      checked={deleteAfterSearch}
                      onChange={() => setDeleteAfterSearch(!deleteAfterSearch)}
                    />
                    <label className="form-check-label" htmlFor="deleteToggle">
                      Delete file after search?
                    </label>
                  </div>
                </>
              ) : (
                <div className="mb-3">
                  <label className="form-label">Select previously uploaded file</label>
                  <select
                    className="form-select"
                    value={selectedExistingFile}
                    onChange={(e) => setSelectedExistingFile(e.target.value)}
                  >
                    <option value="">-- Select a file --</option>
                    {existingFiles.map((file, idx) => (
                      <option key={idx} value={file}>{file}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
        )}

      {loading && (
        <div className="text-center my-4">
            <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Searching...</span>
            </div>
            <div className="mt-2">Searching PDFs, please wait...</div>
        </div>
      )}


      {!loading  && results && results.length > 0 ? (
        <div className="results-list">
          {results.map((file, idx) => (
            <div key={idx} className="card mb-3">
              <div className="card-header">
                <strong>{file.filename}</strong> {file.ocr_used && <span className="badge bg-info ms-2">OCR</span>}
              </div>
              <div className="card-body">
                {file.matches && file.matches.length > 0 ? (
                  file.matches.map((match, mIdx) => (
                    <div key={mIdx} className="mb-2">
                      <div className="small text-muted">Page {match.page} - Position {match.position}</div>
                      <div>
                        ...{match.context.substring(0, 50)}
                        <mark>{match.match}</mark>
                        {match.context.substring(50)}...
                      </div>
                    </div>
                  ))
                ) : (
                  <em>No matches found</em>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : !loading  && results ? (
        <p>No matches found in any file.</p>
      ) : null}
    </div>
  );
};

export default PDFSearch;
