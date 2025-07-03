import React, { useState } from 'react';
import { dbAPI } from '../../api/api';
import BackButton from '../../components/buttons/BackButton';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function MongoDBTools() {
  const [tab, setTab] = useState('export'); // 'export' or 'import'
  const [collections, setCollections] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState({});
  const [message, setMessage] = useState('');
  const [importDBName, setImportDBName] = useState('cmap');
  const [exportDBName, setExportDBName] = useState('cmap');
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [importMode, setImportMode] = useState('append');

  const loadCollections = async () => {
    setLoadingCollections(true);
    try {
      const cols = await dbAPI.getCollections();
      setCollections(cols);
      toast.success('Collections Loaded successfully!');
    } catch {
      toast.error('Failed to load collections.');
    } finally {
      setLoadingCollections(false);
    }
  };

  const handleCheckboxChange = (collection) => {
    setSelectedCollections((prev) =>
      prev.includes(collection)
        ? prev.filter((c) => c !== collection)
        : [...prev, collection]
    );
  };

  const handleExport = async () => {
    try {
      const blob = await dbAPI.exportDB(selectedCollections);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${exportDBName || 'cmap'}_${timestamp}.zip`;
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      toast.success('Export successful!');
    } catch {
      toast.error('Export failed');
    }
  };

  const handleFileChange = async (e) => {
    const f = e.target.files[0];
    setFile(f);
    setPreview({});
    setMessage('');
    if (f) {
      try {
        const previewData = await dbAPI.previewImport(f);
        setPreview(previewData);
        toast.success('Preview loaded');
      } catch {
        toast.error('Preview failed');
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }
    try{
      const result = await dbAPI.importDB(file, importDBName, importMode)
      // setMessage(result.message);
      let message = result.message || 'Import successful';

      if (result.skipped && Object.keys(result.skipped).length > 0) {
        const skippedSummary = Object.entries(result.skipped)
          .map(([collection, data]) => `${data.skippedCount} in ${collection}`)
          .join(', ');
        message += ` (Skipped: ${skippedSummary})`;
      }

      toast.success(message);
      // toast.success(result.message || 'Import successful');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import failed');
    }
  }

  return (
    <div>
    <BackButton label='Dashboard'/>
    <h1 className="text-center my-4">Database Export/Import</h1>
    <div className="container" style={{ maxWidth: 900, margin: 'auto', padding: 20 }}>
      <div className="mb-3 d-flex justify-content-center">
          <ul className="nav nav-tabs main-tabs">
              <li className="nav-item">
              <button className={`nav-link ${tab === "export" ? "active" : ""}`}
                  onClick={() => setTab("export")}>
                  <i className="fas fa-upload me-2"></i>
                  Export
              </button>
              </li>
              <li className="nav-item">
              <button className={`nav-link ${tab === "import" ? "active" : ""}`}
                  onClick={() => setTab("import")}>
                  <i className="fas fa-download me-2"></i>
                  Import
              </button>
              </li>
          </ul>
      </div>
      {/* --- EXPORT TAB --- */}
      {tab === 'export' && (
        <div>
          <div className="mb-3 d-flex align-items-center justify-content-center">
            <button
              className="btn btn-secondary"
              onClick={loadCollections}
              disabled={loadingCollections}
            >
              {loadingCollections ? 'Loading...' : 'Load Collections'}
            </button>
          </div>
          {collections.length > 0 && (
            <>
              <h5>Select Collections to Export:</h5>
              <div className="mb-2 d-flex gap-2">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setSelectedCollections(collections)}
                >
                  Select All
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setSelectedCollections([])}
                >
                  Unselect All
                </button>
              </div>
              <div className="row mb-3">
                {collections.map((col, index) => (
                  <div className="col-md-4" key={col}>
                    <label className="form-check-label">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedCollections.includes(col)}
                        onChange={() => handleCheckboxChange(col)}
                      />
                      &nbsp;{col}
                    </label>
                  </div>
                ))}
              </div>
              <div className="mb-3">
                <label className="form-label">
                  <strong>Export Database Name</strong>
                </label>            
                <input
                  type="text"
                  value={exportDBName}
                  onChange={(e) => setExportDBName(e.target.value.trim())}
                  placeholder="DB name for export file"
                  className="form-control"
                  style={{ width: 250 }}
                />
                <button
                  className="btn btn-success mt-3"
                  onClick={handleExport}
                  disabled={selectedCollections.length === 0}
                >
                  Export Selected
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* --- IMPORT TAB --- */}
      {tab === 'import' && (
        <div>
          <div className="mb-3">
            <label className="form-label"><strong>Upload ZIP File</strong></label>
            <input
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              className="form-control"
            />
          </div>
          {file &&
          <div>
            <label className="form-label"><strong>Import Mode</strong></label>
           <div className="form-check form-switch mb-3">
              <input
                  className="form-check-input"
                  type="checkbox"
                  id="importModeToggle"
                  checked={importMode === "append"}
                  onChange={() => setImportMode(importMode === "append" ? "override" : "append")}
              />
              <label className="form-check-label" htmlFor="importModeToggle">
                  {importMode === "append" ? "Append" : "Override"}
              </label>
          </div>
          </div>
          }
          {file && (
            <div className="mb-3">
              <label className="form-label">
                <strong>Import Database as</strong>
              </label>
              <input
                type="text"
                value={importDBName}
                onChange={(e) => setImportDBName(e.target.value.trim())}
                className="form-control"
                placeholder="e.g. newdb"
              />
              <button className="btn btn-primary mt-2" onClick={handleImport}>
                Import
              </button>
            </div>
          )}

          {message && <div className="alert alert-success mt-3">{message}</div>}

          {Object.keys(preview).length > 0 && (
            <div className="mt-4">
              <h5>Preview (First 5 Documents Per Collection)</h5>

              {/* Pagination State */}
{(() => {
  const itemsPerPage = 8;
  const collections = Object.entries(preview);
  const totalPages = Math.ceil(collections.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageItems = collections.slice(startIndex, startIndex + itemsPerPage);

  const leftColumn = [];
  const rightColumn = [];

  pageItems.forEach((item, index) => {
    if (index % 2 === 0) {
      leftColumn.push(item);
    } else {
      rightColumn.push(item);
    }
  });

  return (
    <>
      <div className="row">
        <div className="col-md-6">
          {leftColumn.map(([collection, docs]) => (
            <div key={collection} className="card mb-3">
              <div className="card-header">{collection}</div>
              <div className="card-body" style={{ maxHeight: 200, overflowY: 'auto' }}>
                <pre style={{ fontSize: 12 }}>{JSON.stringify(docs, null, 2)}</pre>
              </div>
            </div>
          ))}
        </div>
        <div className="col-md-6">
          {rightColumn.map(([collection, docs]) => (
            <div key={collection} className="card mb-3">
              <div className="card-header">{collection}</div>
              <div className="card-body" style={{ maxHeight: 200, overflowY: 'auto' }}>
                <pre style={{ fontSize: 12 }}>{JSON.stringify(docs, null, 2)}</pre>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <button
          className="btn btn-sm btn-outline-primary"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        >
          &laquo; Prev
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          className="btn btn-sm btn-outline-primary"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
        >
          Next &raquo;
        </button>
      </div>
    </>
  );
})()}

            </div>
          )}

        </div>
      )}

    </div>
    </div>
  );
}

export default MongoDBTools;
