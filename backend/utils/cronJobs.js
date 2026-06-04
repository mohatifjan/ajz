import cron from 'node-cron';
import SystemConfig from '../models/SystemConfig.js';
import { generateReportData, formatReportHTML } from './reportService.js';
import { sendEmail } from './emailService.js';
import { logAudit } from '../controllers/auditController.js';

/**
 * Executes the monthly ERP report generation and dispatch.
 * @param {string} triggeredBy - Identifier of who triggered the report (e.g., 'SYSTEM' or userId)
 */
export const runMonthlyReport = async (triggeredBy = 'SYSTEM') => {
    try {
        console.log(`[${new Date().toISOString()}] Starting Monthly ERP Report execution...`);

        // 1. Check if reporting is enabled
        const config = await SystemConfig.findOne({ key: 'monthlyReportEnabled' });
        const isEnabled = config ? config.value === true : false;

        if (!isEnabled) {
            console.log(`[${new Date().toISOString()}] Monthly report is DISABLED. Skipping execution.`);
            await logAudit({
                userId: triggeredBy === 'SYSTEM' ? triggeredBy : triggeredBy,
                userEmail: triggeredBy === 'SYSTEM' ? 'system@ajz.com' : undefined,
                action: 'SYSTEM_MANAGEMENT',
                entityType: 'System',
                description: 'Monthly report execution skipped (disabled by configuration)',
                status: 'success',
                severity: 'low'
            });
            return;
        }

        // 2. Generate Report Data
        const reportData = await generateReportData();
        const htmlContent = formatReportHTML(reportData);

        // 3. Get recipient list (from config or fallback)
        const recipientConfig = await SystemConfig.findOne({ key: 'monthlyReportRecipients' });
        const recipients = recipientConfig ? recipientConfig.value : process.env.COMPANY_EMAIL;

        if (!recipients) {
            throw new Error('No recipients configured for monthly report');
        }

        // 4. Send Email
        const emailResult = await sendEmail({
            to: recipients,
            subject: `AJ Traders Monthly ERP Report - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
            html: htmlContent
        });

        if (emailResult.success) {
            console.log(`[${new Date().toISOString()}] Monthly report sent successfully to ${recipients}`);
            await logAudit({
                userId: triggeredBy === 'SYSTEM' ? triggeredBy : triggeredBy,
                userEmail: triggeredBy === 'SYSTEM' ? 'system@ajz.com' : undefined,
                action: 'SYSTEM_MANAGEMENT',
                entityType: 'System',
                description: `Monthly ERP report sent successfully to ${recipients}`,
                status: 'success',
                severity: 'medium'
            });
        } else {
            throw new Error(emailResult.error);
        }

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Monthly report FAILED:`, error);
        await logAudit({
            userId: triggeredBy === 'SYSTEM' ? triggeredBy : triggeredBy,
            userEmail: triggeredBy === 'SYSTEM' ? 'system@ajz.com' : undefined,
            action: 'SYSTEM_MANAGEMENT',
            entityType: 'System',
            description: `Monthly ERP report failed: ${error.message}`,
            status: 'failed',
            severity: 'high'
        });
    }
};

/**
 * Initializes all cron jobs for the application.
 */
export const initCronJobs = () => {
    // Monthly Report: 29th of every month at 9:00 PM Asia/Karachi
    // Cron format: minute hour day month day-of-week
    // '0 21 29 * *'
    cron.schedule('0 21 29 * *', () => {
        runMonthlyReport();
    }, {
        timezone: 'Asia/Karachi'
    });

    console.log('Cron jobs initialized: Monthly ERP Report scheduled for 29th at 21:00 (PKT)');
};
