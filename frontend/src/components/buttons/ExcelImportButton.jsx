import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { formResponseAPI } from '../../api/api';
import { FVS_FIELD_MAPPING_CSV } from '../../constants/constants';
import ImportReviewModal from './ImportReviewModal';
import useAuth from '../../hooks/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/components/buttons/ExcelImportButton.css';

const ExcelImportButton = ({ onImportComplete, formId, systemId }) => {
  const [importGroupId, setImportGroupId] = useState(null);
  const [importedRows, setImportedRows] = useState([]);
  const { userId } = useAuth();   

  const generateGroupId = () => Date.now();

  const generateObjectId = () => {
    const timestamp = Math.floor(Date.now() / 1000)
      .toString(16);
    const random = 'xxxxxxxxxxxxxxxx'.replace(/x/g, () =>
      Math.floor(Math.random() * 16).toString(16)
    );
    return timestamp + random;
  };

  const formatDateToYMD = (date) => {
    const d = new Date(date);
    if (isNaN(d)) return '';
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      if (json.length === 0) {
        toast.error('The file is empty');
        return;
      }

      // Assign a new group id for this batch import
      const groupId = generateGroupId();
      setImportGroupId(groupId);

      // Build local-only rows array (no API calls yet!)
      const rows = json.map(row => {
        const fields = {};
        Object.entries(row).forEach(([col, val]) => {
          const fieldId = FVS_FIELD_MAPPING_CSV[col.trim()];
          if (!fieldId) return;
          if (col === 'Start Date' || col === 'End Date') {
            if (typeof val === 'number') {
              // Excel serial → JS Date
              const dt = new Date((val - 25569) * 86400 * 1000);
              fields[fieldId] = formatDateToYMD(dt);
            } else {
              fields[fieldId] = formatDateToYMD(val);
            }
          } else {
            fields[fieldId] = String(val ?? '');
          }
        });

        return {
          // temp id for editing in the UI, turned into the real _id when you save
          _id: generateObjectId(),
          form_id: formId,
          system_id: systemId,
          group_id: groupId,
          progress: 'in_progress',
          fields
        };
      });

      setImportedRows(rows);
    } catch (err) {
      console.error(err);
      toast.error(`Error importing file: ${err.message}`);
    } finally {
      e.target.value = '';
    }
  };

  const handleModalSave = async (rowsToSave) => {
    try {
      const promises = rowsToSave.map(r =>
        formResponseAPI.updateFormResponse(
          r._id,
          r.form_id,
          r.system_id,
          r.fields,
          r.progress,
          userId,
          false,
          r.group_id
        )
      );
      const created = await Promise.all(promises);

      // let parent know, if needed
      onImportComplete?.(created);
      toast.success(`Imported ${created.length}/${rowsToSave.length} records.`);
    } catch (err) {
      console.error(err);
      toast.error('Error saving some records. See console.');
    } finally {
      setImportedRows([]);
      setImportGroupId(null);
    }
  };

  // const handleModalSave = async (rowsToSave) => {
  //   try {
  //     // Fetch the current maximum display_id for this form
  //     const { data: { maxDisplayId = 0 } } = await formResponseAPI.getMaxDisplayId(formId, systemId);
  //     let currentDisplayId = maxDisplayId + 1;

  //     // Assign sequential display_ids to each row
  //     const rowsWithDisplayIds = rowsToSave.map(row => ({
  //       ...row,
  //       display_id: currentDisplayId++
  //     }));

  //     // Send each row to the API with display_id
  //     const promises = rowsWithDisplayIds.map(r =>
  //       formResponseAPI.updateFormResponse(
  //         r._id,
  //         r.form_id,
  //         r.system_id,
  //         r.fields,
  //         r.progress,
  //         false,
  //         r.group_id,
  //         r.display_id  // Include display_id in the API call
  //       )
  //     );
  //     const created = await Promise.all(promises);

  //     onImportComplete?.(created);
  //     alert(`Imported ${created.length} records.`);
  //   } catch (err) {
  //     console.error(err);
  //     alert('Error saving records. See console.');
  //   } finally {
  //     setImportedRows([]);
  //     setImportGroupId(null);
  //   }
  // };

  const handleModalCancel = () => {
    // just wipe out the local rows — never called the API
    setImportedRows([]);
    setImportGroupId(null);
  };

  return (
    <>
    <div>
      <label htmlFor="excel-upload" className="excel-upload-label" style={{
        backgroundColor: "rgb(13, 102, 180)",
        // backgroundColor: '#4CAF50',
        color: 'white',
        padding: '7px 12px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        height: '100%',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"
          className="bi bi-file-earmark-excel-fill" viewBox="0 0 16 16">
          <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1M5.884 6.68 8 9.219l2.116-2.54a.5.5 0 1 1 .768.641L8.651 10l2.233 2.68a.5.5 0 0 1-.768.64L8 10.781l-2.116 2.54a.5.5 0 0 1-.768-.641L7.349 10 5.116 7.32a.5.5 0 1 1 .768-.64"/>
        </svg>
        IMPORT REQUESTS
      </label>

      <input
        type="file"
        id="excel-upload"
        accept=".xlsx, .xls, .csv"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>

      {importedRows.length > 0 && (
        <ImportReviewModal
          rows={importedRows}
          onSave={(keptRows) => handleModalSave(keptRows)}
          onCancel={handleModalCancel}
        />
      )}
    </>
  );
};

export default ExcelImportButton;
