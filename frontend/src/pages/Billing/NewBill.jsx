import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Plus,
  Trash2,
  Receipt,
  UserPlus,
  CreditCard,
  Banknote,
  QrCode,
  Building,
  CheckCircle2,
  Printer,
  RotateCcw,
  PlusCircle,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Modal from "../../components/common/Modal/Modal";
import PrintableInvoice from "../../components/invoices/PrintableInvoice";
import styles from "./NewBill.module.css";

const round = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

const NewBill = () => {
  const { business } = useAuth();
  const { showToast } = useToast();

  // Invoice Metadata
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customers, setCustomers] = useState([]);
  const [notes, setNotes] = useState("");

  // Product Search & Items
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [items, setItems] = useState([]);

  // Discounts
  const [invoiceDiscountType, setInvoiceDiscountType] = useState("FIXED");
  const [invoiceDiscountValue, setInvoiceDiscountValue] = useState("");

  // Payments
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [amountReceived, setAmountReceived] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");

  // Quick Customer Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "", address: "", gstin: "" });
  const [customerSaving, setCustomerSaving] = useState(false);

  // Post Sale Modal
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const searchRef = useRef(null);

  // Fetch Next Invoice Number
  const fetchNextInvoiceNumber = useCallback(async () => {
    try {
      const res = await api.get("/invoices/next-number");
      if (res.success && res.data?.nextInvoiceNumber) {
        setInvoiceNumber(res.data.nextInvoiceNumber);
      }
    } catch (err) {
      console.error("Failed to get next invoice number:", err);
    }
  }, []);

  // Fetch Customers
  const fetchCustomers = useCallback(async () => {
    try {
      const res = await api.get("/customers");
      if (res.success) {
        setCustomers(res.data.customers || []);
      }
    } catch (err) {
      console.error("Failed to load customers:", err);
    }
  }, []);

  useEffect(() => {
    fetchNextInvoiceNumber();
    fetchCustomers();
  }, [fetchNextInvoiceNumber, fetchCustomers]);

  // Product Live Search
  useEffect(() => {
    if (!productSearch.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await api.get(`/products/search?query=${encodeURIComponent(productSearch.trim())}`);
        if (res.success) {
          setSearchResults(res.data.products || []);
        }
      } catch (err) {
        console.error("Search products error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [productSearch]);

  // Add Product to Table
  const handleSelectProduct = (product) => {
    const existingIndex = items.findIndex((i) => i.productId === product._id);

    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: product._id,
          name: product.name,
          sku: product.sku || "",
          unit: product.unit || "piece",
          quantity: 1,
          unitPrice: product.sellingPrice,
          discountRate: 0,
          taxRate: product.taxRate || 0,
        },
      ]);
    }

    setProductSearch("");
    setSearchResults([]);
  };

  // Add Custom Line Item
  const handleAddCustomItem = () => {
    setItems([
      ...items,
      {
        productId: null,
        name: "Custom Service / Item",
        sku: "",
        unit: "piece",
        quantity: 1,
        unitPrice: 0,
        discountRate: 0,
        taxRate: business?.taxSettings?.defaultTaxRate || 0,
      },
    ]);
  };

  // Update Item in Table
  const handleUpdateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  // Remove Item
  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Mathematical Calculations
  let subtotal = 0;
  let itemDiscountTotal = 0;
  let taxTotal = 0;

  const calculatedItems = items.map((item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const discRate = Number(item.discountRate) || 0;
    const tRate = Number(item.taxRate) || 0;

    const baseAmount = round(qty * price);
    const discAmount = round(baseAmount * (discRate / 100));
    const taxableLine = Math.max(0, round(baseAmount - discAmount));
    const itemTax = round(taxableLine * (tRate / 100));
    const lineTotal = round(taxableLine + itemTax);

    subtotal = round(subtotal + baseAmount);
    itemDiscountTotal = round(itemDiscountTotal + discAmount);
    taxTotal = round(taxTotal + itemTax);

    return { ...item, lineTotal };
  });

  const netAfterItemDiscount = Math.max(0, round(subtotal - itemDiscountTotal));
  let invDiscountAmount = 0;
  const rawInvDiscount = Number(invoiceDiscountValue) || 0;

  if (invoiceDiscountType === "PERCENTAGE") {
    invDiscountAmount = round(netAfterItemDiscount * (rawInvDiscount / 100));
  } else {
    invDiscountAmount = round(Math.min(rawInvDiscount, netAfterItemDiscount));
  }

  const taxableAmount = Math.max(0, round(netAfterItemDiscount - invDiscountAmount));
  const grandTotal = round(taxableAmount + taxTotal);

  const receivedNum = Number(amountReceived) || 0;
  const balanceDue = Math.max(0, round(grandTotal - receivedNum));
  const changeToReturn = receivedNum > grandTotal ? round(receivedNum - grandTotal) : 0;

  let paymentStatus = "UNPAID";
  if (receivedNum >= grandTotal && grandTotal > 0) paymentStatus = "PAID";
  else if (receivedNum > 0) paymentStatus = "PARTIALLY_PAID";

  // Quick Add Customer Handler
  const handleQuickAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name.trim()) return;

    try {
      setCustomerSaving(true);
      const res = await api.post("/customers", newCustomer);
      if (res.success && res.data?.customer) {
        showToast("Customer added", "success");
        setCustomers((prev) => [res.data.customer, ...prev]);
        setSelectedCustomerId(res.data.customer._id);
        setIsCustomerModalOpen(false);
        setNewCustomer({ name: "", phone: "", email: "", address: "", gstin: "" });
      }
    } catch (err) {
      console.error("Quick add customer error:", err);
      showToast(err.message || "Failed to add customer", "error");
    } finally {
      setCustomerSaving(false);
    }
  };

  // Submit Invoice / Complete Sale
  const handleCompleteSale = async (shouldPrint = false) => {
    if (items.length === 0) {
      showToast("Please add at least one product to the bill", "warning");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        invoiceNumber,
        invoiceDate,
        dueDate: dueDate || null,
        customerId: selectedCustomerId || null,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          sku: i.sku,
          unit: i.unit,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          discountRate: Number(i.discountRate) || 0,
          taxRate: Number(i.taxRate) || 0,
        })),
        invoiceDiscount: {
          type: invoiceDiscountType,
          value: Number(invoiceDiscountValue) || 0,
        },
        paymentMethod,
        amountReceived: receivedNum,
        referenceNumber,
        notes,
      };

      const res = await api.post("/invoices", payload);
      if (res.success && res.data?.invoice) {
        showToast("Sale completed successfully!", "success");
        setCompletedInvoice(res.data.invoice);
        setIsSuccessModalOpen(true);

        if (shouldPrint) {
          setTimeout(() => {
            window.print();
          }, 300);
        }
      }
    } catch (err) {
      console.error("Complete sale error:", err);
      showToast(err.message || "Failed to complete sale", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartNewBill = () => {
    setItems([]);
    setSelectedCustomerId("");
    setDueDate("");
    setAmountReceived("");
    setReferenceNumber("");
    setNotes("");
    setInvoiceDiscountValue("");
    setIsSuccessModalOpen(false);
    setCompletedInvoice(null);
    fetchNextInvoiceNumber();
  };

  const currencySymbol = business?.currency?.symbol || "₹";

  return (
    <div>
      <div className={styles.billingLayout}>
        {/* Left Column: Top Bar, Product Search & Items Table */}
        <div className={styles.leftCol}>
          {/* Top Bar: Invoice metadata & Customer selection */}
          <div className={styles.card}>
            <div className={styles.topBarGrid}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Invoice #</label>
                <input
                  type="text"
                  className="form-input"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  style={{ fontWeight: 700, fontFamily: "var(--font-mono)" }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Customer</label>
                <select
                  className="form-select"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">Walk-in Customer (General)</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.phone ? `(${c.phone})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsCustomerModalOpen(true)}
                title="Quick Add Customer"
                style={{ height: "38px" }}
              >
                <UserPlus size={16} />
              </button>
            </div>
          </div>

          {/* Product Search & Custom Item */}
          <div className={styles.card}>
            <div className={styles.searchSection}>
              <div className={styles.searchWrapper} ref={searchRef}>
                <Search size={18} className={styles.searchIcon} />
                <input
                  type="text"
                  className={`form-input ${styles.searchInput}`}
                  placeholder="Scan barcode or type product name / SKU to add..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  autoFocus
                />

                {/* Autocomplete Dropdown */}
                {searchResults.length > 0 && (
                  <div className={styles.searchResultsDropdown}>
                    {searchResults.map((p) => (
                      <div
                        key={p._id}
                        className={styles.searchResultItem}
                        onClick={() => handleSelectProduct(p)}
                      >
                        <div>
                          <strong>{p.name}</strong>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                            SKU: {p.sku || "N/A"} | Category: {p.category} | Tax: {p.taxRate}%
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <strong style={{ color: "#2563eb" }}>
                            {currencySymbol}{Number(p.sellingPrice).toFixed(2)}
                          </strong>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>per {p.unit}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddCustomItem}
                title="Add Custom Line Item"
              >
                <PlusCircle size={16} />
                <span>Custom Item</span>
              </button>
            </div>
          </div>

          {/* Invoice Items Table */}
          <div className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
            <div className={styles.itemTableContainer}>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th style={{ width: "36px" }}>#</th>
                    <th>Product & SKU</th>
                    <th style={{ width: "130px" }}>Qty & Unit</th>
                    <th style={{ width: "110px", textAlign: "right" }}>Price ({currencySymbol})</th>
                    <th style={{ width: "90px", textAlign: "right" }}>Disc %</th>
                    <th style={{ width: "90px", textAlign: "right" }}>Tax %</th>
                    <th style={{ width: "120px", textAlign: "right" }}>Total ({currencySymbol})</th>
                    <th style={{ width: "40px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedItems.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center", padding: "40px 16px", color: "#94a3b8" }}>
                        <Receipt size={36} style={{ marginBottom: "8px" }} />
                        <p style={{ margin: 0, fontWeight: 500 }}>No items in the bill yet.</p>
                        <span style={{ fontSize: "0.8rem" }}>Search products above or click "Custom Item" to start billing.</span>
                      </td>
                    </tr>
                  ) : (
                    calculatedItems.map((item, index) => (
                      <tr key={index}>
                        <td style={{ color: "#64748b", fontSize: "0.8rem", textAlign: "center" }}>
                          {index + 1}
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: "4px 8px", fontSize: "0.85rem", fontWeight: 600 }}
                            value={item.name}
                            onChange={(e) => handleUpdateItem(index, "name", e.target.value)}
                          />
                          {item.sku && (
                            <span style={{ fontSize: "0.725rem", color: "#64748b", marginLeft: "4px" }}>
                              SKU: {item.sku}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className={styles.qtyControl}>
                            <button
                              type="button"
                              className={styles.qtyBtn}
                              onClick={() =>
                                handleUpdateItem(index, "quantity", Math.max(1, Number(item.quantity) - 1))
                              }
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0.001"
                              step="any"
                              className={styles.qtyInput}
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(index, "quantity", e.target.value)}
                            />
                            <button
                              type="button"
                              className={styles.qtyBtn}
                              onClick={() => handleUpdateItem(index, "quantity", Number(item.quantity) + 1)}
                            >
                              +
                            </button>
                            <span style={{ fontSize: "0.75rem", color: "#64748b", padding: "0 6px" }}>
                              {item.unit}
                            </span>
                          </div>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className={styles.tableInput}
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItem(index, "unitPrice", e.target.value)}
                          />
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            className={styles.tableInput}
                            style={{ width: "70px" }}
                            value={item.discountRate}
                            onChange={(e) => handleUpdateItem(index, "discountRate", e.target.value)}
                          />
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            className={styles.tableInput}
                            style={{ width: "70px" }}
                            value={item.taxRate}
                            onChange={(e) => handleUpdateItem(index, "taxRate", e.target.value)}
                          />
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          {currencySymbol}{item.lineTotal.toFixed(2)}
                        </td>
                        <td>
                          <button
                            type="button"
                            className={styles.removeLineBtn}
                            onClick={() => handleRemoveItem(index)}
                            title="Remove line item"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes Input */}
          <div className={styles.card}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Invoice Notes / Special Instructions</label>
              <input
                type="text"
                className="form-input"
                placeholder="Optional notes printed on invoice..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Calculations & Payment Settlement */}
        <div className={styles.rightCol}>
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryTitle}>Bill Summary</h3>

            <div className={styles.calcRow}>
              <span>Items Subtotal:</span>
              <span>{currencySymbol}{subtotal.toFixed(2)}</span>
            </div>

            {itemDiscountTotal > 0 && (
              <div className={styles.calcRow} style={{ color: "#16a34a" }}>
                <span>Item Discounts:</span>
                <span>-{currencySymbol}{itemDiscountTotal.toFixed(2)}</span>
              </div>
            )}

            {/* Special Invoice Discount */}
            <div style={{ margin: "10px 0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.825rem", color: "#475569", fontWeight: 600 }}>Invoice Discount:</span>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${invoiceDiscountType === "FIXED" ? "btn-primary" : "btn-secondary"}`}
                    style={{ padding: "2px 8px", fontSize: "0.725rem" }}
                    onClick={() => setInvoiceDiscountType("FIXED")}
                  >
                    {currencySymbol} Flat
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${invoiceDiscountType === "PERCENTAGE" ? "btn-primary" : "btn-secondary"}`}
                    style={{ padding: "2px 8px", fontSize: "0.725rem" }}
                    onClick={() => setInvoiceDiscountType("PERCENTAGE")}
                  >
                    %
                  </button>
                </div>
              </div>
              <input
                type="number"
                min="0"
                step="any"
                className="form-input"
                placeholder={invoiceDiscountType === "FIXED" ? "0.00" : "0%"}
                value={invoiceDiscountValue}
                onChange={(e) => setInvoiceDiscountValue(e.target.value)}
              />
            </div>

            <div className={styles.calcRow}>
              <span>GST / Tax Total:</span>
              <span>+{currencySymbol}{taxTotal.toFixed(2)}</span>
            </div>

            {/* Grand Total Box */}
            <div className={styles.grandTotalBox}>
              <span className={styles.grandTotalLabel}>Grand Total</span>
              <span className={styles.grandTotalAmount}>
                {currencySymbol}{grandTotal.toFixed(2)}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: "12px" }}>
              <label className="form-label">Payment Mode</label>
              <div className={styles.paymentMethodsGrid}>
                {[
                  { id: "CASH", label: "Cash", icon: Banknote },
                  { id: "UPI", label: "UPI", icon: QrCode },
                  { id: "CARD", label: "Card", icon: CreditCard },
                  { id: "BANK_TRANSFER", label: "NetBanking", icon: Building },
                  { id: "OTHER", label: "Other", icon: Receipt },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={`${styles.payMethodBtn} ${
                        paymentMethod === m.id ? styles.payMethodActive : ""
                      }`}
                      onClick={() => setPaymentMethod(m.id)}
                    >
                      <Icon size={16} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount Received & Quick Buttons */}
            <div className="form-group" style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className="form-label">Amount Received ({currencySymbol})</label>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "2px 6px", fontSize: "0.7rem" }}
                    onClick={() => setAmountReceived(grandTotal)}
                  >
                    Full
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "2px 6px", fontSize: "0.7rem" }}
                    onClick={() => setAmountReceived(Math.ceil(grandTotal))}
                  >
                    Round
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "2px 6px", fontSize: "0.7rem" }}
                    onClick={() => setAmountReceived("0")}
                  >
                    Credit (₹0)
                  </button>
                </div>
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-input"
                placeholder="0.00"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
              />
            </div>

            {/* Reference Number */}
            {paymentMethod !== "CASH" && (
              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label className="form-label">Transaction / Ref Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="UPI Ref ID, Card Auth Code..."
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>
            )}

            {/* Balance Due or Return Change */}
            {changeToReturn > 0 ? (
              <div className={`${styles.balanceRow} ${styles.balancePaid}`}>
                <span>Change to Return:</span>
                <span>{currencySymbol}{changeToReturn.toFixed(2)}</span>
              </div>
            ) : (
              <div
                className={`${styles.balanceRow} ${
                  balanceDue > 0 ? styles.balanceDue : styles.balancePaid
                }`}
              >
                <span>{balanceDue > 0 ? "Balance Outstanding:" : "Payment Status:"}</span>
                <span>
                  {balanceDue > 0 ? `${currencySymbol}${balanceDue.toFixed(2)}` : "Fully Paid"}
                </span>
              </div>
            )}

            {/* Main Action Buttons */}
            <div className={styles.actionBtnGroup}>
              <button
                type="button"
                className={styles.completeSaleBtn}
                disabled={submitting || items.length === 0}
                onClick={() => handleCompleteSale(false)}
              >
                <CheckCircle2 size={18} />
                <span>{submitting ? "Processing..." : "Complete Sale"}</span>
              </button>

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: "100%", padding: "10px" }}
                disabled={submitting || items.length === 0}
                onClick={() => handleCompleteSale(true)}
              >
                <Printer size={16} />
                <span>Complete Sale & Print</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: "100%", padding: "8px" }}
                onClick={handleStartNewBill}
                disabled={submitting}
              >
                <RotateCcw size={15} />
                <span>Reset Bill</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Quick Add Customer"
        size="md"
        footer={
          <>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsCustomerModalOpen(false)}
              disabled={customerSaving}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleQuickAddCustomer}
              disabled={customerSaving}
            >
              {customerSaving ? "Saving..." : "Add & Select"}
            </button>
          </>
        }
      >
        <form onSubmit={handleQuickAddCustomer}>
          <div className="form-group">
            <label className="form-label">
              Customer Name <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Anand Sharma"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-input"
              placeholder="e.g. 9876543210"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input
              type="text"
              className="form-input"
              placeholder="City, Area..."
              value={newCustomer.address}
              onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Post-Sale Success & Print Modal */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={handleStartNewBill}
        title="Sale Completed Successfully"
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
              <Printer size={16} /> Print Receipt
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleStartNewBill}>
              <PlusCircle size={16} /> Start New Bill
            </button>
          </>
        }
      >
        {completedInvoice && (
          <PrintableInvoice
            invoice={completedInvoice}
            business={business}
            onPrint={() => window.print()}
          />
        )}
      </Modal>
    </div>
  );
};

export default NewBill;
