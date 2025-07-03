import { Form } from '../models/forms.js';
import { FormResponse } from '../models/formResponse.js';
import { System } from '../models/systems.js'

export const getSystemOverview = async (req, res) => {

  const systemId = req.params.systemId || req.query.systemId;
  const { fromDate, toDate } = req.query;
  const dateFilter = {};
  // if (fromDate) dateFilter.$gte = new Date(fromDate);
  // if (toDate) dateFilter.$lte = new Date(toDate);
  if (fromDate) {
    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0); // Start of day
    dateFilter.$gte = from;
  }
  
  if (toDate) {
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999); // End of day
    dateFilter.$lte = to;
  }

  try {
    let formFilter = { active: 'true' };
    let formIds = [];

    // If systemId is provided, get the related form_ids
    if (systemId) {
      const system = await System.findOne({ system_id: Number(systemId) });

      if (!system) {
        return res.status(404).json({
          success: false,
          error: 'System not found'
        });
      }
      // Get only active forms from the system
      const activeForms = await Form.find({
        form_id: { $in: system.form_ids },
        active: 'true'
      });

      // formIds = system.form_ids;
      formIds = activeForms.map(f => f.form_id);
      formFilter = { form_id: { $in: formIds }, active: 'true' };
    } else {
      const allForms = await Form.find({ active: 'true' });
      formIds = allForms.map(f => f.form_id);
      formFilter = {active: 'true' }; // No filter needed when global
    }

    // Get all responses for relevant forms
    // AFTER CREATING MULTIPLE RESPONSES FOR A FORM, REMOVED GET FIRST RESP
    // const formResponses = await FormResponse.aggregate([
    //   { $match: { form_id: { $in: formIds } } },
    //   { $sort: { updatedAt: -1 } },
    //   {
    //     $group: {
    //       _id: "$form_id",
    //       progress: { $first: "$progress" },
    //       approved: { $first: "$approved" }
    //     }
    //   }
    // ]);

    const formResponses = await FormResponse.find({
      form_id: { $in: formIds },
      ...(Object.keys(dateFilter).length > 0 && { updatedAt: dateFilter })
    });

    // Build map: form_id → progress
    //COMMENTED FOR APPROVED
    // const progressMap = new Map();
    // formResponses.forEach(r => progressMap.set(r._id, r.progress));

    // Count progress statuses (include not_started for missing formResponses)


    //UNCOMMENT IF NOT STARTED IS NEEDED
    // const responseMap = new Map();
    // formResponses.forEach(response => {
    //   if (!responseMap.has(response.form_id)) {
    //     responseMap.set(response.form_id, []);
    //   }
    //   responseMap.get(response.form_id).push(response);
    // });

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

    // formIds.forEach(id => {
    //   const response = formResponses.find(r => r._id === id);

    //   // const status = progressMap.get(id) || 'not_started';
    //   const status = response?.progress || 'not_started';


    formResponses.forEach(response => {
    //UNCOMMENT IF NOT STARTED IS NEEDED
    // formIds.forEach(formId => {
    //   const responses = responseMap.get(formId);
    
    //   if (!responses || responses.length === 0) {
    //     // No response → count as not_started
    //     progressCount.not_started++;
    //     approvalCount.not_assessed++;
    //   } else {
    //     responses.forEach(response => {
      const status = response?.progress || 'not_started';
      progressCount[status] = (progressCount[status] || 0) + 1;

      const approved = response?.approved;
      if (approved === 'true') {
        approvalCount.approved++;
      } else if (approved === 'false') {
        approvalCount.not_approved++;
      } else {
        approvalCount.not_assessed++;
      }
    });
    //UNCOMMENT IF NOT STARTED IS NEEDED
//   }
// });

    // Form Type Distribution
    const formTypes = await Form.aggregate([
      { $match: formFilter },
      { $unwind: "$field_ids" },
      {
        $group: {
          _id: "$field_ids.field_type",
          count: { $sum: 1 }
        }
      }
    ]);

    // // Recent Activity (latest 5 updates)
    // const recentSubmissions = await FormResponse.find({form_id: { $in: formIds }})
    //   .sort({ updatedAt: -1 })
    //   .limit(5)
    //   .lean()
    //   .then(responses =>
    //     Promise.all(responses.map(async response => {
    //       const form = await Form.findOne({ form_id: response.form_id });
    //       return {
    //         ...response,
    //         form_name: form?.name || 'Unknown Form'
    //       };
    //     }))
    //   );

    const recentSubmissions = await FormResponse.aggregate([
      { $match: { form_id: { $in: formIds },
      ...(Object.keys(dateFilter).length > 0 && { updatedAt: dateFilter })
      }},
      { $sort: { updatedAt: -1 } },
      { $limit: 5 },
    
      // Lookup corresponding form
      {
        $lookup: {
          from: 'forms',
          localField: 'form_id',
          foreignField: 'form_id',
          as: 'form'
        }
      },
      { $unwind: { path: '$form', preserveNullAndEmptyArrays: true } },
    
      // Lookup system using form.system_id
      {
        $lookup: {
          from: 'systems',
          localField: 'system_id',
          foreignField: 'system_id',
          as: 'system'
        }
      },
      { $unwind: { path: '$system', preserveNullAndEmptyArrays: true } },
    
      // Shape the final output
      {
        $project: {
          _id: 0,
          form_id: 1,
          form_name: '$form.name',
          system_name: '$system.name',
          progress: 1,
          updatedAt: 1,
          user_id: {
            $let: {
              vars: {
                // Convert missing fields to null explicitly
                approvedBy: { $ifNull: ["$approved_by", null] },
                submittedBy: { $ifNull: ["$submitted_by", null] },
                createdBy: "$created_by"  // Assuming this field always exists
              },
              in: {
                $cond: [
                  { $ne: ["$$approvedBy", null] },  // Check if not null
                  "$$approvedBy",
                  {
                    $cond: [
                      { $ne: ["$$submittedBy", null] },  // Check if not null
                      "$$submittedBy",
                      "$$createdBy"  // Fallback
                    ]
                  }
                ]
              }
            }
          }
        }
      }
    ]);
    

    res.json({
      success: true,
      data: {
        formStatus: progressCount,
        approvalStatus: approvalCount,
        formTypes: formatAnalytics(formTypes),
        recentActivity: recentSubmissions
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getFormOverview = async (req, res) => {
  const formId = Number(req.params.formId || req.query.formId);

  try {
    const form = await Form.findOne({ form_id: formId, active: 'true' });

    if (!form) {
      return res.status(404).json({
        success: false,
        error: 'Form not found or inactive'
      });
    }

    // Get all responses for this form
    const formResponses = await FormResponse.find({ form_id: formId });

    // Initialize progress + approval counters
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

    if (formResponses.length === 0) {
      progressCount.not_started = 1;
      approvalCount.not_assessed = 1;
    } else {
      formResponses.forEach(response => {
        const status = ['not_started', 'in_progress', 'submitted'].includes(response.progress)
          ? response.progress
          : 'not_started';
        progressCount[status] = (progressCount[status] || 0) + 1;

        const approved = response.approved;
        if (approved === 'true') {
          approvalCount.approved++;
        } else if (approved === 'false') {
          approvalCount.not_approved++;
        } else {
          approvalCount.not_assessed++;
        }
      });
    }

    // Form field type distribution
    const formTypes = await Form.aggregate([
      { $match: { form_id: formId, active: 'true' } },
      { $unwind: "$field_ids" },
      {
        $group: {
          _id: "$field_ids.field_type",
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent Activity: last 5 responses
    const recentSubmissions = await FormResponse.aggregate([
      { $match: { form_id: formId } },
      { $sort: { updatedAt: -1 } },
      { $limit: 5 },
    
      // Lookup corresponding form
      {
        $lookup: {
          from: 'forms',
          localField: 'form_id',
          foreignField: 'form_id',
          as: 'form'
        }
      },
      { $unwind: { path: '$form', preserveNullAndEmptyArrays: true } },
    
      // Lookup system using form.system_id
      {
        $lookup: {
          from: 'systems',
          localField: 'system_id',
          foreignField: 'system_id',
          as: 'system'
        }
      },
      { $unwind: { path: '$system', preserveNullAndEmptyArrays: true } },
    
      // Final shape
      {
        $project: {
          _id: 0,
          form_id: 1,
          form_name: '$form.name',
          system_name: '$system.name',
          progress: 1,
          updatedAt: 1,
          createdAt: 1,
          submittedAt: 1,
          user_id: {
            $let: {
              vars: {
                // Convert missing fields to null explicitly
                approvedBy: { $ifNull: ["$approved_by", null] },
                submittedBy: { $ifNull: ["$submitted_by", null] },
                createdBy: "$created_by"  // Assuming this field always exists
              },
              in: {
                $cond: [
                  { $ne: ["$$approvedBy", null] },  // Check if not null
                  "$$approvedBy",
                  {
                    $cond: [
                      { $ne: ["$$submittedBy", null] },  // Check if not null
                      "$$submittedBy",
                      "$$createdBy"  // Fallback
                    ]
                  }
                ]
              }
            }
          }
        }
      }
    ]);
    

    res.json({
      success: true,
      data: {
        formStatus: progressCount,
        approvalStatus: approvalCount,
        formTypes: formatAnalytics(formTypes),
        recentActivity: recentSubmissions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const formatAnalytics = (data) => {
  return data.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});
};


export const getFormsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    const forms = await FormResponse.aggregate([
      { $match: { progress: status } },
      {
        $lookup: {
          from: 'forms', // Collection name for forms
          localField: 'form_id',
          foreignField: 'form_id',
          as: 'form'
        }
      },
      { $unwind: '$form' },
      {
        $lookup: {
          from: 'systems', // Collection name for systems
          localField: 'form.system_id',
          foreignField: 'system_id',
          as: 'system'
        }
      },
      { $unwind: { path: '$system', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          form_id: 1,
          form_name: '$form.name',
          system_name: '$system.name',
          progress: 1,
          updatedAt: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: forms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};