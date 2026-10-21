import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Eye,
  Printer,
  CreditCard,
  Ban,
  FileText,
  PlusCircle,
  Filter,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Modal from "../../components/common/Modal/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";
import PrintableInvoice from "../../components/invoices/PrintableInvoice";
import Loader from "../../components/common/Loader/Loader";
import styles from "./InvoiceHistory.module.css";

const InvoiceHistory = () => {
  const { business } = useAuth();
  const { showToast } = useToast();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // View / Print Modal
  const [viewInvoice, setViewInvoice] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Record Payment Modal
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, invoice: null });
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [paySubmitting, setPaySubmitting] = useState(false);

  // Cancel Dialog
  const [cancelDialog, setCancelDialog] = useState({ isOpen: false, invoice: null });
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);
      if (paymentStatus !== "ALL") queryParams.append("paymentStatus", paymentStatus);
      if (status !== "ALL") queryParams.append("status", status);
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);

      const res = await api.get(`/invoices?${queryParams.toString()}`);
      if (res.success) {
        setInvoices(res.data.invoices || []);
      }
    } catch (err) {
      console.error("Fetch invoices error:", err);
      showToast("Failed to load invoices", "error");
    } finally {
      setLoading(false);
    }
  }, [search, paymentStatus, status, startDate, endDate, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchInvoices]);

  const handleOpenViewModal = (invoice) => {
    setViewInvoice(invoice);
    setIsViewModalOpen(true);
  };

  const handleOpenPaymentModal = (invoice) => {
    setPaymentModal({ isOpen: true, invoice });
    setPayAmount(invoice.balanceDue);
    setPayMethod("CASH");
    setPayRef("");
    setPayNotes("");
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amountNum = Number(payAmount);
    if (!amountNum || amountNum <= 0) {
      showToast("Please enter a valid payment amount", "warning");
      return;
    }

    try {
      setPaySubmitting(true);
      const res = await api.post("/payments", {
        invoiceId: paymentModal.invoice._id,
        amount: amountNum,
        paymentMethod: payMethod,
        referenceNumber: payRef,
        notes: payNotes,
      });

      if (res.success) {
        showToast("Payment recorded successfully", "success");
        setPaymentModal({ isOpen: false, invoice: null });
        fetchInvoices();
      }
    } catch (err) {
      console.error("Record payment error:", err);
      showToast(err.message || "Failed to record payment", "error");
    } finally {
      setPaySubmitting(false);
    }
  };

  const handleCancelInvoice = async () => {
    if (!cancelDialog.invoice) return;

    try {
      setCancelLoading(true);
      const res = await api.post(`/invoices/${cancelDialog.invoice._id}/cancel`, {
        reason: cancelReason || "Cancelled by user",
      });

      if (res.success) {
        showToast("Invoice cancelled and records updated", "success");
        setCancelDialog({ isOpen: false, invoice: null });
        setCancelReason("");
        fetchInvoices();
      }
    } catch (err) {
      console.error("Cancel invoice error:", err);
      showToast(err.message || "Failed to cancel invoice", "error");
    } finally {
      setCancelLoading(false);
    }
  };

  const currencySymbol = business?.currency?.symbol || "₹";

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Invoice History & Sales Records</h1>
          <p className={styles.subtitle}>Track, search, print receipts, and manage outstanding balances</p>
        </div>
        <Link to="/billing/new" className="btn btn-primary">
          <PlusCircle size={16} />
          <span>New Bill</span>
        </Link>
      </div>

      {/* Filter Card */}
      <div className={styles.filterCard}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={`form-input ${styles.searchInput}`}
            placeholder="Search invoice #, customer name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className="form-label" style={{ margin: 0 }}>Payment:</label>
          <select
            className="form-select"
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
          >
            <option value="ALL">All Payments</option>
            <option value="PAID">Fully Paid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className="form-label" style={{ margin: 0 }}>Status:</label>
          <select
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className="form-label" style={{ margin: 0 }}>From:</label>
          <input
            type="date"
            className="form-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className="form-label" style={{ margin: 0 }}>To:</label>
          <input
            type="date"
            className="form-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <Loader message="Loading invoices..." />
        ) : invoices.length === 0 ? (
          <div className={styles.emptyState}>
            <FileText size={48} color="#94a3b8" />
            <h3>No invoices found</h3>
            <p>No invoices match your selected filters. Create a new bill to record a sale.</p>
            <Link to="/billing/new" className="btn btn-primary btn-sm">
              <PlusCircle size={15} /> Create Bill
            </Link>
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
                <th>Payment Status</th>
                <th>Sale Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv._id}>
                  <td>
                    <strong>{inv.invoiceNumber}</strong>
                  </td>
                  <td>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                  <td>
                    <div>{inv.customerSnapshot?.name || "Walk-in Customer"}</div>
                    {inv.customerSnapshot?.phone && (
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {inv.customerSnapshot.phone}
                      </div>
                    )}
                  </td>
                  <td><strong>{currencySymbol}{Number(inv.grandTotal).toFixed(2)}</strong></td>
                  <td style={{ color: "#16a34a" }}>
                    {currencySymbol}{Number(inv.amountPaid).toFixed(2)}
                  </td>
                  <td>
                    <strong style={{ color: inv.balanceDue > 0 ? "#dc2626" : "#475569" }}>
                      {currencySymbol}{Number(inv.balanceDue).toFixed(2)}
                    </strong>
                  </td>
                  <td>
                    {inv.paymentStatus === "PAID" && <span className="badge badge-paid">PAID</span>}
                    {inv.paymentStatus === "PARTIALLY_PAID" && (
                      <span className="badge badge-partial">PARTIAL</span>
                    )}
                    {inv.paymentStatus === "UNPAID" && (
                      <span className="badge badge-unpaid">UNPAID</span>
                    )}
                  </td>
                  <td>
                    {inv.status === "COMPLETED" && (
                      <span className="badge" style={{ backgroundColor: "#eff6ff", color: "#1d4ed8" }}>
                        Active
                      </span>
                    )}
                    {inv.status === "CANCELLED" && (
                      <span className="badge badge-cancelled">Cancelled</span>
                    )}
                    {inv.status === "DRAFT" && (
                      <span className="badge badge-draft">Draft</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "6px" }}>
                      <button
                        className={styles.actionIconBtn}
                        onClick={() => handleOpenViewModal(inv)}
                        title="View / Print Invoice"
                      >
                        <Eye size={15} />
                      </button>

                      {inv.status !== "CANCELLED" && inv.balanceDue > 0 && (
                        <button
                          className={`${styles.actionIconBtn} ${styles.payBtn}`}
                          onClick={() => handleOpenPaymentModal(inv)}
                          title="Record Payment"
                        >
                          <CreditCard size={15} />
                        </button>
                      )}

                      {inv.status !== "CANCELLED" && (
                        <button
                          className={`${styles.actionIconBtn} ${styles.cancelBtn}`}
                          onClick={() => setCancelDialog({ isOpen: true, invoice: inv })}
                          title="Cancel Invoice"
                        >
                          <Ban size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* View & Print Modal */}
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

      {/* Record Payment Modal */}
      <Modal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false, invoice: null })}
        title={`Record Payment for ${paymentModal.invoice?.invoiceNumber || ""}`}
        size="md"
        footer={
          <>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPaymentModal({ isOpen: false, invoice: null })}
              disabled={paySubmitting}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleRecordPayment}
              disabled={paySubmitting}
            >
              {paySubmitting ? "Processing..." : "Save Payment"}
            </button>
          </>
        }
      >
        <form onSubmit={handleRecordPayment}>
          <div style={{ marginBottom: "16px", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Total Invoice Amount:</span>
              <strong>{currencySymbol}{Number(paymentModal.invoice?.grandTotal || 0).toFixed(2)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Already Paid:</span>
              <span style={{ color: "#16a34a", fontWeight: 600 }}>
                {currencySymbol}{Number(paymentModal.invoice?.amountPaid || 0).toFixed(2)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.85rem", color: "#dc2626", fontWeight: 600 }}>Remaining Balance:</span>
              <strong style={{ color: "#dc2626" }}>
                {currencySymbol}{Number(paymentModal.invoice?.balanceDue || 0).toFixed(2)}
              </strong>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Payment Amount ({currencySymbol}) <span className="required">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={paymentModal.invoice?.balanceDue}
              className="form-input"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Mode</label>
            <select
              className="form-select"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Credit / Debit Card</option>
              <option value="BANK_TRANSFER">Bank Transfer / IMPS / NEFT</option>
              <option value="CHEQUE">Cheque</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Transaction Reference #</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. UPI Ref, Card approval code"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Customer paid remainder via GPay"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Cancel Confirmation Dialog */}
      <Modal
        isOpen={cancelDialog.isOpen}
        onClose={() => setCancelDialog({ isOpen: false, invoice: null })}
        title={`Cancel Invoice ${cancelDialog.invoice?.invoiceNumber || ""}`}
        size="md"
        footer={
          <>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setCancelDialog({ isOpen: false, invoice: null })}
              disabled={cancelLoading}
            >
              Keep Invoice
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleCancelInvoice}
              disabled={cancelLoading}
            >
              {cancelLoading ? "Cancelling..." : "Confirm Cancellation"}
            </button>
          </>
        }
      >
        <p style={{ color: "#334155", fontSize: "0.9rem", marginBottom: "14px", lineHeight: 1.5 }}>
          Are you sure you want to cancel invoice <strong>{cancelDialog.invoice?.invoiceNumber}</strong>?
          This will reverse customer balance totals and mark the invoice cancelled in your financial records.
        </p>

        <div className="form-group">
          <label className="form-label">Cancellation Reason</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Order returned by customer, entry mistake..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};

export default InvoiceHistory;
