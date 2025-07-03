import { FVS_FIELD_MAPPING, FVS_SYSTEM } from "../constants/constants.js";
import { runModelTraining } from "../cron/model_training_cron.js";
import { runDemoCron } from "../cron/outlier_prediction_cron.js";
import ForeignVisitsSchema from "../models/foreignVisits.js";
import { FormResponse } from "../models/formResponse.js"
import VisitAlertsSchema from "../models/visitAlerts.js";


export const getAllVisitRequests = async (req, res) => {
    try {
        const formResponses = await FormResponse.find({
            form_id: FVS_SYSTEM.FORM_ID,
            system_id: FVS_SYSTEM.SYSTEM_ID
        }).lean();

        const responseWithVisits = await Promise.all(
            formResponses.map(async (response) => {
                // Extract fields from the fields map
                const fieldMap = {
                    firstName: response.fields?.[String(FVS_FIELD_MAPPING.fname)] || '',
                    mi: response.fields?.[String(FVS_FIELD_MAPPING.mi)] || '',
                    lastName: response.fields?.[String(FVS_FIELD_MAPPING.lname)] || '',
                    startDate: response.fields?.[String(FVS_FIELD_MAPPING.sdate)] || '',
                    endDate: response.fields?.[String(FVS_FIELD_MAPPING.edate)] || '',
                    passport_number: response.fields?.[String(FVS_FIELD_MAPPING.passport)] || '',
                    location: response.fields?.[String(FVS_FIELD_MAPPING.site)] || '',
                    purpose: response.fields?.[String(FVS_FIELD_MAPPING.purpose)] || '',
                };

                let visit = null;

                // Attach visit info only if approved
                if (response.approved === 'true') {
                    visit = await ForeignVisitsSchema.findOne({ "visitors.form_response_id": response._id }).lean();
                }

                let visitStatus = null;
                if (visit && Array.isArray(visit.visitors)) {
                    const matchedVisitor = visit.visitors.find(v =>
                        v.form_response_id?.toString() === response._id.toString()
                    );
                    visitStatus = matchedVisitor ? matchedVisitor.status : null;
                }

                return {
                    ...response,
                    visitor_name: `${fieldMap.firstName} ${fieldMap.mi} ${fieldMap.lastName}`,
                    start_date: fieldMap.startDate,
                    end_date: fieldMap.endDate,
                    passport_number: fieldMap.passport_number,
                    location: fieldMap.location,
                    purpose: fieldMap.purpose,
                    visit_type: response.group_id ? 'Group' : 'Single',
                    visit_status: visitStatus,
                };
            })
        );

        return res.status(200).json(responseWithVisits);
    } catch (error) {
        console.error('Error fetching form responses:', error);
        return res.status(500).json({ message: 'Failed to get form responses' });
    }
};

export const getVisitRequestsAlert = async (req, res) => {
    try {
        const visitAlerts = await VisitAlertsSchema.find({})
            .sort({ createdAt: -1 })
            .populate({
                path: 'submitted_by',
                select: 'first_name last_name email'
            });

        return res.status(200).json(visitAlerts);
    } catch (error) {
        console.error('Error fetching form getVisitRequestsAlert:', error);
        return res.status(500).json({ message: 'Failed to get visit alerts' });
    }
};


export const startModelTraining = async (req, res) => {
    try {
        await runModelTraining();

        return res.status(200).json({message: "success"});
    } catch (error) {
        console.error('Error fetching form startModelTraining:', error);
        return res.status(500).json({ message: 'Failed to train model' });
    }
};

export const startDataTesting = async (req, res) => {
    try {
        await runDemoCron();

        return res.status(200).json({message: "success"});
    } catch (error) {
        console.error('Error fetching form startDataTesting:', error);
        return res.status(500).json({ message: 'Failed to test data' });
    }
};
