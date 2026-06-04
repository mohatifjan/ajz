import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CustomersPage from './pages/CustomersPage';
import OrdersPage from './pages/OrdersPage';
import InvoicesPage from './pages/InvoicesPage';
import LedgerPage from './pages/LedgerPage';
import StockAuditPage from './pages/StockAuditPage';
import SuppliersPage from './pages/SuppliersPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import ReportsPage from './pages/ReportsPage';
import UserManagementPage from './pages/UserManagementPage';
import SettingsPage from './pages/SettingsPage';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const user = useAuthStore((state) => state.user);

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function App() {
  const loadUser = useAuthStore((state) => state.loadUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/customers" element={<CustomersPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/invoices" element={<InvoicesPage />} />
                  <Route path="/customer-ledger" element={<RoleProtectedRoute allowedRoles={['admin', 'manager']}><LedgerPage /></RoleProtectedRoute>} />
                  <Route path="/audits" element={<RoleProtectedRoute allowedRoles={['admin', 'manager']}><StockAuditPage /></RoleProtectedRoute>} />
                  <Route path="/suppliers" element={<RoleProtectedRoute allowedRoles={['admin', 'manager']}><SuppliersPage /></RoleProtectedRoute>} />
                  <Route path="/purchase-orders" element={<RoleProtectedRoute allowedRoles={['admin', 'manager']}><PurchaseOrdersPage /></RoleProtectedRoute>} />
                  <Route path="/reports" element={<RoleProtectedRoute allowedRoles={['admin', 'manager']}><ReportsPage /></RoleProtectedRoute>} />
                  <Route path="/users" element={<RoleProtectedRoute allowedRoles={['admin']}><UserManagementPage /></RoleProtectedRoute>} />
                  <Route path="/settings" element={<RoleProtectedRoute allowedRoles={['admin']}><SettingsPage /></RoleProtectedRoute>} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
