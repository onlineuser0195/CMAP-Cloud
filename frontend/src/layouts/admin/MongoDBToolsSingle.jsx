import React, { useState } from 'react';
import { dbAPI } from '../../api/api';

const MongoDBTools = () => {
  const [importStatus, setImportStatus] = useState('');
  const [exportStatus, setExportStatus] = useState('');
  const [fileName, setFileName] = useState('');

  const handleExport = async() => {
    setExportStatus('Exporting...');
    try {
        const blob = await dbAPI.exportDB();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'backup.json';
        a.click();
        setExportStatus('Export successful!');
      } catch{() => setExportStatus('Export failed.')}
  };

  const handleImport = async(event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setImportStatus('Importing...');

    const formData = new FormData();
    formData.append('file', file);
    try {
        const result = await dbAPI.importDB(file);
        setImportStatus(result.success ? 'Import successful!' : 'Import failed.');
    }   catch {
        setImportStatus('Import failed.');
    }   
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4">MongoDB Import & Export Tool</h2>
      
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h5 className="card-title">Export Database</h5>
          <p className="card-text">Download a JSON backup of the entire database.</p>
          <button className="btn btn-primary" onClick={handleExport}>Export Database</button>
          {exportStatus && <p className="mt-2 text-info">{exportStatus}</p>}
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="card-title">Import Database</h5>
          <p className="card-text">
            Select a `.json` file to replace your current database contents.
          </p>
          <input
            type="file"
            accept=".json"
            className="form-control"
            onChange={handleImport}
          />
          {fileName && <p className="mt-2">Selected file: <strong>{fileName}</strong></p>}
          {importStatus && <p className="mt-2 text-info">{importStatus}</p>}
        </div>
      </div>
    </div>
  );
};

export default MongoDBTools;
