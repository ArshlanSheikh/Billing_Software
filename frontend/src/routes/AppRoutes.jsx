import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Layout from "../components/common/Layout/Layout";
import AuthPage from "../pages/Auth/AuthPage";
import Dashboard from "../pages/Dashboard/Dashboard";
import NewBill from "../pages/Billing/NewBill";
import InvoiceHistory from "../pages/Invoices/InvoiceHistory";
import ProductsPage from "../pages/Products/ProductsPage";
import CustomersPage from "../pages/Customers/CustomersPage";
import PaymentsPage from "../pages/Payments/PaymentsPage";
import ReportsPage from "../pages/Reports/ReportsPage";
import SettingsPage from "../pages/Settings/SettingsPage";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<AuthPage />} />

      {/* Protected App Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/billing/new" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/billing/new" element={<NewBill />} />
          <Route path="/invoices" element={<InvoiceHistory />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
