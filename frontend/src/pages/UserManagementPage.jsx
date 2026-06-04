import React, { useState, useEffect, useMemo } from 'react';
import { userAPI } from '../services/api';
import {
    UserPlus, Shield, User as UserIcon, Mail, Phone,
    Trash2, Edit2, CheckCircle, XCircle, Search,
    Filter, Users as UsersGroup, ShieldCheck, Activity,
    Calendar, MoreVertical, ShieldAlert, Key
} from 'lucide-react';

// Professional Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md">
        <div className={`p-3 rounded-lg ${color}`}>
            <Icon size={24} className="text-white" />
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);

export default function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [activeTab, setActiveTab] = useState('general'); // 'general' or 'permissions'
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: 'staff',
        department: 'sales',
        status: 'active',
        permissions: []
    });

    // Permission options per module
    const permissionOptions = [
        { id: 'dashboard', label: 'Dashboard Access' },
        { id: 'products', label: 'Inventory Management' },
        { id: 'orders', label: 'Sales & Orders' },
        { id: 'customers', label: 'Customer Management' },
        { id: 'invoices', label: 'Billing & Invoices' },
        { id: 'reports', label: 'Financial Reports' },
        { id: 'audits', label: 'Stock Auditing' },
        { id: 'suppliers', label: 'Supplier Management' }
    ];

    useEffect(() => {
        fetchUsers();
    }, [searchQuery, roleFilter, statusFilter]);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const params = {
                search: searchQuery,
                role: roleFilter === 'all' ? undefined : roleFilter,
                status: statusFilter === 'all' ? undefined : statusFilter
            };
            const response = await userAPI.getAll(params);
            if (response.data.status === 'success') {
                setUsers(response.data.data);
            }
        } catch (err) {
            setError('Failed to fetch users');
        } finally {
            setIsLoading(false);
        }
    };

    const stats = useMemo(() => {
        return {
            total: users.length,
            admins: users.filter(u => u.role === 'admin').length,
            active: users.filter(u => u.status === 'active').length,
            staff: users.filter(u => u.role === 'staff').length
        };
    }, [users]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const togglePermission = (permId) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permId)
                ? prev.permissions.filter(p => p !== permId)
                : [...prev.permissions, permId]
        }));
    };

    const handleEditClick = (user) => {
        setEditingUser(user);
        setFormData({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            password: '',
            role: user.role,
            department: user.department,
            status: user.status,
            permissions: user.permissions || []
        });
        setActiveTab('general');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            let response;
            if (editingUser) {
                const dataToSend = { ...formData };
                if (!dataToSend.password) delete dataToSend.password;
                response = await userAPI.update(editingUser._id, dataToSend);
            } else {
                response = await userAPI.create(formData);
            }

            if (response.data.status === 'success') {
                setShowModal(false);
                setEditingUser(null);
                fetchUsers();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Operation failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('IRREVERSIBLE ACTION: Delete user account?')) return;
        try {
            await userAPI.delete(id);
            fetchUsers();
        } catch (err) {
            setError('Account deletion failed');
        }
    };

    const resetForm = () => {
        setEditingUser(null);
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            password: '',
            role: 'staff',
            department: 'sales',
            status: 'active',
            permissions: []
        });
        setShowModal(false);
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Identity Management</h1>
                    <p className="text-gray-500 mt-1 font-medium">Enterprise Resource Planning & Access Control</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm hover:shadow-md ring-1 ring-blue-700/10"
                >
                    <UserPlus size={18} />
                    <span className="font-semibold">Provision New User</span>
                </button>
            </div>

            {/* Quick Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Personnel" value={stats.total} icon={UsersGroup} color="bg-indigo-600" />
                <StatCard title="System Admins" value={stats.admins} icon={ShieldCheck} color="bg-blue-600" />
                <StatCard title="Active Status" value={stats.active} icon={Activity} color="bg-emerald-600" />
                <StatCard title="Frontline Staff" value={stats.staff} icon={UserIcon} color="bg-amber-600" />
            </div>

            {/* Powerful Controls section */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4 mb-6">
                <div className="flex-1 relative min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="text-gray-400" size={18} />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="bg-gray-50 border-none text-sm rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin Only</option>
                        <option value="manager">Managers</option>
                        <option value="staff">Staff</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-gray-50 border-none text-sm rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                    </select>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-6 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-2">
                        <ShieldAlert size={18} />
                        <span className="font-medium text-sm">{error}</span>
                    </div>
                    <button onClick={() => setError(null)} className="hover:bg-red-100 p-1 rounded transition-colors">✕</button>
                </div>
            )}

            {/* Data Grid */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Employee Profile</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Authority</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Organization</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Last Login</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Account State</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading && users.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <Activity className="animate-pulse text-blue-600 mx-auto mb-2" size={32} />
                                        <p className="text-gray-400 text-sm">Indexing records...</p>
                                    </td>
                                </tr>
                            ) : users.map((u) => (
                                <tr key={u._id} className="hover:bg-blue-50/30 transition-all group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold shadow-sm ring-2 ring-white overflow-hidden uppercase">
                                                {u.firstName[0]}{u.lastName[0]}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{u.firstName} {u.lastName}</div>
                                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Mail size={12} /> {u.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <Shield size={14} className={u.role === 'admin' ? 'text-purple-500' : 'text-blue-500'} />
                                            <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${u.role === 'admin' ? 'bg-purple-50 text-purple-600' :
                                                u.role === 'manager' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {u.role}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-sm font-medium text-gray-600 capitalize">{u.department}</div>
                                        <div className="text-[11px] text-gray-400">Branch Primary</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                            <Calendar size={14} className="text-gray-300" />
                                            {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border transition-all ${u.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            u.status === 'suspended' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                'bg-red-50 text-red-600 border-red-100'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-current'}`}></span>
                                            {u.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex justify-center items-center gap-2.5">
                                            <button
                                                onClick={() => handleEditClick(u)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Edit Account"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(u._id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Revoke Access"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Professional Management Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-8 duration-300">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
                                    {editingUser ? <Edit2 className="text-white" size={20} /> : <UserPlus className="text-white" size={20} />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {editingUser ? 'Account Management' : 'Identity Provisioning'}
                                    </h2>
                                    <p className="text-xs text-gray-500 font-medium">Configure credentials and module permissions</p>
                                </div>
                            </div>
                            <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">✕</button>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="flex border-b border-gray-50 px-6 bg-white">
                            <button
                                onClick={() => setActiveTab('general')}
                                className={`px-4 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                <UserIcon size={16} /> Profile Information
                            </button>
                            <button
                                onClick={() => setActiveTab('permissions')}
                                className={`px-4 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'permissions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                <ShieldCheck size={16} /> Roles & Permissions
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[70vh]">
                            <div className="p-8 space-y-6">
                                {activeTab === 'general' ? (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Given Name</label>
                                                <input
                                                    type="text"
                                                    name="firstName"
                                                    required
                                                    value={formData.firstName}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Family Name</label>
                                                <input
                                                    type="text"
                                                    name="lastName"
                                                    required
                                                    value={formData.lastName}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Official Email</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mobile Terminal</label>
                                                <input
                                                    type="text"
                                                    name="phone"
                                                    required
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 pt-2">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                <Key size={14} className="text-gray-300" />
                                                {editingUser ? 'Credential Reset (Leave blank to keep encrypted)' : 'Access Password'}
                                            </label>
                                            <input
                                                type="password"
                                                name="password"
                                                required={!editingUser}
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                placeholder={editingUser ? "••••••••" : "Require 6+ characters"}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                                        <div className="grid grid-cols-3 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Policy Level</label>
                                                <select
                                                    name="role"
                                                    value={formData.role}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-sm font-bold"
                                                >
                                                    <option value="staff">Staff</option>
                                                    <option value="manager">Manager</option>
                                                    <option value="admin">Global Admin</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Business Unit</label>
                                                <select
                                                    name="department"
                                                    value={formData.department}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-sm font-bold"
                                                >
                                                    <option value="sales">Sales</option>
                                                    <option value="inventory">Inventory</option>
                                                    <option value="accounts">Finance</option>
                                                    <option value="admin">Operations</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Audit State</label>
                                                <select
                                                    name="status"
                                                    value={formData.status}
                                                    onChange={handleInputChange}
                                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-sm font-bold"
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="inactive">Inactive</option>
                                                    <option value="suspended">Suspended</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Fine-Grained Permissions</p>
                                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">Custom Logic Enabled</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {permissionOptions.map(opt => (
                                                    <label
                                                        key={opt.id}
                                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${formData.permissions.includes(opt.id)
                                                            ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200'
                                                            : 'bg-white border-gray-100 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        <span className={`text-xs font-bold ${formData.permissions.includes(opt.id) ? 'text-blue-700' : 'text-gray-600'}`}>
                                                            {opt.label}
                                                        </span>
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only"
                                                            checked={formData.permissions.includes(opt.id)}
                                                            onChange={() => togglePermission(opt.id)}
                                                        />
                                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${formData.permissions.includes(opt.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-200'
                                                            }`}>
                                                            {formData.permissions.includes(opt.id) && <CheckCircle size={10} className="text-white" />}
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex gap-3 justify-end items-center">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    Discard Changes
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md disabled:bg-gray-400 flex items-center gap-2"
                                >
                                    {isLoading && <Activity size={16} className="animate-spin" />}
                                    {isLoading ? 'Processing...' : (editingUser ? 'Synchronize Record' : 'Execute Provisioning')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
