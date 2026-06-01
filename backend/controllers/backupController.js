import { exec } from 'child_process';
import { promisify } from 'util';
import { createWriteStream, readFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import cron from 'node-cron';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

const BACKUP_DIR = join(__dirname, '../backups');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ajz_pos';

export const createBackup = async (req, res, next) => {
  try {
    const { backupName = `backup_${Date.now()}` } = req.body;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(BACKUP_DIR, `${backupName}_${timestamp}`);

    const command = `mongodump --uri="${MONGODB_URI}" --out="${backupPath}"`;

    await execAsync(command);

    res.status(201).json({
      success: true,
      message: 'Backup created successfully',
      data: {
        backupName: `${backupName}_${timestamp}`,
        path: backupPath,
        timestamp: new Date(),
        size: 'calculating...'
      }
    });
  } catch (error) {
    next(error);
  }
};

export const listBackups = async (req, res, next) => {
  try {
    const { execSync } = require('child_process');
    const fs = require('fs');
    const path = require('path');

    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      return res.json({
        success: true,
        data: [],
        message: 'No backups found'
      });
    }

    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files.map(file => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
        created: stats.birthtime,
        modified: stats.mtime
      };
    });

    res.json({
      success: true,
      data: backups.sort((a, b) => new Date(b.created) - new Date(a.created))
    });
  } catch (error) {
    next(error);
  }
};

export const restoreBackup = async (req, res, next) => {
  try {
    const { backupName } = req.body;

    if (!backupName) {
      return res.status(400).json({ success: false, message: 'Backup name is required' });
    }

    const backupPath = join(BACKUP_DIR, backupName);

    if (!existsSync(backupPath)) {
      return res.status(404).json({ success: false, message: 'Backup not found' });
    }

    const command = `mongorestore --uri="${MONGODB_URI}" --drop "${backupPath}"`;

    await execAsync(command);

    res.json({
      success: true,
      message: 'Backup restored successfully',
      data: {
        restoredBackup: backupName,
        timestamp: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBackup = async (req, res, next) => {
  try {
    const { backupName } = req.params;

    const backupPath = join(BACKUP_DIR, backupName);

    if (!existsSync(backupPath)) {
      return res.status(404).json({ success: false, message: 'Backup not found' });
    }

    const fs = require('fs');
    fs.rmSync(backupPath, { recursive: true, force: true });

    res.json({
      success: true,
      message: 'Backup deleted successfully',
      data: { deletedBackup: backupName }
    });
  } catch (error) {
    next(error);
  }
};

export const getBackupStatus = async (req, res, next) => {
  try {
    const fs = require('fs');
    const path = require('path');

    let totalSize = 0;
    let backupCount = 0;

    if (fs.existsSync(BACKUP_DIR)) {
      const files = fs.readdirSync(BACKUP_DIR);
      backupCount = files.length;

      files.forEach(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      });
    }

    // Get database statistics
    const collections = await mongoose.connection.db.listCollections().toArray();
    const stats = await Promise.all(
      collections.map(async (collection) => {
        const count = await mongoose.connection.collection(collection.name).countDocuments();
        return {
          name: collection.name,
          documents: count
        };
      })
    );

    res.json({
      success: true,
      data: {
        backupStats: {
          totalBackups: backupCount,
          totalSize: (totalSize / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
        },
        databaseStats: {
          uri: MONGODB_URI.split('?')[0],
          collections: stats,
          totalDocuments: stats.reduce((sum, c) => sum + c.documents, 0)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const scheduleBackup = async (req, res, next) => {
  try {
    const { cronExpression = '0 2 * * *' } = req.body;

    cron.schedule(cronExpression, async () => {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = join(BACKUP_DIR, `scheduled_backup_${timestamp}`);
        const command = `mongodump --uri="${MONGODB_URI}" --out="${backupPath}"`;
        await execAsync(command);
        console.log(`Scheduled backup created: ${backupPath}`);
      } catch (error) {
        console.error('Scheduled backup failed:', error);
      }
    });

    res.json({
      success: true,
      message: `Backup scheduled with cron expression: ${cronExpression}`,
      data: { cronExpression }
    });
  } catch (error) {
    next(error);
  }
};

export const exportDatabase = async (req, res, next) => {
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `database_export_${timestamp}.json`;
    const filePath = join(BACKUP_DIR, filename);

    const collections = await mongoose.connection.db.listCollections().toArray();
    const exportData = {};

    for (const collection of collections) {
      const data = await mongoose.connection.collection(collection.name).find({}).toArray();
      exportData[collection.name] = data;
    }

    const fs = require('fs');
    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));

    res.download(filePath, filename, (err) => {
      if (err) next(err);
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error('Error deleting temp file:', e);
      }
    });
  } catch (error) {
    next(error);
  }
};
