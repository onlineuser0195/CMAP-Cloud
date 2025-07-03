import xlsx from "xlsx";
import SpanReportsSchema from "../models/spanReports.js";
import UsxportReportsSchema from "../models/usxportsReports.js";


export const getLastSyncTimeForUsxportsReport = async (req, res) => {
    try {
        const latestReport = await UsxportReportsSchema.findOne({}).sort({ timestamp: -1 });

        if (!latestReport || !latestReport.timestamp) {
            return res.status(404).json({ message: "No sync data found" });
        }
        //todo:
        res.status(200).json({ last_sync_time: latestReport.timestamp });
    } catch (error) {
        console.error("Error fetching sync time:", error);
        res.status(500).json({ message: "Failed to fetch sync time" });
    }
};

export const uploadSpanReports = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Failed: No file uploaded." });
        }

        // Parse the Excel file
        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);


        if (!sheetData.length) {
            return res.status(400).json({ message: "Failed: Excel file is empty." });
        }

        // Clear existing collection
        await SpanReportsSchema.deleteMany({});

        // Insert new data
        await SpanReportsSchema.insertMany(sheetData);

        res.status(200).json({ message: "Reports uploaded and replaced successfully", count: sheetData.length });
    } catch (error) {
        console.error("Error uploading reports:", error);
        return res.status(400).json({ message: "Failed: Server Error" });
    }
};
