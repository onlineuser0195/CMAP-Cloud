import { Textbox, Dropdown, Checkbox,
  Textarea, Radio, DateField,
  EmailField, PhoneField, NumberField,
  Attachment,
  Instruction
 } from '../models/fields.js';
import { Form } from '../models/forms.js';
import { System } from '../models/systems.js';
import { FormResponse } from '../models/formResponse.js';

// // Get all Forms
// export const getAllForms = async (req, res) => {
//   try {
//     const { systemId } = req.params;
    
//     if (parseInt(systemId) === 0) {
//       const allForms = await Form.find({});
//       return res.json(allForms);
//     } else {
//       // Find the system to get its form_ids
//       const system = await System.findOne({ system_id: parseInt(systemId) });
      
//       if (!system) {
//         return res.status(404).json({ message: "System not found" });
//       }

//       // Get forms using the system's form_ids
//       const forms = await Form.find({ 
//         form_id: { $in: system.form_ids } 
//       }).sort({ form_id: 1 });

//       return res.json(forms);
//     }
//   } catch (error) {
//     console.error("Server error:", error);
//     res.status(500).send("Server error");
//   }
// };

export const getAllForms = async (req, res) => {
  try {
    const { systemId } = req.params;
    const { status } = req.query; // New optional query parameter
  
    let forms;

    if (parseInt(systemId) === 0) {
      forms = await Form.find({});
    } else {
      const system = await System.findOne({ system_id: parseInt(systemId) });

      if (!system) {
        return res.status(404).json({ message: "System not found" });
      }

      forms = await Form.find({
        form_id: { $in: system.form_ids }
      }).sort({ form_id: 1 });
    }

    const formIds = forms.map(f => f.form_id);

    // Get latest responses per form
    const latestResponses = await FormResponse.aggregate([
      { $match: { form_id: { $in: formIds } } },
      { $sort: { updatedAt: -1 } },
      {
        $group: {
          _id: "$form_id",
          progress: { $first: "$progress" },
          updatedAt: { $first: "$updatedAt" }
        }
      }
    ]);

    // Map for fast lookup
    const responseMap = new Map();
    latestResponses.forEach(resp => {
      responseMap.set(resp._id, {
        progress: resp.progress,
        updatedAt: resp.updatedAt
      });
    });

    // Merge and filter if status is provided
    const enrichedForms = forms
      .map(form => {
        const statusData = responseMap.get(form.form_id) || {
          progress: 'not_started',
          updatedAt: null
        };
        return {
          ...form.toObject(),
          progress: statusData.progress,
          updatedAt: statusData.updatedAt
        };
      })
      .filter(form => !status || form.progress === status); // 👈 Filter if status is provided

    return res.json(enrichedForms);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).send("Server error");
  }
};

