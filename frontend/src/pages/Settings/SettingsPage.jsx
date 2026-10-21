import React, { useState, useEffect } from "react";
import { Save, Store, Receipt, Percent } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Loader from "../../components/common/Loader/Loader";
import styles from "./SettingsPage.module.css";

const SettingsPage = () => {
  const { business, updateBusiness } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "Retail",
    ownerName: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    currencyCode: "INR",
    currencySymbol: "₹",
    prefix: "INV-",
    startingNumber: 1,
    termsAndConditions: "",
    footerNote: "",
    defaultTaxRate: 18,
  });

  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name || "",
        type: business.type || "Retail",
        ownerName: business.ownerName || "",
        phone: business.phone || "",
        email: business.email || "",
        street: business.address?.street || "",
        city: business.address?.city || "",
        state: business.address?.state || "",
        pincode: business.address?.pincode || "",
        gstin: business.gstin || "",
        currencyCode: business.currency?.code || "INR",
        currencySymbol: business.currency?.symbol || "₹",
        prefix: business.invoiceSettings?.prefix || "INV-",
        startingNumber: business.invoiceSettings?.startingNumber || 1,
        termsAndConditions: business.invoiceSettings?.termsAndConditions || "",
        footerNote: business.invoiceSettings?.footerNote || "",
        defaultTaxRate: business.taxSettings?.defaultTaxRate ?? 18,
      });
    }
  }, [business]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.ownerName.trim()) {
      showToast("Store name and owner name are required", "warning");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        ownerName: formData.ownerName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
          country: "India",
        },
        gstin: formData.gstin.trim(),
        currency: {
          code: formData.currencyCode.trim(),
          symbol: formData.currencySymbol.trim(),
        },
        invoiceSettings: {
          prefix: formData.prefix.trim(),
          startingNumber: Number(formData.startingNumber) || 1,
          termsAndConditions: formData.termsAndConditions.trim(),
          footerNote: formData.footerNote.trim(),
        },
        taxSettings: {
          defaultTaxRate: Number(formData.defaultTaxRate) || 0,
          taxType: "GST",
        },
        isConfigured: true,
      };

      const res = await api.put("/business/settings", payload);
      if (res.success && res.data?.business) {
        updateBusiness(res.data.business);
        showToast("Business profile & settings saved successfully!", "success");
      }
    } catch (err) {
      console.error("Save settings error:", err);
      showToast(err.message || "Failed to update business settings", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Business Setup & Preferences</h1>
          <p className={styles.subtitle}>Configure store details, GSTIN, invoice prefixes, and default tax rates</p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings}>
        {/* Business Profile */}
        <div className={styles.card}>
          <div className={styles.sectionTitle}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Store size={18} color="#2563eb" />
              <span>Store & Contact Information</span>
            </div>
          </div>

          <div className={styles.formGrid2}>
            <div className="form-group">
              <label className="form-label">
                Business / Store Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Business Type</label>
              <select name="type" className="form-select" value={formData.type} onChange={handleChange}>
                <option value="Retail">Retail Store</option>
                <option value="Clothing">Clothing & Apparel</option>
                <option value="Grocery">Grocery & Kirana</option>
                <option value="Electronics">Electronics</option>
                <option value="Wholesale">Wholesaler</option>
                <option value="Services">Service Provider</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className={styles.formGrid3}>
            <div className="form-group">
              <label className="form-label">
                Owner / Manager Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="ownerName"
                className="form-input"
                value={formData.ownerName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Street Address</label>
            <input
              type="text"
              name="street"
              className="form-input"
              placeholder="Shop #, Street name, Landmark"
              value={formData.street}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGrid3}>
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                name="city"
                className="form-input"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">State</label>
              <input
                type="text"
                name="state"
                className="form-input"
                value={formData.state}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">PIN Code</label>
              <input
                type="text"
                name="pincode"
                className="form-input"
                value={formData.pincode}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* GST & Tax Settings */}
        <div className={styles.card} style={{ marginTop: "20px" }}>
          <div className={styles.sectionTitle}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Percent size={18} color="#2563eb" />
              <span>GST & Tax Configuration</span>
            </div>
          </div>

          <div className={styles.formGrid2}>
            <div className="form-group">
              <label className="form-label">GSTIN / Tax Identification Number</label>
              <input
                type="text"
                name="gstin"
                className="form-input"
                placeholder="e.g. 27ABCDE1234F1Z5"
                value={formData.gstin}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Default GST Tax Rate (%)</label>
              <select
                name="defaultTaxRate"
                className="form-select"
                value={formData.defaultTaxRate}
                onChange={handleChange}
              >
                <option value={0}>0% (Tax Exempt / Nil)</option>
                <option value={5}>5% GST</option>
                <option value={12}>12% GST</option>
                <option value={18}>18% GST (Standard)</option>
                <option value={28}>28% GST</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoice Formatting */}
        <div className={styles.card} style={{ marginTop: "20px" }}>
          <div className={styles.sectionTitle}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Receipt size={18} color="#2563eb" />
              <span>Invoice Numbering & Print Preferences</span>
            </div>
          </div>

          <div className={styles.formGrid3}>
            <div className="form-group">
              <label className="form-label">Invoice Prefix</label>
              <input
                type="text"
                name="prefix"
                className="form-input"
                value={formData.prefix}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Currency Code</label>
              <input
                type="text"
                name="currencyCode"
                className="form-input"
                value={formData.currencyCode}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Currency Symbol</label>
              <input
                type="text"
                name="currencySymbol"
                className="form-input"
                value={formData.currencySymbol}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Terms & Conditions (Printed on receipts)</label>
            <textarea
              name="termsAndConditions"
              rows="3"
              className="form-textarea"
              value={formData.termsAndConditions}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Invoice Footer Note</label>
            <input
              type="text"
              name="footerNote"
              className="form-input"
              value={formData.footerNote}
              onChange={handleChange}
            />
          </div>
        </div>

        <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            <Save size={18} />
            <span>{submitting ? "Saving Preferences..." : "Save Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
