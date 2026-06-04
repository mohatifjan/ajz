import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  FileText,
  ClipboardList,
  ClipboardCheck,
  LogOut,
  Menu,
  X,
  Truck,
  Receipt,
  BarChart3,
  Settings
} from 'lucide-react';

export default function Layout({ children }) {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'staff'], permission: 'dashboard' },
    { label: 'Products', path: '/products', icon: Package, roles: ['admin', 'manager'], permission: 'products' },
    { label: 'Customers', path: '/customers', icon: Users, roles: ['admin', 'manager'], permission: 'customers' },
    { label: 'Orders', path: '/orders', icon: ShoppingCart, roles: ['admin', 'manager'], permission: 'orders' },
    { label: 'Invoices', path: '/invoices', icon: FileText, roles: ['admin', 'manager'], permission: 'invoices' },
    { label: 'Customer Ledger', path: '/customer-ledger', icon: ClipboardList, roles: ['admin', 'manager'], permission: 'reports' },
    { label: 'Stock Audits', path: '/audits', icon: ClipboardCheck, roles: ['admin', 'manager'], permission: 'audits' },
    { label: 'Suppliers', path: '/suppliers', icon: Truck, roles: ['admin', 'manager'], permission: 'suppliers' },
    { label: 'Purchase Orders', path: '/purchase-orders', icon: Receipt, roles: ['admin', 'manager'], permission: 'suppliers' },
    { label: 'Reports', path: '/reports', icon: BarChart3, roles: ['admin', 'manager'], permission: 'reports' },
    { label: 'Users', path: '/users', icon: Users, roles: ['admin'], permission: 'users' }
  ];

  const filteredMenuItems = menuItems.filter(item =>
    item.roles.includes(user?.role) || (user?.permissions && user.permissions.includes(item.permission))
  );

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar - Main Parent with fixed height and theme */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} h-full bg-gray-900 text-white transition-all duration-300 flex flex-col z-20`}>
        {/* Top Section: Logo + Header */}
        <div className="flex-shrink-0 p-4">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h1 className="text-4xl font-black text-white tracking-tighter">AJ Traders</h1>
                <p className="text-xs text-gray-300">Inventory System</p>
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Scrollable Middle Section: Dynamic Menu Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.path)
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-300 hover:bg-gray-800'
                  }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section: Settings + Logout (Grouped Footer) */}
        <div className="flex-shrink-0 p-4 mt-auto">
          <div className="space-y-1">
            {/* Settings Link */}
            {(user?.role === 'admin' || (user?.permissions && user.permissions.includes('settings'))) && (
              <Link
                to="/settings"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/settings')
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-300 hover:bg-gray-800'
                  }`}
              >
                <Settings size={20} />
                {sidebarOpen && <span className="font-medium">Settings</span>}
              </Link>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              {sidebarOpen && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              {filteredMenuItems.find(m => isActive(m.path))?.label || 'Dashboard'}
            </h1>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <span className="text-xl font-black text-indigo-600 tracking-tighter uppercase whitespace-nowrap">AJ Traders</span>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
