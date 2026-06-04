import React, { useState, useEffect } from 'react';
import { configAPI } from '../services/api';
import {
    Settings,
    Mail,
    Bell,
    Save,
    Shield,
    Activity,
    ToggleLeft,
    ToggleRight,
    Info,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

export default function SettingsPage() {
    const [configs, setConfigs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const [settings, setSettings] = useState({
        monthlyReportEnabled: false,
        monthlyReportRecipients: ''
    });

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            setIsLoading(true);
            const response = await configAPI.getAll();
            if (response.data.status === 'success') {
                const configData = response.data.data;
                setConfigs(configData);

                // Map configs to local state
                const enabled = configData.find(c => c.key === 'monthlyReportEnabled');
                const recipients = configData.find(c => c.key === 'monthlyReportRecipients');

                setSettings({
                    monthlyReportEnabled: enabled ? enabled.value : false,
                    monthlyReportRecipients: recipients ? recipients.value : ''
                });
            }
        } catch (err) {
            setError('Failed to fetch system configurations');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async () => {
        const newValue = !settings.monthlyReportEnabled;
        setSettings(prev => ({ ...prev, monthlyReportEnabled: newValue }));

        try {
            await configAPI.update('monthlyReportEnabled', { value: newValue });
            setSuccess('Auto-reporting status updated');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Failed to update reporting status');
            setSettings(prev => ({ ...prev, monthlyReportEnabled: !newValue })); // Rollback
        }
    };

    const handleSaveRecipients = async () => {
        try {
            setIsSaving(true);
            await configAPI.update('monthlyReportRecipients', { value: settings.monthlyReportRecipients });
            setSuccess('Recipients list updated');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Failed to update recipients');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                            <Settings className="text-blue-600" size={32} />
                            System Control Panel
                        </h1>
                        <p className="text-gray-500 mt-1 font-medium">Enterprise Management & Automated Reporting Settings</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-6 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={18} />
                            <span className="font-medium text-sm">{error}</span>
                        </div>
                        <button onClick={() => setError(null)} className="hover:bg-red-100 p-1 rounded transition-colors">✕</button>
                    </div>
                )}

                {success && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-xl mb-6 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-2">
                            <CheckCircle size={18} />
                            <span className="font-medium text-sm">{success}</span>
                        </div>
                        <button onClick={() => setSuccess(null)} className="hover:bg-emerald-100 p-1 rounded transition-colors">✕</button>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-8">
                    {/* Email Reporting Section */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
                                    <Mail className="text-white" size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Monthly Email Report</h2>
                                    <p className="text-xs text-gray-500 font-medium">Configure automated executive summaries</p>
                                </div>
                            </div>
                            <button
                                onClick={handleToggle}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${settings.monthlyReportEnabled
                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                {settings.monthlyReportEnabled ? (
                                    <>
                                        <ToggleRight size={24} className="text-emerald-600" />
                                        ENABLED
                                    </>
                                ) : (
                                    <>
                                        <ToggleLeft size={24} />
                                        DISABLED
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="flex items-start gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                <Info size={20} className="text-blue-600 mt-0.5" />
                                <div className="text-sm text-blue-800 leading-relaxed">
                                    <p className="font-bold mb-1">Automation Intelligence</p>
                                    <p>The system will automatically aggregate financial, inventory, and operational metrics on the <strong>29th of every month at 09:00 PM (PKT)</strong>. Reports will be dispatched to the designated recipients only when this toggle is enabled.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Recipient Distribution List</label>
                                    <div className="flex gap-4">
                                        <div className="flex-1 relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="admin@example.com, manager@example.com"
                                                value={settings.monthlyReportRecipients}
                                                onChange={(e) => setSettings(prev => ({ ...prev, monthlyReportRecipients: e.target.value }))}
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium"
                                            />
                                        </div>
                                        <button
                                            onClick={handleSaveRecipients}
                                            disabled={isSaving}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md disabled:bg-gray-400"
                                        >
                                            {isSaving ? <Activity size={18} className="animate-spin" /> : <Save size={18} />}
                                            Update List
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 font-medium">Multiple emails should be separated by commas.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                                <div className="p-4 rounded-xl border border-gray-50 hover:border-blue-100 transition-colors">
                                    <h4 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
                                        <Bell size={16} className="text-blue-500" />
                                        Delivery Timezone
                                    </h4>
                                    <p className="text-xs text-gray-500">Fixed at Asia/Karachi (GMT+5). Consistent delivery regardless of server location.</p>
                                </div>
                                <div className="p-4 rounded-xl border border-gray-50 hover:border-blue-100 transition-colors">
                                    <h4 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
                                        <Shield size={16} className="text-emerald-500" />
                                        Access Control
                                    </h4>
                                    <p className="text-xs text-gray-500">Only Global Administrators can modify these automation parameters.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Additional Settings Placeholder */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center text-center opacity-50 select-none">
                        <div className="p-4 bg-gray-50 rounded-full mb-4">
                            <Activity className="text-gray-300" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-400">Advanced Integrations</h3>
                        <p className="text-sm text-gray-400 max-w-xs">Additional automation controls and webhooks will be available in future enterprise updates.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
