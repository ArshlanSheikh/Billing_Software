import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit2, Trash2, Eye, Users, Phone, Mail, FileText } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Modal from "../../components/common/Modal/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";
import Loader from "../../components/common/Loader/Loader";
import styles from "./CustomersPage.module.css";

const initialCustomerForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  gstin: "",
  notes: "",
};

const CustomersPage = () => {
  const { business } = useAuth();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add / Edit Modal state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState(initialCustomerForm);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // History Modal state
  const [historyModal, setHistoryModal] = useState({ isOpen: false, customer: null, invoices: [], loading: false });

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, customerId: null, customerName: "" });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);

      const res = await api.get(`/customers?${queryParams.toString()}`);
      if (res.success) {
        setCustomers(res.data.customers || []);
      }
    } catch (err) {
      console.error("Fetch customers failed:", err);
      showToast("Failed to load customers", "error");
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormData(initialCustomerForm);
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      gstin: customer.gstin || "",
      notes: customer.notes || "",
    });
    setIsCustomerModalOpen(true);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Please enter customer name", "warning");
      return;
    }

    try {
      setFormSubmitting(true);
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer._id}`, formData);
        showToast("Customer updated successfully", "success");
      } else {
        await api.post("/customers", formData);
        showToast("Customer added successfully", "success");
      }

      setIsCustomerModalOpen(false);
      fetchCustomers();
    } catch (err) {
      console.error("Save customer error:", err);
      showToast(err.message || "Failed to save customer", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenHistoryModal = async (customer) => {
    setHistoryModal({ isOpen: true, customer, invoices: [], loading: true });
    try {
      const res = await api.get(`/invoices?customerId=${customer._id}`);
      if (res.success) {
        setHistoryModal((prev) => ({ ...prev, invoices: res.data.invoices || [], loading: false }));
      }
    } catch (err) {
      console.error("Fetch customer invoices error:", err);
      showToast("Failed to load customer invoice history", "error");
      setHistoryModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);
      await api.delete(`/customers/${deleteDialog.customerId}`);
      showToast("Customer deleted successfully", "success");
      setDeleteDialog({ isOpen: false, customerId: null, customerName: "" });
      fetchCustomers();
    } catch (err) {
      console.error("Delete customer error:", err);
      showToast(err.message || "Failed to delete customer", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const currencySymbol = business?.currency?.symbol || "₹";

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Customer Directory</h1>
          <p className={styles.subtitle}>Maintain your customer database, contact details, and account balances</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={16} />
          <span>Add Customer</span>
        </button>
      </div>

      <div className={styles.filterCard}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={`form-input ${styles.searchInput}`}
            placeholder="Search by customer name, phone, email, or GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <Loader message="Loading customers..." />
        ) : customers.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={48} color="#94a3b8" />
            <h3>No customers found</h3>
            <p>Add regular customers to track ledger history or bill as walk-in customers.</p>
            <button className="btn btn-primary btn-sm" onClick={handleOpenAddModal}>
              <Plus size={15} /> Add First Customer
            </button>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Email / GSTIN</th>
                <th>Total Billed</th>
                <th>Total Paid</th>
                <th>Outstanding Balance</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c._id}>
                  <td>
                    <strong>{c.name}</strong>
                    {c.address && (
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{c.address}</div>
                    )}
                  </td>
                  <td>{c.phone || "—"}</td>
                  <td>
                    {c.email && <div>{c.email}</div>}
                    {c.gstin && (
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>GSTIN: {c.gstin}</div>
                    )}
                    {!c.email && !c.gstin && "—"}
                  </td>
                  <td>{currencySymbol}{Number(c.totalBilled || 0).toFixed(2)}</td>
                  <td style={{ color: "#16a34a" }}>{currencySymbol}{Number(c.totalPaid || 0).toFixed(2)}</td>
                  <td>
                    <strong style={{ color: (c.outstandingBalance || 0) > 0 ? "#dc2626" : "#475569" }}>
                      {currencySymbol}{Number(c.outstandingBalance || 0).toFixed(2)}
                    </strong>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "6px" }}>
                      <button
                        className={styles.actionIconBtn}
                        onClick={() => handleOpenHistoryModal(c)}
                        title="View Invoices"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        className={styles.actionIconBtn}
                        onClick={() => handleOpenEditModal(c)}
                        title="Edit Customer"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className={`${styles.actionIconBtn} ${styles.deleteBtn}`}
                        onClick={() =>
                          setDeleteDialog({ isOpen: true, customerId: c._id, customerName: c.name })
                        }
                        title="Delete Customer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title={editingCustomer ? "Edit Customer Details" : "Add New Customer"}
        size="md"
        footer={
          <>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsCustomerModalOpen(false)}
              disabled={formSubmitting}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSaveCustomer}
              disabled={formSubmitting}
            >
              {formSubmitting ? "Saving..." : editingCustomer ? "Update Customer" : "Add Customer"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveCustomer}>
          <div className="form-group">
            <label className="form-label">
              Customer Full Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g. Ramesh Verma"
              value={formData.name}
              onChange={handleFormChange}
              required
            />
          </div>

          <div className={styles.formGrid2}>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="customer@domain.com"
                value={formData.email}
                onChange={handleFormChange}
              />
            </div>
          </div>

          <div className={styles.formGrid2}>
            <div className="form-group">
              <label className="form-label">GSTIN / Tax ID (Optional)</label>
              <input
                type="text"
                name="gstin"
                className="form-input"
                placeholder="22AAAAA0000A1Z5"
                value={formData.gstin}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <input
                type="text"
                name="notes"
                className="form-input"
                placeholder="e.g. VIP client, preferred terms"
                value={formData.notes}
                onChange={handleFormChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Billing Address</label>
            <textarea
              name="address"
              className="form-textarea"
              rows="2"
              placeholder="Full street address, city, state..."
              value={formData.address}
              onChange={handleFormChange}
            />
          </div>
        </form>
      </Modal>

      {/* Customer Invoice History Modal */}
      <Modal
        isOpen={historyModal.isOpen}
        onClose={() => setHistoryModal({ isOpen: false, customer: null, invoices: [], loading: false })}
        title={`Invoice History — ${historyModal.customer?.name || "Customer"}`}
        size="lg"
      >
        <div style={{ marginBottom: "16px", display: "flex", gap: "24px", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Phone</div>
            <div style={{ fontWeight: 600 }}>{historyModal.customer?.phone || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Total Billed</div>
            <div style={{ fontWeight: 600 }}>{currencySymbol}{Number(historyModal.customer?.totalBilled || 0).toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Total Paid</div>
            <div style={{ fontWeight: 600, color: "#16a34a" }}>{currencySymbol}{Number(historyModal.customer?.totalPaid || 0).toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Outstanding Balance</div>
            <div style={{ fontWeight: 700, color: (historyModal.customer?.outstandingBalance || 0) > 0 ? "#dc2626" : "#475569" }}>
              {currencySymbol}{Number(historyModal.customer?.outstandingBalance || 0).toFixed(2)}
            </div>
          </div>
        </div>

        {historyModal.loading ? (
          <Loader message="Loading invoices..." />
        ) : historyModal.invoices.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>
            <FileText size={36} style={{ marginBottom: "8px" }} />
            <p>No invoices generated for this customer yet.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Grand Total</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {historyModal.invoices.map((inv) => (
                <tr key={inv._id}>
                  <td><strong>{inv.invoiceNumber}</strong></td>
                  <td>{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                  <td>{currencySymbol}{Number(inv.grandTotal).toFixed(2)}</td>
                  <td>{currencySymbol}{Number(inv.amountPaid).toFixed(2)}</td>
                  <td style={{ color: inv.balanceDue > 0 ? "#dc2626" : "#16a34a" }}>
                    {currencySymbol}{Number(inv.balanceDue).toFixed(2)}
                  </td>
                  <td>
                    {inv.paymentStatus === "PAID" && <span className="badge badge-paid">PAID</span>}
                    {inv.paymentStatus === "PARTIALLY_PAID" && <span className="badge badge-partial">PARTIAL</span>}
                    {inv.paymentStatus === "UNPAID" && <span className="badge badge-unpaid">UNPAID</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, customerId: null, customerName: "" })}
        onConfirm={handleConfirmDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteDialog.customerName}"? Existing invoices will remain preserved.`}
        confirmText="Delete"
        loading={deleteLoading}
      />
    </div>
  );
};

export default CustomersPage;
