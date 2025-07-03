import SpanReportsSchema from "../models/spanReports.js";
import UsxportReportsSchema from "../models/usxportsReports.js";

export const getCaseDetails = async (req, res) => {
    try {
        const caseNumber = req.params.caseNumber;

        let caseDetails = await UsxportReportsSchema.findOne({ case_number: caseNumber });

        if (!caseDetails) {
            caseDetails = await SpanReportsSchema.findOne({ case_number: caseNumber });
        }

        if (!caseDetails) {
            return res.status(404).json({ message: "Case not found" });
        }
        res.status(200).json(caseDetails);
    } catch (error) {
        console.error("Error fetching case details:", error);
        res.status(500).json({ message: "Failed to fetch case details" });
    }
};
