import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { formResponseAPI } from '../api/api';

const useSecureFileDownload = () => {
  const downloadFile = useCallback(async (systemId, formId, filename, originalname, mimetype) => {
    try {
      const response = await formResponseAPI.getFile(systemId, formId, filename, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: mimetype });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = originalname;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed');
    }
  }, []);

  return { downloadFile };
};

export default useSecureFileDownload;
