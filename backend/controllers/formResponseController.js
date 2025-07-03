import { FormResponse } from '../models/formResponse.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { FVS_FIELD_MAPPING, USER_ROLES, PRISM_FIELD_MAPPING, PRISM_SYSTEM } from '../constants/constants.js';
import ForeignVisitsSchema from '../models/foreignVisits.js';
import { Mutex } from 'async-mutex';
import UserSchema from '../models/user.js';

import crypto from 'crypto';
const ALGORITHM = 'aes-256-cbc';
// 32-byte (256-bit) key, e.g. set in your .env as hex:
const KEY = Buffer.from(process.env.FILE_ENCRYPTION_KEY, 'hex');
const IV_LENGTH = 16;

const mutex = new Mutex();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// export const serveAttachment = (req, res) => {
//   const { systemId, formId, filename } = req.params;
//   const filePath = path.join(__dirname, `../uploads/system-${systemId}/form-${formId}`, filename); // Adjust path as needed

//   if (!fs.existsSync(filePath)) {
//     return res.status(404).json({ message: 'File not found' });
//   }

//   // Force browser to interpret as PDF
//   res.setHeader('Content-Type', 'application/pdf');

//   // Optionally: inline display
//   res.setHeader('Content-Disposition', 'inline');

//   res.sendFile(filePath);
// };

// in formResponseController.js
export const serveAttachment = async (req, res) => {
  const { systemId, formId, respId, fieldId, filename } = req.params;

  // 1) Fetch the exact response
  const resp = await FormResponse.findOne({
    _id:       respId,
    system_id: +systemId,
    form_id:   +formId
  });
  if (!resp) {
    return res.status(404).json({ message: 'Not found or unauthorized' });
  }

  // 2) Grab the metadata for that one field
  //    resp.fields is a Map stored in Mongo
  const fileMeta = resp.fields.get(fieldId.toString());
  if (
    !fileMeta ||
    fileMeta.filename !== filename    // guard against mismatched filename
  ) {
    return res.status(404).json({ message: 'File metadata missing' });
  }

  const { mimetype, originalname, path: filePath, iv: ivHex } = fileMeta;


  // // 3) Stream-decrypt and send
  // const iv       = Buffer.from(fileMeta.iv, 'hex');
  // const encPath  = fileMeta.path;      // points to ".../file-XYZ.pdf.enc"
  // const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, iv);

  res.setHeader('Content-Type',        fileMeta.mimetype);
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${fileMeta.originalname}"`
  );

  // 3) Branch on whether it’s encrypted
  if (ivHex && filePath.endsWith('.enc')) {
    // encrypted: decrypt on the fly
    const iv       = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, iv);

    fs.createReadStream(filePath)
      .pipe(decipher)
      .on('error', err => {
        console.error('Decrypt stream error', err);
        res.sendStatus(500);
      })
      .pipe(res);

  } else {
    // old unencrypted file: just stream straight
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }
    fs.createReadStream(filePath)
      .on('error', err => {
        console.error('Read stream error', err);
        res.sendStatus(500);
      })
      .pipe(res);
  }

  // fs.createReadStream(encPath)
  //   .pipe(decipher)
  //   .on('error', err => {
  //     console.error('Decrypt stream error', err);
  //     res.sendStatus(500);
  //   })
  //   .pipe(res);
};


