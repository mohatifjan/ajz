import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { runMonthlyReport } from '../utils/cronJobs.js';
import SystemConfig from '../models/SystemConfig.js';

dotenv.config();

const testReport = async () => {
    try {
        console.log('--- ERP Report Manual Test ---');

        // Connect to DB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to Database');

        // Ensure the toggle is enabled for the test
        const config = await SystemConfig.findOneAndUpdate(
            { key: 'monthlyReportEnabled' },
            { value: true },
            { upsert: true, new: true }
        );
        console.log('Reporting enabled for test:', config.value);

        // Set a test recipient if none exists
        const recipient = await SystemConfig.findOneAndUpdate(
            { key: 'monthlyReportRecipients' },
            { value: process.env.COMPANY_EMAIL || 'test@example.com' },
            { upsert: true, new: true }
        );
        console.log('Test recipient set to:', recipient.value);

        console.log('Triggering report generation...');
        await runMonthlyReport('MANUAL_TEST');

        console.log('Test completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Test FAILED:', error);
        process.exit(1);
    }
};

testReport();