export const getAllSystemForms = async (req, res) => {
  try {
    const { systemId } = req.params;
    const { status, approved } = req.query;

    const isGlobal = parseInt(systemId) === 0;
    let systems = [];

    if (isGlobal) {
      systems = await System.find({});
    } else {
      const system = await System.findOne({ system_id: parseInt(systemId) });
      if (!system) {
        return res.status(404).json({ message: "System not found" });
      }
      systems = [system];
    }

    // Collect all form_ids
    const allFormIds = systems.flatMap(s => s.form_ids);

    // Get ALL responses for those forms
    const allResponses = await FormResponse.find({
      form_id: { $in: allFormIds }
    });

    // Build responseMap: form_id -> array of responses
    const responseMap = new Map();
    allResponses.forEach(resp => {
      if (!responseMap.has(resp.form_id)) {
        responseMap.set(resp.form_id, []);
      }
      responseMap.get(resp.form_id).push(resp);
    });

    const results = await Promise.all(
      systems.map(async system => {
        const forms = await Form.find({ form_id: { $in: system.form_ids }, active: 'true' });

        const enrichedForms = forms.map(form => {
          const responses = responseMap.get(form.form_id) || [];

          // Initialize counts
          const progressCount = {
            not_started: 0,
            in_progress: 0,
            submitted: 0
          };

          const approvalCount = {
            approved: 0,
            not_approved: 0,
            not_assessed: 0
          };

          if (responses.length === 0) {
            progressCount.not_started++;
            approvalCount.not_assessed++;
          } else {
            responses.forEach(resp => {
              const progress = ['not_started', 'in_progress', 'submitted'].includes(resp.progress)
                ? resp.progress
                : 'not_started';
              progressCount[progress]++;

              const approvedVal = resp.approved;
              if (approvedVal === 'true') {
                approvalCount.approved++;
              } else if (approvedVal === 'false') {
                approvalCount.not_approved++;
              } else {
                approvalCount.not_assessed++;
              }
            });
          }

          return {
            ...form.toObject(),
            progress: progressCount,
            approved: approvalCount,
            responseCount: responses.length,
            system_id: system.system_id,
            system_name: system.name
          };
        })
        .filter(form => {
          // Filtering by overall progress/approval match (optional)
          const matchStatus = !status || Object.keys(form.progress).some(k => k === status && form.progress[k] > 0);
          const matchApproval = !approved || Object.keys(form.approved).some(k => k === approved && form.approved[k] > 0);
          return matchStatus && matchApproval;
        });

        return {
          system_id: system.system_id,
          system_name: system.name,
          forms: enrichedForms
        };
      })
    );

    // Return just the system's forms if not global
    if (!isGlobal) {
      return res.json(results[0].forms);
    }

    return res.json(results);

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).send("Server error");
  }
};



// Update field_ids for a specific form
export const buildForm = async (req, res) => {
  const { formId } = req.params; // Extract formId from URL params
  try {
    const { field_ids } = req.body;
    console.log('BackEnd', field_ids);
    // Find and update the form by form_id
    const updatedForm = await Form.findOneAndUpdate(
      { form_id: formId }, // Query by form_id
      { field_ids }, // Update field_ids
      { new: true } // Return the updated document
    );

    if (!updatedForm) {
      return res.status(404).json({ message: 'Form not found' });
    }

    res.json(updatedForm);
  } catch (error) {
    console.error('Error in buildForm:', error); // Debugging
    res.status(500).json({ message: 'Error updating form', error: error.message });
  }
};


