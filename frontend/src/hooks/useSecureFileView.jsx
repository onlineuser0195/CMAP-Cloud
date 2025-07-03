import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { formResponseAPI } from '../api/api';

const useSecureFileView = () => {
  const [blobUrl, setBlobUrl] = useState(null);

  const viewFile = useCallback(async (systemId, formId, filename, mimetype) => {
    try {
      const response = await formResponseAPI.getFile(systemId, formId, filename, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: mimetype });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
    } catch (error) {
      console.error('View file error:', error);
      toast.error('Failed to load file');
    }
  }, []);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl); // cleanup
    };
  }, [blobUrl]);

  return { blobUrl, viewFile };
};

export default useSecureFileView;
