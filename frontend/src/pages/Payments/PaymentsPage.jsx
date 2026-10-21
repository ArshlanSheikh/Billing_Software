import React, { useState, useEffect, useCallback } from "react";
import { Plus, CreditCard, Banknote, QrCode, Building, Receipt, FileText } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Modal from "../../components/common/Modal/Modal";
import Loader from "../../components/common/Loader/Loader";
import styles from "./PaymentsPage.module.css";

const PaymentsPage = () => {
  const { business } = useAuth();
  const { showToast } = useToast();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Record Payment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [refNum, setRefNum] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (paymentMethod !== "ALL") queryParams.append("paymentMethod", paymentMethod);
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);

      const res = await api.get(`/payments?${queryParams.toString()}`);
      if (res.success) {
        setPayments(res.data.payments || []);
      }
    } catch (err) {
      console.error("Fetch payments error:", err);
      showToast("Failed to load payments", "error");
    } finally {
      setLoading(false);
    }
  }, [paymentMethod, startDate, endDate, showToast]);

  const fetchUnpaidInvoices = async () => {
    try {
      const res = await api.get("/invoices?paymentStatus=UNPAID");
      const resPart = await api.get("/invoices?paymentStatus=PARTIALLY_PAID");
      const combined = [...(res.data?.invoices || []), ...(resPart.data?.invoices || [])];
      setUnpaidInvoices(combined);
      if (combined.length > 0) {
        setSelectedInvoiceId(combined[0]._id);
        setAmount(combined[0].balanceDue);
      }
    } catch (err) {
      console.error("Fetch unpaid invoices error:", err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayments();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchPayments]);

  const handleOpenRecordModal = () => {
    fetchUnpaidInvoices();
    setIsModalOpen(true);
  };

  const handleInvoiceSelect = (invId) => {
    setSelectedInvoiceId(invId);
    const target = unpaidInvoices.find((i) => i._id === invId);
    if (target) {
      setAmount(target.balanceDue);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const num = Number(amount);
    if (!selectedInvoiceId || !num || num <= 0) {
      showToast("Please select an invoice and enter a valid amount", "warning");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/payments", {
        invoiceId: selectedInvoiceId,
        amount: num,
        paymentMethod: method,
        referenceNumber: refNum,
        notes,
      });

      if (res.success) {
        showToast("Payment recorded successfully", "success");
        setIsModalOpen(false);
        fetchPayments();
      }
    } catch (err) {
      console.error("Record payment error:", err);
      showToast(err.message || "Failed to record payment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const currencySymbol = business?.currency?.symbol || "₹";

  const getMethodIcon = (m) => {
    if (m === "CASH") return <Banknote size={15} />;
    if (m === "UPI") return <QrCode size={15} />;
    if (m === "CARD") return <CreditCard size={15} />;
    if (m === "BANK_TRANSFER") return <Building size={15} />;
    return <Receipt size={15} />;
  };

  const selectedInvObj = unpaidInvoices.find((i) => i._id === selectedInvoiceId);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Payment Collection Ledger</h1>
          <p className={styles.subtitle}>View historical receipts and record settlements against credit bills</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenRecordModal}>
          <Plus size={16} />
          <span>Record Payment</span>
        </button>
      </div>

      <div className={styles.filterCard}>
        <div className={styles.filterGroup}>
          <label className="form-label" style={{ margin: 0 }}>Payment Mode:</label>
          <select
            className="form-select"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="ALL">All Modes</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CHEQUE">Cheque</option>
            <option value="OTHER">Other</option>
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

      <div className={styles.tableCard}>
        {loading ? (
          <Loader message="Loading payments..." />
        ) : payments.length === 0 ? (
          <div className={styles.emptyState}>
            <CreditCard size={48} color="#94a3b8" />
            <h3>No payment transactions found</h3>
            <p>Payments collected at checkout or recorded against credit bills will appear here.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Payment Mode</th>
                <th>Amount Collected</th>
                <th>Reference #</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td>{new Date(p.paymentDate).toLocaleString()}</td>
                  <td>
                    <strong>{p.invoiceId?.invoiceNumber || "—"}</strong>
                  </td>
                  <td>{p.customerId?.name || "Walk-in Customer"}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: "#f1f5f9",
                        color: "#334155",
                        gap: "6px",
                      }}
                    >
                      {getMethodIcon(p.paymentMethod)}
                      {p.paymentMethod}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: "#16a34a" }}>
                      {currencySymbol}{Number(p.amount).toFixed(2)}
                    </strong>
                  </td>
                  <td>{p.referenceNumber || "—"}</td>
                  <td>{p.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Invoice Settlement Payment"
        size="md"
        footer={
          <>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleRecordPayment}
              disabled={submitting || unpaidInvoices.length === 0}
            >
              {submitting ? "Processing..." : "Submit Payment"}
            </button>
          </>
        }
      >
        {unpaidInvoices.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
            <FileText size={36} color="#16a34a" style={{ marginBottom: "8px" }} />
            <p style={{ fontWeight: 600, color: "#0f172a" }}>All invoices are fully paid!</p>
            <span style={{ fontSize: "0.85rem" }}>There are currently no unpaid or partial invoices awaiting settlement.</span>
          </div>
        ) : (
          <form onSubmit={handleRecordPayment}>
            <div className="form-group">
              <label className="form-label">
                Select Invoice to Settle <span className="required">*</span>
              </label>
              <select
                className="form-select"
                value={selectedInvoiceId}
                onChange={(e) => handleInvoiceSelect(e.target.value)}
                required
              >
                {unpaidInvoices.map((inv) => (
                  <option key={inv._id} value={inv._id}>
                    {inv.invoiceNumber} — {inv.customerSnapshot?.name || "Walk-in"} (Due: {currencySymbol}{inv.balanceDue})
                  </option>
                ))}
              </select>
            </div>

            {selectedInvObj && (
              <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                  <span style={{ color: "#64748b" }}>Invoice Grand Total:</span>
                  <strong>{currencySymbol}{Number(selectedInvObj.grandTotal).toFixed(2)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginTop: "4px" }}>
                  <span style={{ color: "#64748b" }}>Already Paid:</span>
                  <span style={{ color: "#16a34a" }}>{currencySymbol}{Number(selectedInvObj.amountPaid).toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", fontWeight: 700, marginTop: "4px" }}>
                  <span style={{ color: "#dc2626" }}>Current Balance Due:</span>
                  <span style={{ color: "#dc2626" }}>{currencySymbol}{Number(selectedInvObj.balanceDue).toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Payment Amount ({currencySymbol}) <span className="required">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={selectedInvObj?.balanceDue}
                className="form-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Mode</label>
              <select className="form-select" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="BANK_TRANSFER">Bank Transfer / IMPS</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Reference / Transaction #</label>
              <input
                type="text"
                className="form-input"
                placeholder="Optional ref ID..."
                value={refNum}
                onChange={(e) => setRefNum(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <input
                type="text"
                className="form-input"
                placeholder="Optional payment notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default PaymentsPage;