export const updateFormResponse = async (req, res) => {
  try {
    const { respId, formId, systemId } = req.params;
    let currentUserId = req.body.userId || null;
    let progress = req.body.progress || 'in_progress';
    let groupId = req.body.groupId || null;

    const isMultipart = req.is('multipart/form-data');
    const fields = {};

    if (isMultipart) {
      Object.entries(req.body).forEach(([key, value]) => {
        if (key === 'progress' || key === 'groupId') return;
        try {
          fields[key] = JSON.parse(value);
        } catch {
          fields[key] = value;
        }
      });

      // if (req.files?.length) {
      //   req.files.forEach(file => {
      //     fields[file.fieldname] = {
      //       originalname: file.originalname,
      //       filename: file.savedAs || file.filename,
      //       mimetype: file.mimetype,
      //       size: file.size,
      //       path: file.path
      //     };
      //   });
      // }
      if (req.files?.length) {
        for (const file of req.files) {
          // 1) generate a fresh IV
          const iv    = crypto.randomBytes(IV_LENGTH);
          const ivHex = iv.toString('hex');            // 32 hex chars

          // 2) build your encrypted filename & path
          //    note the ivHex prefix, a dash separator, then the original safe name
          const dir             = path.dirname(file.path);
          const safeName        = file.savedAs || file.filename;  
          const encryptedName   = `${ivHex}-${safeName}.enc`;
          const encryptedPath   = path.join(dir, encryptedName);

          // 3) create cipher & streams
          const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
          await new Promise((resolve, reject) => {
            fs.createReadStream(file.path)   // the plaintext that multer just wrote
              .pipe(cipher)
              .pipe(fs.createWriteStream(encryptedPath))
              .on('finish', resolve)
              .on('error', reject);
          });

          // 4) delete the plaintext
          fs.unlinkSync(file.path);

          // 5) record the metadata, including the exact filename & path you used
          fields[file.fieldname] = {
            originalname: file.originalname,
            filename:     encryptedName,  // must match the actual disk name
            mimetype:     file.mimetype,
            size:         file.size,
            path:         encryptedPath,  // so decrypt logic reads the right file
            iv:           ivHex,
          };
        }
      }
    } else {
      Object.assign(fields, req.body.fields);
    }

    // PRISM
    // for saving the Gov Lead user id as ObjectId instead of String
    if (fields[PRISM_FIELD_MAPPING.governmentLead]?.id) {
      try {
        fields[PRISM_FIELD_MAPPING.governmentLead].id = new mongoose.Types.ObjectId(fields[PRISM_FIELD_MAPPING.governmentLead].id);
      } catch (err) {
        console.warn('Invalid ObjectId format for field government lead:', fields[PRISM_FIELD_MAPPING.governmentLead].id);
        // Optionally, handle invalid ObjectId
      }
    }

    const fieldsMap = new Map(Object.entries(fields));

    // Try to find the response (could be insert or update)
    const existing = await FormResponse.findOne({
      form_id: parseInt(formId),
      system_id: parseInt(systemId),
      _id: respId
    });

    let display_id;

    if (existing?.display_id) {
      // Keep existing display_id if present
      display_id = existing.display_id;
    } else {
      // Get next display_id in sequence
      const lastResponse = await FormResponse.findOne({
        form_id: parseInt(formId),
        system_id: parseInt(systemId)
      }).sort({ display_id: -1 });

      display_id = lastResponse?.display_id 
        ? String(parseInt(lastResponse.display_id, 10) + 1).padStart(9, '0')
        : '000000001';
    }
    // If response doesn't exist or exists but has no display_id → assign one
    // if (!existing || !existing.display_id) {
    //   const last = await FormResponse.findOne({
    //     form_id: parseInt(formId),
    //     system_id: parseInt(systemId)
    //   }).sort({ display_id: -1 });
    //   console.log(last.display_id);
    //   const next = last?.display_id
    //     ? parseInt(last.display_id, 10) + 1
    //     : 1;
      
    //   const next_id =  parseInt(last.display_id) + 1
    
    //   display_id = String(next_id).padStart(9, '0');
    // }

    const updateData = {
      fields: fieldsMap,
      progress,
      display_id,
      updated_by: currentUserId,
      ...(groupId !== null && { group_id: groupId }), // Only include if not null
      // ...(display_id && { display_id })  // only added if needed
    };

    // Set created_by only for new documents
    if (!existing) {
      updateData.created_by = currentUserId;
    }

    // Set submitted_by when progress changes to 'submitted'
    if (progress === 'submitted' && existing?.progress !== 'submitted') {
      updateData.submitted_by = currentUserId;
      updateData.submittedAt = new Date()
    }

    const updated = await FormResponse.findOneAndUpdate(
      { form_id: parseInt(formId), system_id: parseInt(systemId), _id: respId },
      // { fields: fieldsMap, progress, groupId },
      updateData,
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: { progress: 'not_started', fields: new Map() }
      }
    );

    res.json({ success: true, data: updated.toObject() });

  } catch (error) {
    console.error('Error in updateFormResponse:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getFormResponse = async (req, res) => {
  try {
    const { respId, formId, systemId } = req.params;
    const numericFormId = parseInt(formId, 10);
    const numericSystemId = parseInt(systemId, 10);
    const { userId } = req.query;
    const currentUserId = userId;

    // Convert "0" to a valid ObjectId so Mongo doesn't throw
    if (!mongoose.Types.ObjectId.isValid(respId)) {
      respId = new mongoose.Types.ObjectId(); // 👈 NEW valid ObjectId
    }

    let display_id;
    // Try to find the response (could be insert or update)
    const existing = await FormResponse.findOne({
      form_id: parseInt(formId),
      system_id: parseInt(systemId),
      _id: respId
    });
    if (existing?.display_id) {
      // Keep existing display_id if present
      display_id = existing.display_id;
    } else {
      // Get next display_id in sequence
      const lastResponse = await FormResponse.findOne({
        form_id: parseInt(formId),
        system_id: parseInt(systemId)
      }).sort({ display_id: -1 }).select('display_id');

      display_id = lastResponse?.display_id
        ? String(parseInt(lastResponse.display_id, 10) + 1).padStart(9, '0')
        : '000000001';
    }
    let created_by;
    // Set created_by only for new documents
    if (!existing) {
      created_by = currentUserId;
    }

    // Maintain upsert functionality but add progress tracking
    let response = await FormResponse.findOneAndUpdate(
      { form_id: numericFormId, system_id: numericSystemId, _id: respId },
      // display_id: display_id, created_by: currentUserId
      {
        $set: {
          display_id: display_id,
          updated_by: currentUserId
        },
        $setOnInsert: {
          created_by: currentUserId,
          fields: new Map(),
          progress: 'not_started'
        }
      },
      {
        new: true,
        upsert: true,
        // setDefaultsOnInsert: {
        //   // created_by: currentUserId,
        //   fields: new Map(),
        //   progress: 'not_started'
        // }
      }
    );

    // Convert Map to object
    const fieldsObject = {};
    response.fields.forEach((value, key) => {
      if (
        value &&
        typeof value === 'object' &&
        value.originalname && value.filename
      ) {
        // Likely a file field – preserve file metadata
        fieldsObject[key] = {
          originalname: value.originalname,
          filename: value.filename,
          mimetype: value.mimetype,
          size: value.size,
          path: value.path
        };
      } else {
        // Basic text/checkbox/etc. value
        fieldsObject[key] = value;
      }
    });

    res.json({
      resp_id: response._id,
      form_id: response.form_id,
      system_id: response.system_id,
      fields: fieldsObject,
      progress: response.progress,
      comment: response.comment,
      approved: response.approved,
      display_id: response.display_id,
      created_by: response.created_by,
      updated_by: response.updated_by,
      submitted_by: response.submitted_by,
      approved_by: response.approved_by
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

export const updateFormApproval = async (req, res) => {
  await mutex.runExclusive(async () => {
    try {
      const { respId, formId, systemId } = req.params;
      const { approved, comment, userId } = req.body;
      const currentUserId = userId;

      // let updatedComment = comment;
      // if (systemId == 5) {
      //   const existingResponse = await FormResponse.findOne({
      //     form_id: formId,
      //     system_id: systemId,
      //     _id: respId
      //   });

      //   const timestamp = new Date();
      //   const formattedTimestamp = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')} ` +
      //                      `${String(timestamp.getHours()).padStart(2, '0')}:${String(timestamp.getMinutes()).padStart(2, '0')}:${String(timestamp.getSeconds()).padStart(2, '0')}`;

      //   const existingComment = existingResponse.comment || '';

      //   // Fetch the user to get their name and email
      //   const user = await UserSchema.findById(currentUserId);
      //   const username = user ? `${user.first_name} ${user.last_name}` : '';
      //   const email = user?.email || '';

      //   if (comment?.trim() && comment != existingComment) {
      //     updatedComment = `${formattedTimestamp} - ${username}(${email}): ${comment} \n`;
      //   }
      // }

      const response = await FormResponse.findOneAndUpdate(
        { form_id: formId, system_id: systemId, _id: respId },
        {
          approved: approved,
          comment: comment,
          approved_by: currentUserId
        }
      );
  
      //-------------- FOR FVS CONFIRMATION USER -------------//
  
      if (approved && formId == 9) {
        // Extract specific fields by their IDs
        const fieldMap = {
          firstName: response.fields.get(String(FVS_FIELD_MAPPING.fname)),       // Field ID 1 = First Name
          mi: response.fields.get(String(FVS_FIELD_MAPPING.mi)),
          lastName: response.fields.get(String(FVS_FIELD_MAPPING.lname)),        // Field ID 2 = Last Name
          startDate: response.fields.get(String(FVS_FIELD_MAPPING.sdate)),   // Field ID 121215 = Start Date
          endDate: response.fields.get(String(FVS_FIELD_MAPPING.edate)),     // Field ID 986680 = End Date
          passport_number: response.fields.get(String(FVS_FIELD_MAPPING.passport)),
          location: response.fields.get(String(FVS_FIELD_MAPPING.site)),
          purpose: response.fields.get(String(FVS_FIELD_MAPPING.purpose))
        };
  
        if (response.group_id) {
          const groupVisit = await ForeignVisitsSchema.findOne({ group_id: response.group_id });
          if (groupVisit) {
            // Add new visitor to existing group
            groupVisit.visitors.push({
              form_response_id: response._id,
              visitor_name: `${fieldMap.firstName} ${fieldMap.mi} ${fieldMap.lastName}`,
              passport_number: fieldMap.passport_number,
              status: 'not-visited'
            });
  
            // Update the group visit dates if the new visit has a wider range
            if (new Date(fieldMap.startDate) < new Date(groupVisit.start_date)) {
              groupVisit.start_date = fieldMap.startDate;
            }
            if (new Date(fieldMap.endDate) > new Date(groupVisit.end_date)) {
              groupVisit.end_date = fieldMap.endDate;
            }
  
            await groupVisit.save();
          } else {
            // Create new group visit
            const newGroupVisit = new ForeignVisitsSchema({
              type: 'group',
              group_id: response.group_id,
              location: fieldMap.location,
              start_date: fieldMap.startDate,
              end_date: fieldMap.endDate,
              purpose: fieldMap.purpose,
              visitors: [{
                form_response_id: response._id,
                visitor_name: `${fieldMap.firstName} ${fieldMap.mi} ${fieldMap.lastName}`,
                passport_number: fieldMap.passport_number,
                status: 'not-visited'
              }]
            });
  
            await newGroupVisit.save();
          }
        } else {
          // Single visit handling
          const newVisit = new ForeignVisitsSchema({
            type: 'single',
            location: fieldMap.location,
            start_date: fieldMap.startDate,
            end_date: fieldMap.endDate,
            purpose: fieldMap.purpose,
            visitors: [{
              form_response_id: response._id,
              visitor_name: `${fieldMap.firstName} ${fieldMap.mi} ${fieldMap.lastName}`,
              passport_number: fieldMap.passport_number,
              status: 'not-visited'
            }]
          });
  
          await newVisit.save();
        }
      }
  
      res.json({
        success: true,
        data: response.toObject()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
};

export const getFormResponses = async (req, res) => {
  const { formId, systemId } = req.params;
  const { groupId, userId, userRole } = req.query;
  try {
    const query = {
      form_id: Number(formId),
      system_id: Number(systemId)
    };
    // Add group_id to query if provided
    if (groupId) {
      query.group_id = Number(groupId);
    }

    // PRISM proj manager will only see projects created by them
    if (systemId == PRISM_SYSTEM.SYSTEM_ID && userId && userRole && userRole === USER_ROLES.PROJECT_MANAGER) {
      query.created_by = userId;
    }

    let responses = await FormResponse.find(query).sort({ updatedAt: -1 });

    // PRISM gov lead will only see projects assigned to them
    if (systemId == PRISM_SYSTEM.SYSTEM_ID && userId && userRole && userRole === USER_ROLES.GOVERNMENT_LEAD) {
      const govLeadKey = PRISM_FIELD_MAPPING.governmentLead.toString();
      responses = responses.filter((resp) => {
        return resp?.fields?.get(govLeadKey)?.id == userId;
      });
    }
    // const responses = await FormResponse.find({ form_id: Number(formId), system_id: systemId }).sort({ updatedAt: -1 });
    res.json(responses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch responses' });
  }
};


export const getResponseStatus = async (req, res) => {
  const { formId, systemId } = req.params;
  const { status, approved } = req.query;

  try {
    const query = {
      form_id: Number(formId),
      ...(systemId && { system_id: Number(systemId) }),
      ...(status && { progress: status })
    };

    // Translate approved filter to match DB format
    if (approved === 'approved') {
      query.approved = 'true';
    } else if (approved === 'not_approved') {
      query.approved = 'false';
    } else if (approved === 'not_assessed') {
      query.approved = ''; // or possibly { $in: ['', null] } if needed
    }


    const responses = await FormResponse.find(query).sort({ updatedAt: -1 });

    res.json(responses);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch responses' });
  }
};


export const deleteResponse = async (req, res) => {
  const { formId, systemId } = req.params;
  const { respId, groupId } = req.query;

  const baseQuery = {
    form_id: Number(formId),
    system_id: Number(systemId),
  };

  try {
    let result;

    if (groupId) {
      // delete all in the group
      result = await FormResponse.deleteMany({
        ...baseQuery,
        group_id: Number(groupId),
      });
    } else if (respId) {
      // delete a single response
      result = await FormResponse.deleteOne({
        _id: respId,
        ...baseQuery,
      });
    } else {
      return res
        .status(400)
        .json({ message: 'Must provide either respId or groupId' });
    }

    return res.json({
      success: true,
      deletedCount: result.deletedCount || 0,
    });
  } catch (err) {
    console.error('Error deleting response(s):', err);
    return res
      .status(500)
      .json({ success: false, message: 'Deletion failed' });
  }
};

export const updateFormProgress = async (req, res) => {
  try {
    const { respId, formId, systemId } = req.params;
    const { progress, userId } = req.body;
    const currentUserId = userId;

    if (!progress) {
      return res.status(400).json({
        success: false,
        message: 'Progress value is required'
      });
    }

    const updated = await FormResponse.findOneAndUpdate(
      {
        _id: respId,
        form_id: parseInt(formId),
        system_id: parseInt(systemId)
      },
      { $set: { progress, updated_by: currentUserId } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Form response not found'
      });
    }

    res.json({
      success: true,
      data: updated.toObject()
    });

  } catch (error) {
    console.error('Error in updateFormProgress:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// controllers/formResponseController.js
export const getMaxDisplayId = async (req, res) => {
  try {
    const { formId, systemId } = req.params; // Get both params from URL
    
    const result = await FormResponse.aggregate([
      { 
        $match: { 
          form_id: parseInt(formId),
          system_id: parseInt(systemId) // Add system_id filter
        } 
      },
      {
        $project: {
          displayIdNumber: {
            $convert: {
              input: "$display_id",
              to: "long",
              onError: 0,
              onNull: 0
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          maxDisplayId: { $max: "$displayIdNumber" }
        }
      }
    ]);

    const maxDisplayId = result[0]?.maxDisplayId || 0;
    
    res.status(200).json({ 
      success: true,
      data: { maxDisplayId }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};