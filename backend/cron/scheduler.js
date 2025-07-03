import cron from 'node-cron';
import { runModelTraining } from './model_training_cron.js';
import { runOutlierPrediction } from './outlier_prediction_cron.js';


export const startSchedulers = () => {
    console.log('📆 Schedulers initialized...');

    // Weekly Model Training - every Sunday at 3:00 AM
    cron.schedule('0 3 * * 0', async () => {
        console.log('Running weekly model training job...');

        try {
            await runModelTraining();
        } catch (error) {
            logError('startSchedulers - runModelTraining', err);
        }
    });

    // Daily Outlier Prediction - every day at 4:00 AM
    cron.schedule('0 4 * * *', async () => {
        console.log('Running daily prediction job...');

        try {
            await runOutlierPrediction();
        } catch (error) {
            logError('startSchedulers - runOutlierPrediction', err);
        }
    });
};
