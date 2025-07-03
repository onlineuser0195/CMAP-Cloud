import { logError } from "../helper/logger.js";
import ForeignVisitsSchema  from "../models/foreignVisits.js";
import UserSchema from "../models/user.js";


export const getVisitsForConfirmationUser = async (req, res) => {
    try {
        const { confirmationUserId } = req.params;

        const confirmationUser = await UserSchema.findById(confirmationUserId);

        if (!confirmationUser) {
            return res.status(404).json({ message: 'Confirmation User not found' });
        }

        const visits = await ForeignVisitsSchema.find({ location: confirmationUser.location });

        return res.status(200).json(visits);

    } catch (error) {
        logError('getVisitsForConfirmationUser', error);
        res.status(500).json({ success: false, message: "Failed to get visits" });
    }
};

export const updateVisitorStatus = async (req, res) => {
    try {
        const { visitId, visitorId } = req.params;
        const { status, confirmationUserId } = req.body;

        const visit = await ForeignVisitsSchema.findOne({
            _id: visitId,
        });

        if (!visit) {
            return res.status(404).json({
                success: false,
                message: 'visit not found'
            });
        }

        // Find the specific visitor in the visit
        const visitor = visit.visitors.id(visitorId);
        if (!visitor) {
            return res.status(404).json({
                success: false,
                message: 'Visitor not found in this visit'
            });
        }

        visitor.status = status;
        visitor.confirmed_by = confirmationUserId;        
        await visit.save();

        res.status(200).json({
            success: true,
            data: visit
        });

    } catch (error) {
        logError('updateVisitorStatus', error);
        res.status(500).json({ success: false, message: 'Failed to update visit status' });
    }
};

export const updateVisitRemarks = async (req, res) => {
    try {
        const { visitId } = req.params;
        const { remarks } = req.body;

        const updatedVisit = await ForeignVisitsSchema.findByIdAndUpdate(
            visitId,
            { remarks },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedVisit) {
            return res.status(404).json({
                success: false,
                message: 'Visit not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: updatedVisit
        });
    } catch (error) {
        logError('updateVisitRemarks', error);
        res.status(500).json({ success: false, message: 'Failed to update visit remarks' });
    }
};
