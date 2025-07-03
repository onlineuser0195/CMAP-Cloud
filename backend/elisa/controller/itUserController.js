import xlsx from "xlsx";
import UsxportReportsSchema from "../models/usxportsReports.js";


export const uploadUsxportsReports = async (req, res) => {
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
        await UsxportReportsSchema.deleteMany({});

        // Insert new data
        await UsxportReportsSchema.insertMany(sheetData);

        res.status(200).json({ message: "Reports uploaded and replaced successfully", count: sheetData.length });
    } catch (error) {
        console.error("Error uploading reports:", error);
        return res.status(400).json({ message: "Failed: Server Error" });
    }
};


export const getUsxportsReports = async (req, res) => {
    try {
        const reports = await UsxportReportsSchema.find({});
        res.status(200).json(reports);
    } catch (error) {
        console.error("Error fetching reports:", error);
        res.status(500).json({ message: "Failed to fetch reports" });
    }
};
