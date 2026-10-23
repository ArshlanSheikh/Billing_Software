import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Package,
  Download,
  ShoppingBag,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Modal from "../../components/common/Modal/Modal";
import PrintableInvoice from "../../components/invoices/PrintableInvoice";
import { downloadInvoicePdf } from "../../utils/pdfGenerator";
import Loader from "../../components/common/Loader/Loader";
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

  // Product Catalog Panel (Left side)
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Quick Autocomplete Product Search & Cart Items
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
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const searchRef = useRef(null);
  const modalInvoiceRef = useRef(null);

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

  // Fetch All Active Products & Categories for Left Panel
  const fetchCatalogData = useCallback(async () => {
    try {
      setCatalogLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        api.get("/products"),
        api.get("/categories"),
      ]);

      if (productsRes.success) {
        const activeProds = (productsRes.data?.products || []).filter(
          (p) => p.isActive !== false
        );
        setAllProducts(activeProds);
      }
      if (categoriesRes.success) {
        setCategories(categoriesRes.data?.categories || []);
      }
    } catch (err) {
      console.error("Failed to load product catalog:", err);
      showToast("Failed to load product catalog", "error");
    } finally {
      setCatalogLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchNextInvoiceNumber();
    fetchCustomers();
    fetchCatalogData();
  }, [fetchNextInvoiceNumber, fetchCustomers, fetchCatalogData]);

  // Filter Catalog Products based on search and category pill
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" ||
        (product.category &&
          product.category.toLowerCase() === selectedCategory.toLowerCase());

      if (!matchesCategory) return false;

      if (!catalogSearch.trim()) return true;

      const q = catalogSearch.toLowerCase().trim();
      const matchName = product.name?.toLowerCase().includes(q);
      const matchSku = product.sku?.toLowerCase().includes(q);
      const matchBarcode = product.barcode?.toLowerCase().includes(q);
      const matchBrand = product.brand?.toLowerCase().includes(q);

      return matchName || matchSku || matchBarcode || matchBrand;
    });
  }, [allProducts, selectedCategory, catalogSearch]);

  // Product Autocomplete Live Search
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

  // Add Product to Cart or Increment Quantity
  const handleSelectProduct = (product) => {
    const existingIndex = items.findIndex((i) => i.productId === product._id);

    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity = Number(updated[existingIndex].quantity) + 1;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: product._id,
          name: product.name,
          sku: product.sku || "",
          mrp: product.mrp !== undefined && product.mrp !== null ? product.mrp : null,
          barcode: product.barcode || "",
          hsnCode: product.hsnCode || "",
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
        mrp: null,
        barcode: "",
        hsnCode: "",
        unit: "piece",
        quantity: 1,
        unitPrice: 0,
        discountRate: 0,
        taxRate: business?.taxSettings?.defaultTaxRate || 0,
      },
    ]);
  };

  // Update Item in Cart Table
  const handleUpdateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  // Remove Item from Cart
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
          mrp: i.mrp !== undefined && i.mrp !== null ? Number(i.mrp) : undefined,
          barcode: i.barcode || "",
          hsnCode: i.hsnCode || "",
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

  const handleDownloadCompletedPdf = async () => {
    if (!completedInvoice) return;
    try {
      setIsDownloadingPdf(true);
      const element = document.getElementById("completed-invoice-container");
      if (element) {
        await downloadInvoicePdf(element, completedInvoice.invoiceNumber);
      }
    } catch (err) {
      console.error("PDF download error:", err);
      showToast("Failed to download PDF", "error");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const currencySymbol = business?.currency?.symbol || "₹";

  return (
    <div className={styles.posContainer}>
      <div className={styles.billingLayout}>
        {/* Left Column: Product Selection Panel */}
        <div className={styles.catalogPanel}>
          <div className={styles.catalogHeader}>
            <h2 className={styles.catalogTitle}>
              <ShoppingBag size={20} color="var(--primary)" />
              <span>Products Catalog</span>
            </h2>
            <span className={styles.catalogBadge}>
              {filteredProducts.length} items
            </span>
          </div>

          {/* Search bar inside Catalog */}
          <div className={styles.catalogSearchWrapper}>
            <Search size={16} className={styles.catalogSearchIcon} />
            <input
              type="text"
              className={`form-input ${styles.catalogSearchInput}`}
              placeholder="Filter by product name, SKU, or barcode..."
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
            />
          </div>

          {/* Category Filter Pills */}
          <div className={styles.categoryPills}>
            <button
              type="button"
              className={`${styles.categoryPill} ${
                selectedCategory === "All" ? styles.categoryPillActive : ""
              }`}
              onClick={() => setSelectedCategory("All")}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                type="button"
                className={`${styles.categoryPill} ${
                  selectedCategory === cat.name ? styles.categoryPillActive : ""
                }`}
                onClick={() => setSelectedCategory(cat.name)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className={styles.productsGrid}>
            {catalogLoading ? (
              <div className={styles.emptyProducts}>
                <Loader message="Loading products..." />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className={styles.emptyProducts}>
                <Package size={36} color="#94a3b8" />
                <p style={{ margin: 0, fontWeight: 600 }}>No products found</p>
                <span style={{ fontSize: "0.8rem" }}>
                  Try adjusting search or category filter
                </span>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const inCart = items.find((i) => i.productId === p._id);
                return (
                  <div
                    key={p._id}
                    className={`${styles.productCard} ${!p.imageUrl ? styles.productCardNoImg : ""}`}
                    style={p.imageUrl ? { backgroundImage: `url(${p.imageUrl})` } : undefined}
                    onClick={() => handleSelectProduct(p)}
                    title={`Click to add ${p.name} to bill`}
                  >
                    {inCart && (
                      <span className={styles.inCartBadge}>
                        x{inCart.quantity}
                      </span>
                    )}

                    {!p.imageUrl && (
                      <div className={styles.placeholderCenter}>
                        <Package size={24} />
                      </div>
                    )}

                    <div className={styles.productOverlayContent}>
                      <div className={styles.productName}>{p.name}</div>
                      {p.sku ? (
                        <div className={styles.productSku}>SKU: {p.sku}</div>
                      ) : p.category && p.category !== "General" ? (
                        <div className={styles.productSku}>{p.category}</div>
                      ) : null}
                      <div className={styles.productPriceRow}>
                        <div className={styles.priceGroup}>
                          <span className={styles.sellingPrice}>
                            {currencySymbol}{Number(p.sellingPrice).toFixed(2)}
                          </span>
                          {p.mrp && Number(p.mrp) > Number(p.sellingPrice) && (
                            <span className={styles.mrpPrice}>
                              {currencySymbol}{Number(p.mrp).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <span className={styles.productUnit}>
                          /{p.unit || "pc"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Invoice / Cart Details & Calculations */}
        <div className={styles.rightCol}>
          {/* Top Bar: Invoice metadata & Customer selection */}
          <div className={styles.card} style={{ padding: "8px 10px" }}>
            <div className={styles.compactTopBar}>
              <div className={styles.compactFormGroup}>
                <label className={styles.compactLabel}>Invoice #</label>
                <input
                  type="text"
                  className={`form-input ${styles.compactInput}`}
                  value={invoiceNumber}
                  readOnly
                  title="Auto-generated sequential invoice number"
                  style={{
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    backgroundColor: "#f8fafc",
                    color: "var(--primary)",
                  }}
                />
              </div>

              <div className={styles.compactFormGroup}>
                <label className={styles.compactLabel}>Date</label>
                <input
                  type="date"
                  className={`form-input ${styles.compactInput}`}
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>

              <div className={styles.compactFormGroup}>
                <label className={styles.compactLabel}>Due Date</label>
                <input
                  type="date"
                  className={`form-input ${styles.compactInput}`}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className={styles.compactFormGroup}>
                <label className={styles.compactLabel}>Customer</label>
                <select
                  className={`form-select ${styles.compactInput}`}
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
                style={{ height: "29px", padding: "0 8px" }}
              >
                <UserPlus size={15} />
              </button>
            </div>
          </div>

          {/* Quick Search & Custom Item */}
          <div className={styles.card} style={{ padding: "6px 10px" }}>
            <div className={styles.searchSection}>
              <div className={styles.searchWrapper} ref={searchRef}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  className={`form-input ${styles.searchInput}`}
                  placeholder="Scan barcode or type SKU / name to add directly..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
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
                          <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                            SKU: {p.sku || "N/A"} | Category: {p.category} | Tax: {p.taxRate}%
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <strong style={{ color: "#2563eb" }}>
                            {currencySymbol}{Number(p.sellingPrice).toFixed(2)}
                          </strong>
                          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>per {p.unit}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddCustomItem}
                title="Add Custom Line Item"
                style={{ height: "30px", padding: "0 10px", fontSize: "0.78rem", whiteSpace: "nowrap" }}
              >
                <PlusCircle size={15} />
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
                    <th style={{ width: "28px" }}>#</th>
                    <th>Product & Details</th>
                    <th style={{ width: "115px" }}>Qty & Unit</th>
                    <th style={{ width: "85px", textAlign: "right" }}>Price ({currencySymbol})</th>
                    <th style={{ width: "65px", textAlign: "right" }}>Disc %</th>
                    <th style={{ width: "65px", textAlign: "right" }}>Tax %</th>
                    <th style={{ width: "95px", textAlign: "right" }}>Total ({currencySymbol})</th>
                    <th style={{ width: "30px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {calculatedItems.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center", padding: "28px 12px", color: "#94a3b8" }}>
                        <Receipt size={28} style={{ marginBottom: "4px" }} />
                        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem" }}>Cart is empty</p>
                        <span style={{ fontSize: "0.75rem" }}>
                          Click products on the left or scan barcode to start billing.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    calculatedItems.map((item, index) => (
                      <tr key={index}>
                        <td style={{ color: "#64748b", fontSize: "0.75rem", textAlign: "center" }}>
                          {index + 1}
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-input"
                            style={{ padding: "2px 5px", fontSize: "0.8rem", fontWeight: 600, height: "25px" }}
                            value={item.name}
                            onChange={(e) => handleUpdateItem(index, "name", e.target.value)}
                          />
                          {(item.sku || item.hsnCode) && (
                            <span style={{ fontSize: "0.68rem", color: "#64748b", marginLeft: "4px" }}>
                              {[item.sku ? `SKU: ${item.sku}` : null, item.hsnCode ? `HSN: ${item.hsnCode}` : null].filter(Boolean).join(" | ")}
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
                            <span style={{ fontSize: "0.7rem", color: "#64748b", padding: "0 3px" }}>
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
                            style={{ width: "55px" }}
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
                            style={{ width: "55px" }}
                            value={item.taxRate}
                            onChange={(e) => handleUpdateItem(index, "taxRate", e.target.value)}
                          />
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700, fontSize: "0.825rem" }}>
                          {currencySymbol}{item.lineTotal.toFixed(2)}
                        </td>
                        <td>
                          <button
                            type="button"
                            className={styles.removeLineBtn}
                            onClick={() => handleRemoveItem(index)}
                            title="Remove line item"
                          >
                            <Trash2 size={14} />
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
          <div className={styles.card} style={{ padding: "6px 10px" }}>
            <div className={styles.compactFormGroup}>
              <input
                type="text"
                className={`form-input ${styles.compactInput}`}
                placeholder="Optional notes printed on invoice..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Bill Summary & Payment Settlement */}
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryTitle}>Bill Summary & Payment</h3>

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
            <div style={{ margin: "5px 0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3px" }}>
                <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600 }}>Invoice Discount:</span>
                <div style={{ display: "flex", gap: "3px" }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${invoiceDiscountType === "FIXED" ? "btn-primary" : "btn-secondary"}`}
                    style={{ padding: "1px 6px", fontSize: "0.68rem", height: "20px" }}
                    onClick={() => setInvoiceDiscountType("FIXED")}
                  >
                    {currencySymbol} Flat
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${invoiceDiscountType === "PERCENTAGE" ? "btn-primary" : "btn-secondary"}`}
                    style={{ padding: "1px 6px", fontSize: "0.68rem", height: "20px" }}
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
                className={`form-input ${styles.compactInput}`}
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
            <div style={{ marginBottom: "8px" }}>
              <div className={styles.paymentMethodsGrid}>
                {[
                  { id: "CASH", label: "Cash", icon: Banknote },
                  { id: "UPI", label: "UPI", icon: QrCode },
                  { id: "CARD", label: "Card", icon: CreditCard },
                  { id: "BANK_TRANSFER", label: "NetBank", icon: Building },
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
                      <Icon size={14} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount Received & Quick Buttons */}
            <div style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                <span className={styles.compactLabel}>Amount Received ({currencySymbol})</span>
                <div style={{ display: "flex", gap: "3px" }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "1px 5px", fontSize: "0.68rem", height: "20px" }}
                    onClick={() => setAmountReceived(grandTotal)}
                  >
                    Full
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "1px 5px", fontSize: "0.68rem", height: "20px" }}
                    onClick={() => setAmountReceived(Math.ceil(grandTotal))}
                  >
                    Round
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "1px 5px", fontSize: "0.68rem", height: "20px" }}
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
                className={`form-input ${styles.compactInput}`}
                placeholder="0.00"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
              />
            </div>

            {/* Reference Number */}
            {paymentMethod !== "CASH" && (
              <div style={{ marginBottom: "8px" }}>
                <input
                  type="text"
                  className={`form-input ${styles.compactInput}`}
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
                <span>{balanceDue > 0 ? "Balance Due:" : "Status:"}</span>
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
                <CheckCircle2 size={16} />
                <span>{submitting ? "Processing..." : "Complete Sale"}</span>
              </button>

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: "100%", padding: "7px 10px", fontSize: "0.825rem", height: "33px" }}
                disabled={submitting || items.length === 0}
                onClick={() => handleCompleteSale(true)}
              >
                <Printer size={15} />
                <span>Complete Sale & Print</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: "100%", padding: "5px 10px", fontSize: "0.775rem", height: "29px" }}
                onClick={handleStartNewBill}
                disabled={submitting}
              >
                <RotateCcw size={14} />
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

      {/* Post-Sale Success & Print / Download PDF Modal */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={handleStartNewBill}
        title="Sale Completed Successfully"
        size="lg"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleDownloadCompletedPdf}
              disabled={isDownloadingPdf}
            >
              <Download size={16} />
              <span>{isDownloadingPdf ? "Exporting PDF..." : "Download PDF"}</span>
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.print()}>
              <Printer size={16} /> Print Receipt
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleStartNewBill}>
              <PlusCircle size={16} /> Start New Bill
            </button>
          </>
        }
      >
        {completedInvoice && (
          <div id="completed-invoice-container" ref={modalInvoiceRef}>
            <PrintableInvoice
              invoice={completedInvoice}
              business={business}
              onPrint={() => window.print()}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default NewBill;
