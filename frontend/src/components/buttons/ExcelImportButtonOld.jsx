import React from 'react';
import * as XLSX from 'xlsx';
import { formResponseAPI } from '../../api/api';
import { FVS_FIELD_MAPPING_CSV } from '../../constants/constants';

const ExcelImportButton = ({ onImportComplete, formId, systemId }) => {
  const generateGroupId = () => {
    return Date.now();
  };

  const generateObjectId = () => {
    const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
    const random = 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () =>
      Math.floor(Math.random() * 16).toString(16)
    );
    return timestamp + random;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      if (jsonData.length === 0) {
        alert('The file is empty');
        return;
      }

      const groupId = generateGroupId();
      const createdResponses = [];

      // Process each row sequentially
      for (const row of jsonData) {
        const fieldsMap = new Map();
        
        // Map each Excel column to its corresponding field ID
        Object.entries(row).forEach(([header, value]) => {
          const fieldId = FVS_FIELD_MAPPING_CSV[header.trim()];
          if (fieldId) {
            // Convert dates to ISO string format if they're date fields
            if (header === 'Start Date' || header === 'End Date') {
              let dateStr;
              
              // Check if value is an Excel serial date number
              if (typeof value === 'number' && value > 0) {
                // Convert Excel serial date to JS Date
                const date = new Date(Math.round((value - 25569) * 86400 * 1000));
                dateStr = formatDateToYMD(date);
              } else {
                // Try parsing as string date
                try {
                  dateStr = formatDateToYMD(new Date(value));
                } catch {
                  dateStr = String(value); // Fallback to string if parsing fails
                }
              }
              
              fieldsMap.set(fieldId, dateStr);
            }  else {
              fieldsMap.set(fieldId, String(value));
            }          
          }
        });

        // // Prepare the response data
        // const responseData = {
        //   fields: Object.fromEntries(fieldsMap),
        //   group_id: groupId
        // };

        try {
          // Call updateFormResponse for each entry
          const updatedResponse = await formResponseAPI.updateFormResponse(
            generateObjectId(),
            formId,
            systemId,
            Object.fromEntries(fieldsMap),
            'in_progress',
            false, //hasAttachment
            groupId
          );

          createdResponses.push(updatedResponse);
        } catch (error) {
          console.error(`Error saving record: ${JSON.stringify(row)}`, error);
          // Continue with next record even if one fails
          continue;
        }
      }

      if (onImportComplete) {
        onImportComplete(createdResponses);
      }
      
      alert(`Successfully imported ${createdResponses.length}/${jsonData.length} visitor records with group ID: ${groupId}`);
    } catch (error) {
      console.error('Error importing file:', error);
      alert(`Error importing file: ${error.message || 'Please check the format and try again.'}`);
    } finally {
      e.target.value = '';
    }
  };

// Helper function to format date as YYYY-MM-DD
const formatDateToYMD = (date) => {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};
  return (
    <div style={{ marginLeft: 10 }}>
      <label htmlFor="excel-upload" style={{
        backgroundColor: '#4CAF50',
        color: 'white',
        padding: '7px 12px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor"
          className="bi bi-file-earmark-excel-fill" viewBox="0 0 16 16">
          <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1M5.884 6.68 8 9.219l2.116-2.54a.5.5 0 1 1 .768.641L8.651 10l2.233 2.68a.5.5 0 0 1-.768.64L8 10.781l-2.116 2.54a.5.5 0 0 1-.768-.641L7.349 10 5.116 7.32a.5.5 0 1 1 .768-.64"/>
        </svg>
        Import From Excel
      </label>

      <input
        type="file"
        id="excel-upload"
        accept=".xlsx, .xls, .csv"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ExcelImportButton;