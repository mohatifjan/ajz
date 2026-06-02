import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { Database, Download, Trash2, Play, Save, BarChart3 } from 'lucide-react';

export default function BackupPage() {
  const [backups, setBackups] = useState([]);
  const [backupStatus, setBackupStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [backupName, setBackupName] = useState('');
  const [cronExpression, setCronExpression] = useState('0 2 * * *');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    fetchBackups();
    fetchBackupStatus();
    const interval = setInterval(fetchBackups, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchBackups = async () => {
    try {
      const response = await apiClient.get('/backup/list');
      if (response.data.success) {
        setBackups(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch backups');
    }
  };

  const fetchBackupStatus = async () => {
    try {
      const response = await apiClient.get('/backup/status');
      if (response.data.success) {
        setBackupStatus(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch status');
    }
  };

  const handleCreateBackup = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.post('/backup/create', {
        backupName: backupName || `backup_${new Date().toLocaleString()}`
      });

      if (response.data.success) {
        setSuccess('Backup created successfully');
        setBackupName('');
        setTimeout(() => {
          fetchBackups();
          setSuccess(null);
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async (backup) => {
    if (!window.confirm(`Are you sure you want to restore from "${backup.name}"? This will overwrite current data.`)) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.post('/backup/restore', {
        backupName: backup.name
      });

      if (response.data.success) {
        setSuccess('Backup restored successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to restore backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBackup = async (backupName) => {
    if (!window.confirm(`Are you sure you want to delete "${backupName}"?`)) {
      return;
    }

    try {
      await apiClient.delete(`/backup/${backupName}`);
      setSuccess('Backup deleted successfully');
      setTimeout(() => {
        fetchBackups();
        setSuccess(null);
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete backup');
    }
  };

  const handleScheduleBackup = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.post('/backup/schedule', {
        cronExpression
      });

      if (response.data.success) {
        setSuccess(response.data.message);
        setShowScheduleModal(false);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportDatabase = async () => {
    try {
      const response = await apiClient.get('/backup/export/json', {
        responseType: 'blob'
      });

      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export database');
    }
  };

  const formatDate = (date) => new Date(date).toLocaleString();

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Database Backup & Restore</h1>
        <p className="text-gray-600 mt-2">Manage backups, restore data, and schedule automatic backups.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      {/* Status Cards */}
      {backupStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Backups</p>
                <p className="text-3xl font-bold text-gray-900">{backupStatus.backupStats.totalBackups}</p>
              </div>
              <Database className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div>
              <p className="text-gray-600 text-sm">Backup Storage</p>
              <p className="text-3xl font-bold text-gray-900">{backupStatus.backupStats.totalSize}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div>
              <p className="text-gray-600 text-sm">Collections</p>
              <p className="text-3xl font-bold text-gray-900">{backupStatus.databaseStats.collections.length}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div>
              <p className="text-gray-600 text-sm">Total Documents</p>
              <p className="text-3xl font-bold text-gray-900">{backupStatus.databaseStats.totalDocuments}</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Backup Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Backup</h2>
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2">Backup Name</label>
            <input
              type="text"
              value={backupName}
              onChange={(e) => setBackupName(e.target.value)}
              placeholder="e.g., weekly_backup, monthly_backup"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleCreateBackup}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg flex items-center gap-2"
            >
              <Save size={18} />
              Create Backup
            </button>
            <button
              onClick={handleExportDatabase}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
            >
              <Download size={18} />
              Export JSON
            </button>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
            >
              <BarChart3 size={18} />
              Schedule
            </button>
          </div>
        </div>
      </div>

      {/* Backups List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Backup History</h2>
          <p className="text-gray-600 text-sm mt-1">
            {backups.length} backup{backups.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {backups.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No backups found. Create one to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Backup Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Size</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Modified</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup, idx) => (
                  <tr key={idx} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {backup.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {backup.size}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(backup.created)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(backup.modified)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleRestoreBackup(backup)}
                          disabled={isLoading}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          title="Restore this backup"
                        >
                          <Play size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteBackup(backup.name)}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Delete this backup"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Database Statistics */}
      {backupStatus && backupStatus.databaseStats.collections.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Database Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {backupStatus.databaseStats.collections.map((collection, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                <p className="font-medium text-gray-900">{collection.name}</p>
                <p className="text-2xl font-bold text-blue-600">{collection.documents}</p>
                <p className="text-sm text-gray-600">documents</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Schedule Automatic Backup</h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Cron Expression</label>
              <input
                type="text"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                placeholder="0 2 * * *"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-600 mt-2">
                Default: 0 2 * * * (Daily at 2 AM)<br />
                Format: minute hour day month dayOfWeek
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleBackup}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
