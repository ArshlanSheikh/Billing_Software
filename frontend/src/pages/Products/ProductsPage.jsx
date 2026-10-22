import React, { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Search, Edit2, Trash2, Tag, Package, Check, X, Image as ImageIcon, Upload } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Modal from "../../components/common/Modal/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";
import Loader from "../../components/common/Loader/Loader";
import styles from "./ProductsPage.module.css";

const initialProductForm = {
  name: "",
  sku: "",
  description: "",
  category: "General",
  sellingPrice: "",
  purchasePrice: "",
  mrp: "",
  brand: "",
  barcode: "",
  hsnCode: "",
  unit: "piece",
  taxRate: 0,
  imageUrl: "",
  imagePublicId: "",
};

const ProductsPage = () => {
  const { business } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(initialProductForm);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Category modal state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [catSubmitting, setCatSubmitting] = useState(false);

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, productId: null, productName: "" });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);
      if (selectedCategory !== "All") queryParams.append("category", selectedCategory);

      const res = await api.get(`/products?${queryParams.toString()}`);
      if (res.success) {
        setProducts(res.data.products || []);
      }
    } catch (err) {
      console.error("Fetch products failed:", err);
      showToast("Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, showToast]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get("/categories");
      if (res.success) {
        setCategories(res.data.categories || []);
      }
    } catch (err) {
      console.error("Fetch categories failed:", err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      ...initialProductForm,
      taxRate: business?.taxSettings?.defaultTaxRate || 0,
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || "",
      description: product.description || "",
      category: product.category || "General",
      sellingPrice: product.sellingPrice,
      purchasePrice: product.purchasePrice || "",
      mrp: product.mrp !== undefined && product.mrp !== null ? product.mrp : "",
      brand: product.brand || "",
      barcode: product.barcode || "",
      hsnCode: product.hsnCode || "",
      unit: product.unit || "piece",
      taxRate: product.taxRate || 0,
      imageUrl: product.imageUrl || "",
      imagePublicId: product.imagePublicId || "",
    });
    setIsProductModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file (PNG, JPG, WEBP, GIF)", "warning");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size must be less than 5MB", "warning");
      return;
    }

    try {
      setUploadingImage(true);
      const data = new FormData();
      data.append("image", file);
      if (formData.imagePublicId) {
        data.append("oldPublicId", formData.imagePublicId);
      }

      const res = await api.post("/products/upload-image", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.success && res.data) {
        setFormData((prev) => ({
          ...prev,
          imageUrl: res.data.imageUrl,
          imagePublicId: res.data.imagePublicId,
        }));
        showToast("Product image uploaded to Cloudinary successfully", "success");
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      showToast(err.message || "Failed to upload image to Cloudinary", "error");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      imageUrl: "",
      imagePublicId: "",
    }));
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.sellingPrice === "") {
      showToast("Please enter product name and selling price", "warning");
      return;
    }

    if (Number(formData.sellingPrice) < 0) {
      showToast("Selling price cannot be negative", "warning");
      return;
    }

    if (formData.mrp !== "" && Number(formData.mrp) < 0) {
      showToast("MRP cannot be negative", "warning");
      return;
    }

    if (formData.purchasePrice !== "" && Number(formData.purchasePrice) < 0) {
      showToast("Purchase price cannot be negative", "warning");
      return;
    }

    try {
      setFormSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        description: formData.description.trim(),
        category: formData.category,
        sellingPrice: Number(formData.sellingPrice),
        purchasePrice: formData.purchasePrice !== "" ? Number(formData.purchasePrice) : 0,
        mrp: formData.mrp !== "" ? Number(formData.mrp) : undefined,
        brand: formData.brand.trim(),
        barcode: formData.barcode.trim(),
        hsnCode: formData.hsnCode.trim(),
        unit: formData.unit,
        taxRate: Number(formData.taxRate) || 0,
        imageUrl: formData.imageUrl ? formData.imageUrl.trim() : "",
        imagePublicId: formData.imagePublicId ? formData.imagePublicId.trim() : "",
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
        showToast("Product updated successfully", "success");
      } else {
        await api.post("/products", payload);
        showToast("Product created successfully", "success");
      }

      setIsProductModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error("Save product error:", err);
      showToast(err.message || "Failed to save product", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);
      await api.delete(`/products/${deleteDialog.productId}`);
      showToast("Product deleted successfully", "success");
      setDeleteDialog({ isOpen: false, productId: null, productName: "" });
      fetchProducts();
    } catch (err) {
      console.error("Delete product error:", err);
      showToast(err.message || "Failed to delete product", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      setCatSubmitting(true);
      const res = await api.post("/categories", { name: newCategoryName.trim() });
      if (res.success) {
        showToast("Category created", "success");
        setNewCategoryName("");
        fetchCategories();
      }
    } catch (err) {
      console.error("Create category error:", err);
      showToast(err.message || "Failed to create category", "error");
    } finally {
      setCatSubmitting(false);
    }
  };

  const currencySymbol = business?.currency?.symbol || "₹";

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Product & Service Catalog</h1>
          <p className={styles.subtitle}>Manage your items, pricing, units, and tax classifications</p>
        </div>
        <div className={styles.actionsGroup}>
          <button className="btn btn-secondary" onClick={() => setIsCategoryModalOpen(true)}>
            <Tag size={16} />
            <span>Categories</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      <div className={styles.filterCard}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={`form-input ${styles.searchInput}`}
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label className="form-label" style={{ margin: 0 }}>Category:</label>
          <select
            className="form-select"
            style={{ width: "auto" }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <Loader message="Loading products..." />
        ) : products.length === 0 ? (
          <div className={styles.emptyState}>
            <Package size={48} color="#94a3b8" />
            <h3>No products found</h3>
            <p>Add your first product or try adjusting your search filters.</p>
            <button className="btn btn-primary btn-sm" onClick={handleOpenAddModal}>
              <Plus size={15} /> Add First Product
            </button>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Code / Barcode</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Selling Price</th>
                <th>MRP</th>
                <th>Unit</th>
                <th>Tax</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div className={styles.tableThumb}>
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} />
                        ) : (
                          <Package size={18} color="#94a3b8" />
                        )}
                      </div>
                      <div>
                        <strong>{p.name}</strong>
                        {p.description && (
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{p.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{p.sku || "—"}</div>
                    {(p.barcode || p.hsnCode) && (
                      <div style={{ fontSize: "0.725rem", color: "#64748b" }}>
                        {[p.barcode ? `Barcode: ${p.barcode}` : null, p.hsnCode ? `HSN: ${p.hsnCode}` : null].filter(Boolean).join(" | ")}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>
                      {p.category}
                    </span>
                  </td>
                  <td>{p.brand || "—"}</td>
                  <td className={styles.priceText}>
                    {currencySymbol}{Number(p.sellingPrice).toFixed(2)}
                  </td>
                  <td>
                    {p.mrp ? (
                      <span style={{ fontWeight: 600, color: p.mrp > p.sellingPrice ? "#16a34a" : "#475569" }}>
                        {currencySymbol}{Number(p.mrp).toFixed(2)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{p.unit}</td>
                  <td>{p.taxRate}%</td>
                  <td>
                    {p.isActive ? (
                      <span className="badge badge-paid">Active</span>
                    ) : (
                      <span className="badge badge-unpaid">Inactive</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "6px" }}>
                      <button
                        className={styles.actionIconBtn}
                        onClick={() => handleOpenEditModal(p)}
                        title="Edit Product"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className={`${styles.actionIconBtn} ${styles.deleteBtn}`}
                        onClick={() =>
                          setDeleteDialog({ isOpen: true, productId: p._id, productName: p.name })
                        }
                        title="Delete Product"
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

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? "Edit Product" : "Add New Product"}
        size="lg"
        footer={
          <>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsProductModalOpen(false)}
              disabled={formSubmitting || uploadingImage}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSaveProduct}
              disabled={formSubmitting || uploadingImage}
            >
              {formSubmitting ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveProduct}>
          {/* Cloudinary Image Upload Section */}
          <div className="form-group" style={{ marginBottom: "14px" }}>
            <label className="form-label">Product Image (Optional)</label>
            <div className={styles.imageUploadContainer}>
              {formData.imageUrl ? (
                <div className={styles.imagePreviewWrapper}>
                  <img
                    src={formData.imageUrl}
                    alt="Product preview"
                    className={styles.imagePreview}
                  />
                  <div className={styles.imageActions}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                    >
                      <Upload size={14} />
                      <span>{uploadingImage ? "Uploading..." : "Replace Image"}</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ color: "var(--danger)" }}
                      onClick={handleRemoveImage}
                      disabled={uploadingImage}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={styles.uploadDropzone}
                  onClick={() => !uploadingImage && fileInputRef.current?.click()}
                >
                  {uploadingImage ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Loader size="sm" />
                      <span>Uploading to Cloudinary...</span>
                    </div>
                  ) : (
                    <>
                      <ImageIcon size={26} color="#94a3b8" />
                      <div>
                        <strong style={{ fontSize: "0.85rem" }}>Click to select product image</strong>
                        <div style={{ fontSize: "0.725rem", color: "#64748b" }}>
                          JPG, PNG, WEBP, GIF up to 5MB (Stored in Cloudinary)
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          <div className={styles.formGrid2}>
            <div className="form-group">
              <label className="form-label">
                Product Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="e.g. Cotton T-Shirt, Basmati Rice"
                value={formData.name}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                name="category"
                className="form-select"
                value={formData.category}
                onChange={handleFormChange}
              >
                <option value="General">General</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGrid2}>
            <div className="form-group">
              <label className="form-label">
                Selling Price ({currencySymbol}) <span className="required">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="sellingPrice"
                className="form-input"
                placeholder="0.00"
                value={formData.sellingPrice}
                onChange={handleFormChange}
                required
              />
              <span style={{ fontSize: "0.725rem", color: "#64748b" }}>
                Price charged during billing calculations.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">MRP ({currencySymbol}) (Optional)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="mrp"
                className="form-input"
                placeholder="0.00"
                value={formData.mrp}
                onChange={handleFormChange}
              />
              <span style={{ fontSize: "0.725rem", color: "#64748b" }}>
                Maximum Retail Price printed on packaging.
              </span>
            </div>
          </div>

          <div className={styles.formGrid2}>
            <div className="form-group">
              <label className="form-label">SKU / Item Code</label>
              <input
                type="text"
                name="sku"
                className="form-input"
                placeholder="e.g. PRD-001"
                value={formData.sku}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Barcode / UPC</label>
              <input
                type="text"
                name="barcode"
                className="form-input"
                placeholder="e.g. 8901234567890"
                value={formData.barcode}
                onChange={handleFormChange}
              />
            </div>
          </div>

          <div className={styles.formGrid2}>
            <div className="form-group">
              <label className="form-label">Brand</label>
              <input
                type="text"
                name="brand"
                className="form-input"
                placeholder="e.g. Nike, Tata, Nestlé"
                value={formData.brand}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">HSN / SAC Code</label>
              <input
                type="text"
                name="hsnCode"
                className="form-input"
                placeholder="e.g. 610910, 998311"
                value={formData.hsnCode}
                onChange={handleFormChange}
              />
            </div>
          </div>

          <div className={styles.formGrid2}>
            <div className="form-group">
              <label className="form-label">Unit of Measure</label>
              <select
                name="unit"
                className="form-select"
                value={formData.unit}
                onChange={handleFormChange}
              >
                <option value="piece">Piece (pc)</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="gram">Gram (g)</option>
                <option value="litre">Litre (L)</option>
                <option value="meter">Meter (m)</option>
                <option value="hour">Hour (hr)</option>
                <option value="service">Service</option>
                <option value="box">Box</option>
                <option value="packet">Packet</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">GST / Tax Rate (%)</label>
              <select
                name="taxRate"
                className="form-select"
                value={formData.taxRate}
                onChange={handleFormChange}
              >
                <option value={0}>0% (Tax Exempt / Nil)</option>
                <option value={5}>5% GST</option>
                <option value={12}>12% GST</option>
                <option value={18}>18% GST</option>
                <option value={28}>28% GST</option>
              </select>
            </div>
          </div>

          <div className={styles.formGrid2}>
            <div className="form-group">
              <label className="form-label">Purchase Price ({currencySymbol}) (Internal)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="purchasePrice"
                className="form-input"
                placeholder="Optional - hidden from invoices"
                value={formData.purchasePrice}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description / Notes</label>
              <input
                type="text"
                name="description"
                className="form-input"
                placeholder="Short description..."
                value={formData.description}
                onChange={handleFormChange}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Category Management Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Manage Categories"
        size="md"
      >
        <form onSubmit={handleCreateCategory} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <input
            type="text"
            className="form-input"
            placeholder="New Category Name (e.g. Dairy, Apparel)..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <button className="btn btn-primary" type="submit" disabled={catSubmitting}>
            <Plus size={16} /> Add
          </button>
        </form>

        <div style={{ maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
          {categories.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", textAlign: "center" }}>No categories created yet</p>
          ) : (
            categories.map((c) => (
              <div
                key={c._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{c.name}</span>
                <span className="badge badge-paid">Active</span>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, productId: null, productName: "" })}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteDialog.productName}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleteLoading}
      />
    </div>
  );
};

export default ProductsPage;
