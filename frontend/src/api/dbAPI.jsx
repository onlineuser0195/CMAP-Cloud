import axios from 'axios';
const VITE_API_URL = import.meta.env.VITE_API_URL;

export const getCollections = async () => {
  const response = await axios.get(`${VITE_API_URL}/api/collections`);
  return response.data;
};

export const exportDB = async (selectedCollections) => {
  const response = await axios.post(`${VITE_API_URL}/api/export_db`, {
    collections: selectedCollections
  }, {
    responseType: 'blob'
  });
  return response.data;
};

export const previewImport = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${VITE_API_URL}/api/preview_import`, formData);
  return response.data;
};

export const importDB = async (file, importDBName = 'importeddb', importMode = 'append') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('importDBName', importDBName);
  formData.append('importMode', importMode); // could be 'override' or 'append'

  const response = await axios.post(`${VITE_API_URL}/api/import_db`, formData);
  return response.data;
};