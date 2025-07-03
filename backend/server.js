import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js'; // MongoDB connection
import systemRoutes from './routes/systemRoutes.js';
import formRoutes from './routes/formRoutes.js';
import fieldRoutes from './routes/fieldRoutes.js';
import loginRoutes from './routes/loginRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import formResponseRoutes from './routes/formResponseRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import confirmationUserRoutes from './routes/confirmationUserRoutes.js';
import fvsAdminRoutes from './routes/fvsAdminRoutes.js';
import pdfRoutes from './routes/pdfRoutes.js';
import dbRoutes from './routes/dbRoutes.js';
import itUserRoutes from './elisa/routes/itUserRoutes.js';
import spanSupportUserRoutes from './elisa/routes/spanSupportUserRoutes.js';
import industryApplicantUserRoutes from './elisa/routes/industryApplicantUserRoutes.js';
import { startSchedulers } from './cron/scheduler.js';
import { runOutlierPrediction } from './cron/outlier_prediction_cron.js';
import crypto from 'crypto';
import morgan from 'morgan';
import logger from './helper/logger.js';
import { accessLogStream, logError } from './helper/logger.js';
import actionLogger from './middleware/actionLogger.js'
import ticketRoutes from './routes/ticketRoutes.js';
import portfolioOwnerRoutes from './prism/routes/portfolioOwnerRoutes.js'
import projectManagerRoutes from './prism/routes/projectManagerRoutes.js'

dotenv.config();

const app = express();

app.use(
  morgan('combined', {
    stream: accessLogStream
  })
);

// Global error handler (optionally log errors)
app.use((err, req, res, next) => {
  logError('UnhandledError', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Connect to MongoDB
await connectDB();

// app.use(cors());

const allowedOrigins = [ process.env.FRONTEND_URL, 'http://localhost'];


// app.use(cors({
//   origin: (origin, callback) => {
//     if (allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true
// }));

// app.use(cors({
//   origin: 'https://frontend.azurestaticapps.net', // exact frontend domain
//   credentials: true                                // allow cookies/auth headers
// }));

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(express.json());

app.use('/api/login', loginRoutes);

app.use('/api/admin', adminRoutes);

app.use('/api/fvs-admin', fvsAdminRoutes);

app.use('/api/confirmation-user', confirmationUserRoutes);

app.use('/api', systemRoutes);

app.use('/api', formRoutes);

app.use('/api', fieldRoutes);

app.use('/api', formResponseRoutes)

app.use('/api/dashboard', dashboardRoutes);

app.use('/api/uploads', express.static('uploads'));

app.use('/api', pdfRoutes);

app.use('/api', dbRoutes);

// app.use('/api/logs', actionLogger)
app.use('/api/logs', cors(corsOptions), actionLogger);

app.use('/api/tickets', ticketRoutes);


//ELISA
app.use('/api/elisa/it-user', itUserRoutes);
app.use('/api/elisa/span-user', spanSupportUserRoutes);
app.use('/api/elisa/industry-applicant', industryApplicantUserRoutes);


//PRISM
app.use('/api/prism/portfolio-owner', portfolioOwnerRoutes);

app.use('/api/prism/project-manager', projectManagerRoutes);

const PORT = process.env.PORT || 8080;

// cron job to train models for foreign visit requests outlier prediction
// startSchedulers();
// runOutlierPrediction();

// start the Express server
app.listen(PORT, () => { 
    console.log(`Server running on port ${PORT}`);
    // logger.info(`Server listening on port ${PORT}`);
});

// const key = crypto.randomBytes(32).toString('hex');
// console.log(`FILE_ENCRYPTION_KEY=${key}`);