export const getBuildForm = async (req, res) => {
  try {
    const { formId } = req.params;
    const form = await Form.findOne({ form_id: formId });

    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }

    const fieldDetails = await Promise.all(
      form.field_ids.map(async (fieldId) => {
        const models = [
          { model: Textbox, type: 'text' },
          { model: Dropdown, type: 'select' },
          { model: Checkbox, type: 'checkbox' },
          { model: Textarea, type: 'textarea' },
          { model: Radio, type: 'radio' },
          { model: DateField, type: 'date' },
          { model: EmailField, type: 'email' },
          { model: PhoneField, type: 'phone' },
          { model: NumberField, type: 'number' },
          { model: Attachment, type: 'attachment' },
          { model: Instruction, type: 'instruction' },
        ];

        for (const { model, type } of models) {
          if(fieldId === 0){
            return {
              type: 'section',
              field_id: 0            
            }
          }
          const record = await model.findOne({ field_id: fieldId });
          if (record) {
            return { type, ...record.toObject() };
          }
        }

        return null; // Not found in any model
      })
    );

    const filteredFieldDetails = fieldDetails.filter(field => field !== null);

    res.json({
      ...form.toObject(),
      fields: filteredFieldDetails,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching form', error });
  }
};

// Create new form
export const createForm = async (req, res) => {
  try {
    const lastForm = await Form.findOne().sort({ form_id: -1 });
    const form_id = lastForm ? lastForm.form_id + 1 : 1;

    let file_path = null;
    if (req.file) {
      file_path = req.file.path; // multer adds 'file' if uploaded
    }

    const newForm = new Form({
      form_id,
      name: req.body.name,
      description: req.body.description,
      field_ids: [],
      info: {
        file_path: file_path
      }
    });

    const savedForm = await newForm.save();
    res.json(savedForm);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating form', error });
  }
};


export const updateFormDetails = async (req, res) => {
  try {
    const updateData = {
      name: req.body.name,
      description: req.body.description
    };

    if (req.file) {
      updateData['info.file_path'] = req.file.path;
    }

    const updatedForm = await Form.findOneAndUpdate(
      { form_id: req.params.formId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedForm) {
      return res.status(404).json({ message: 'Form not found' });
    }
    res.json(updatedForm);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating form', error });
  }
};


export const getFormDetails = async (req, res) => {
  try {
    const getForm = await Form.findOne(
      { form_id: req.params.formId },
      { name: 1, description: 1, info: 1 }
    );

    if (!getForm) {
      return res.status(404).json({ message: 'Form not found' });
    }
    res.json(getForm);
  } catch (error) {
    res.status(500).json({ message: 'Error getting form details', error });
  }
};

export const deleteForm = async (req, res) => {
  const { formId } = req.params;

  try {
    const parsedFormId = parseInt(formId, 10);

    // 1. Delete the form itself
    const deletedForm = await Form.findOneAndDelete({ form_id: parsedFormId });
    if (!deletedForm) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // 2. Remove form ID from ALL systems' form_ids arrays
    const updateResult = await System.updateMany(
      { form_ids: parsedFormId },
      { $pull: { form_ids: parsedFormId } }
    );

    console.log(`Removed form ${parsedFormId} from ${updateResult.modifiedCount} systems`);

    res.status(200).json({
      message: 'Form deleted and cleaned from all systems',
      deletedForm,
      systemsAffected: updateResult.modifiedCount
    });

  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateActiveStatus = async (req, res) => {
  try {
    const updatedForm = await Form.findOneAndUpdate(
      { form_id: req.params.formId },
      { 
        $set: {
          active: req.body.active
        }
      },
      { new: true }
    );

    if (!updatedForm) {
      return res.status(404).json({ message: 'Form not found' });
    }
    res.json(updatedForm);
  } catch (error) {
    res.status(500).json({ message: 'Error updating form', error });
  }
};


export const cloneForms = async (req, res) => {
  try {
    const { form_ids } = req.body;

    // Enhanced validation
    if (!Array.isArray(form_ids) || form_ids.length === 0) {
      return res.status(400).json({ 
        message: 'Invalid request format. Expected { form_ids: number[] }' 
      });
    }

    // Validate input
    if (!form_ids?.length) {
      return res.status(400).json({ message: 'No forms selected for cloning' });
    }

    // Get all original forms at once
    const originalForms = await Form.find({ 
      form_id: { $in: form_ids.map(Number) } 
    });

    if (originalForms.length === 0) {
      return res.status(404).json({ message: 'No valid forms found for cloning' });
    }

    // Get next available form_id sequence
    const lastForm = await Form.findOne().sort({ form_id: -1 });
    let nextFormId = lastForm ? lastForm.form_id + 1 : 1;

    // Prepare clones with sequential IDs
    const clones = originalForms.map(original => ({
      form_id: nextFormId++,
      name: `Copy of ${original.name}`,
      description: original.description,
      field_ids: [...original.field_ids],
      timestamp: new Date()
    }));

    // Bulk insert clones
    const createdForms = await Form.insertMany(clones);

    res.json({
      message: `Successfully cloned ${createdForms.length} forms`,
      clonedForms: createdForms
    });

  } catch (error) {
    console.error('Cloning error:', error);
    res.status(500).json({ 
      message: 'Error cloning forms',
      error: error.message 
    });
  }
};