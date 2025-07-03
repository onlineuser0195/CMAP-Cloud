import { FormResponse } from '../models/formResponse.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { startOfDay, subDays } from 'date-fns';
import { logError } from '../helper/logger.js';
import { promisify } from 'util';
import { exec } from 'child_process';
import fs from 'fs';
import { promises as fsp } from 'fs';
import { sendEmail } from '../email/sendEmail.js';
import VisitAlertsSchema from '../models/visitAlerts.js';
import csv from 'csv-parser';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelDir = path.join(__dirname, 'models_ifm');
const predictScriptPath = path.join(__dirname, '../../python_ifm/predict.py');
const testDataDir = path.join(__dirname, 'test_data');

const getYesterdayDateRange = () => {
    const endDate = startOfDay(new Date()); // today at 00:00
    const startDate = subDays(endDate, 1); // yesterday at 00:00
    return { startDate, endDate };
};


const getYesterdayUserCounts = async () => {
    const { startDate, endDate } = getYesterdayDateRange();

    const results = await FormResponse.aggregate([
        { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
        {
            $group: {
                _id: '$created_by',
                count: { $sum: 1 }
            }
        }
    ]);

    return results; // array of { _id: userId, count: <number> }
};

const predictForUser = async (userId, count) => {
    const modelPath = path.join(modelDir, `${userId}.pkl`);
    try {
        await fsp.access(modelPath);
        const cmd = `python ${predictScriptPath} ${modelPath} ${count}`;
        console.log(`Predicting for user id - ${userId} (count: ${count})`);

        const { stdout, stderr } = await execAsync(cmd);

        if (stderr) {
            console.error(`error for ${userId}: ${stderr.trim()}`);
            return; // Skip further processing on error
        }

        const trimmedOutput = stdout.trim();

        let result;
        result = JSON.parse(trimmedOutput);

        // -1 is for outliers
        if (result.prediction == -1) {
            const { startDate, endDate } = getYesterdayDateRange();
            sendEmail(userId, count, startDate.toDateString());
            const newAlert = new VisitAlertsSchema({
                submitted_by: userId,
                submission_count: count,
                submitted_on: startDate,
            });
            await newAlert.save();
        }
    } catch (err) {
        console.error(`Prediction failed for ${userId}: ${err.message}`);
    }
};


export const runOutlierPrediction = async () => {
    try {
        const userCounts = await getYesterdayUserCounts();
        for (const entry of userCounts) {
            const userId = entry._id;
            const count = entry.count;
            await predictForUser(userId, count);
        }
    } catch (error) {
        logError('run', error);
    }
};

const getTestData = async () => {
    const results = [];
    const filePath = path.join(testDataDir, 'test.csv');

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                results.push({
                    id: row.id,
                    date: row.date,
                    count: parseInt(row.count, 10),
                });
            })
            .on('end', () => {
                resolve(results);
            })
            .on('error', (err) => {
                reject(err);
            });
    });
};

const predictForUserDemo = async (userId, count, date) => {
    const modelPath = path.join(modelDir, `${userId}.pkl`);
    try {
        await fsp.access(modelPath);
        const cmd = `python ${predictScriptPath} ${modelPath} ${count}`;
        console.log(`Predicting for user id - ${userId} (count: ${count})`);

        const { stdout, stderr } = await execAsync(cmd);

        if (stderr) {
            console.error(`error for ${userId}: ${stderr.trim()}`);
            return; // Skip further processing on error
        }

        const trimmedOutput = stdout.trim();

        let result;
        result = JSON.parse(trimmedOutput);

        // -1 is for outliers
        if (result.prediction == -1) {
            sendEmail(userId, count, date);
            const newAlert = new VisitAlertsSchema({
                submitted_by: userId,
                submission_count: count,
                submitted_on: date,
            });
            await newAlert.save();
        }
    } catch (err) {
        console.error(`Prediction failed for ${userId}: ${err.message}`);
    }
};

export const runDemoCron = async () => {
    try {
        const userCounts = await getTestData();
        console.log(userCounts);
        for (const entry of userCounts) {
            const userId = entry.id;
            const count = entry.count;
            const date = entry.date;
            await predictForUserDemo(userId, count, date);
        }
    } catch (error) {
        logError('runDemoCron', error);
    }
};