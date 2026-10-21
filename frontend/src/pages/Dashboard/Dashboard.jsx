import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Receipt,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  Package,
  Users,
  Eye,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/common/Modal/Modal";
import PrintableInvoice from "../../components/invoices/PrintableInvoice";
import Loader from "../../components/common/Loader/Loader";
import styles from "./Dashboard.module.css";

const Dashboard = () => {
  const { business } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // View Modal
  const [viewInvoice, setViewInvoice] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get("/reports/dashboard");
        if (res.success && res.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.error("Fetch dashboard stats error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleOpenViewModal = async (invoiceId) => {
    try {
      const res = await api.get(`/invoices/${invoiceId}`);
      if (res.success && res.data?.invoice) {
        setViewInvoice(res.data.invoice);
        setIsViewModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to load invoice for view:", err);
    }
  };

  const currencySymbol = business?.currency?.symbol || "₹";

  if (loading) {
    return <Loader message="Calculating live dashboard metrics..." />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Business Dashboard</h1>
          <p className={styles.subtitle}>
            Real-time sales performance and billing summary for {business?.name || "your store"}
          </p>
        </div>
      </div>

      {/* Prominent New Bill Banner */}
      <div className={styles.newBillBanner}>
        <div className={styles.bannerContent}>
          <h2>Ready to generate a new customer invoice?</h2>
          <p>Instant barcode scanning, auto-calculated GST & discounts, and thermal/A4 printing.</p>
        </div>
        <Link to="/billing/new" className={styles.bannerBtn}>
          <PlusCircle size={20} />
          <span>New Bill</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.iconWrapper} style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className={styles.kpiLabel}>Today's Sales</div>
            <div className={styles.kpiValue}>
              {currencySymbol}{Number(stats?.todaySales || 0).toFixed(2)}
            </div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.iconWrapper} style={{ backgroundColor: "#f0fdf4", color: "#16a34a" }}>
            <Receipt size={24} />
          </div>
          <div>
            <div className={styles.kpiLabel}>Invoices Today</div>
            <div className={styles.kpiValue}>{stats?.todayInvoiceCount || 0}</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.iconWrapper} style={{ backgroundColor: "#ecfdf5", color: "#059669" }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div className={styles.kpiLabel}>Payments Collected Today</div>
            <div className={styles.kpiValue}>
              {currencySymbol}{Number(stats?.paymentsReceivedToday || 0).toFixed(2)}
            </div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.iconWrapper} style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div className={styles.kpiLabel}>Outstanding Dues</div>
            <div className={styles.kpiValue} style={{ color: (stats?.outstandingDues || 0) > 0 ? "#dc2626" : "#0f172a" }}>
              {currencySymbol}{Number(stats?.outstandingDues || 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Catalog Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div className={styles.kpiCard} style={{ padding: "16px 20px" }}>
          <Package size={22} color="#64748b" />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: "0.825rem", color: "#64748b" }}>Active Products in Catalog:</span>
            <strong style={{ marginLeft: "8px", fontSize: "1rem" }}>{stats?.totalProducts || 0}</strong>
          </div>
          <Link to="/products" style={{ fontSize: "0.825rem", color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
            Manage &rarr;
          </Link>
        </div>

        <div className={styles.kpiCard} style={{ padding: "16px 20px" }}>
          <Users size={22} color="#64748b" />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: "0.825rem", color: "#64748b" }}>Registered Customers:</span>
            <strong style={{ marginLeft: "8px", fontSize: "1rem" }}>{stats?.totalCustomers || 0}</strong>
          </div>
          <Link to="/customers" style={{ fontSize: "0.825rem", color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
            View Directory &rarr;
          </Link>
        </div>
      </div>

      {/* Recent Invoices Section */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Invoices</h2>
          <Link to="/invoices" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
            <span>View All Invoices</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {(!stats?.recentInvoices || stats.recentInvoices.length === 0) ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
            <Receipt size={36} style={{ marginBottom: "8px" }} />
            <p>No invoices generated yet.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Grand Total</th>
                <th>Paid</th>
                <th>Balance Due</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentInvoices.map((inv) => (
                <tr key={inv._id}>
                  <td><strong>{inv.invoiceNumber}</strong></td>
                  <td>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                  <td>{inv.customerSnapshot?.name || "Walk-in Customer"}</td>
                  <td><strong>{currencySymbol}{Number(inv.grandTotal).toFixed(2)}</strong></td>
                  <td style={{ color: "#16a34a" }}>{currencySymbol}{Number(inv.amountPaid).toFixed(2)}</td>
                  <td style={{ color: inv.balanceDue > 0 ? "#dc2626" : "#475569" }}>
                    {currencySymbol}{Number(inv.balanceDue).toFixed(2)}
                  </td>
                  <td>
                    {inv.paymentStatus === "PAID" && <span className="badge badge-paid">PAID</span>}
                    {inv.paymentStatus === "PARTIALLY_PAID" && <span className="badge badge-partial">PARTIAL</span>}
                    {inv.paymentStatus === "UNPAID" && <span className="badge badge-unpaid">UNPAID</span>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenViewModal(inv._id)}
                      title="View / Print Invoice"
                    >
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Invoice ${viewInvoice?.invoiceNumber || ""}`}
        size="lg"
      >
        {viewInvoice && (
          <PrintableInvoice
            invoice={viewInvoice}
            business={business}
            onPrint={() => window.print()}
          />
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
