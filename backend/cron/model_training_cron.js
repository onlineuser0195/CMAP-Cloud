import { promises as fs } from 'fs';
import path from 'path';
import { FormResponse } from '../models/formResponse.js';
import { fileURLToPath } from 'url';
import { logError } from '../helper/logger.js';
import { startOfDay, subDays } from 'date-fns';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');
const modelDir = path.join(__dirname, 'models_ifm');
const modelTrainingScriptPath = path.join(__dirname, '../../python_ifm/train.py');


const ensureDirectories = async () => {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.mkdir(modelDir, { recursive: true });
}


const exportTrainingData = async () => {
    const DAYS_BACK = 90;
    const startDate = subDays(startOfDay(new Date()), DAYS_BACK);

    const results = await FormResponse.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
            $group: {
                _id: {
                    userId: '$created_by',
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                },
                count: {$sum: 1}
            }
        },
        {
            $group: {
                _id: '$_id.userId',
                dailyCounts: {
                    $push: {
                        date: '$_id.date',
                        count: '$count'
                    }
                }
            }
        }
    ]);

    for (const user of results) {
        console.log(user);
        const userId = user._id;
        const filePath = path.join(dataDir, `${userId}.csv`);
        const rows = ['date,count', ...user.dailyCounts.map(r => `${r.date},${r.count}`)];

        fs.writeFile(filePath, rows.join('\n'));
        console.log(`📁 Model Saved: ${filePath}`);
    }
}

const trainModels = async () => {
    const cmd = `python ${modelTrainingScriptPath} ${dataDir} ${modelDir}`;
    console.log(`Running command: ${cmd}`);
    const {stdout, stderr} = await execAsync(cmd);

    if (stdout) console.log(stdout);
    if (stderr) console.log(stderr);
}

export const runModelTraining = async () => {
    try {
        await ensureDirectories();
        // await exportTrainingData();
        await trainModels();
    } catch (error) {
        logError('run', error);
    }
}
