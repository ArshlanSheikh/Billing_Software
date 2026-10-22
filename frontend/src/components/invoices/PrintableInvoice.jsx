import React, { useRef, useState } from "react";
import { Printer, Download, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { downloadInvoicePdf } from "../../utils/pdfGenerator";
import styles from "./PrintableInvoice.module.css";

const PrintableInvoice = ({ invoice, business, onPrint }) => {
  const sheetRef = useRef(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  if (!invoice) return null;

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      await downloadInvoicePdf(sheetRef.current, invoice.invoiceNumber);
    } catch (err) {
      console.error("Download PDF failed:", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const currencySymbol = business?.currency?.symbol || "₹";

  const getStatusBadge = (status) => {
    if (status === "PAID") return <span className="badge badge-paid">PAID</span>;
    if (status === "PARTIALLY_PAID") return <span className="badge badge-partial">PARTIALLY PAID</span>;
    if (status === "UNPAID") return <span className="badge badge-unpaid">UNPAID</span>;
    return <span className="badge badge-draft">{status}</span>;
  };

  return (
    <div className={styles.invoiceSheet} ref={sheetRef}>
      <div className={`${styles.topBar} ${styles.noPrint}`} data-no-pdf="true">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {getStatusBadge(invoice.paymentStatus)}
          {invoice.status === "CANCELLED" && <span className="badge badge-cancelled">CANCELLED</span>}
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
          >
            <Download size={16} />
            <span>{isDownloadingPdf ? "Generating PDF..." : "Download PDF"}</span>
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      <div className={styles.headerGrid}>
        <div className={styles.businessInfo}>
          {business?.logo && (
            <img
              src={business.logo}
              alt={business?.name || "Business Logo"}
              style={{ maxHeight: "55px", marginBottom: "8px", objectFit: "contain", display: "block" }}
            />
          )}
          <h1>{business?.name || "Store"}</h1>
          <div className={styles.businessMeta}>
            {business?.address?.street && <div>{business.address.street}</div>}
            {(business?.address?.city || business?.address?.state) && (
              <div>
                {[business?.address?.city, business?.address?.state, business?.address?.pincode]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            )}
            {business?.phone && <div>Phone: {business.phone}</div>}
            {business?.email && <div>Email: {business.email}</div>}
            {business?.gstin && <div><strong>GSTIN:</strong> {business.gstin}</div>}
          </div>
        </div>

        <div className={styles.invoiceMeta}>
          <div className={styles.invoiceTitle}>TAX INVOICE</div>
          <div className={styles.invoiceDetails}>
            <div><strong>Invoice No:</strong> {invoice.invoiceNumber}</div>
            <div><strong>Date:</strong> {new Date(invoice.invoiceDate).toLocaleDateString()}</div>
            {invoice.dueDate && (
              <div><strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}</div>
            )}
            <div><strong>Payment Mode:</strong> {invoice.paymentMethod || "CASH"}</div>
          </div>
        </div>
      </div>

      <div className={styles.billToSection}>
        <div className={styles.billToTitle}>Billed To</div>
        <div className={styles.customerName}>{invoice.customerSnapshot?.name || "Walk-in Customer"}</div>
        {invoice.customerSnapshot?.phone && <div>Phone: {invoice.customerSnapshot.phone}</div>}
        {invoice.customerSnapshot?.address && <div>Address: {invoice.customerSnapshot.address}</div>}
        {invoice.customerSnapshot?.gstin && <div>GSTIN: {invoice.customerSnapshot.gstin}</div>}
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.itemsTable}>
          <thead>
            <tr>
              <th className={styles.textCenter} style={{ width: "40px" }}>#</th>
              <th>Item & Description</th>
              <th className={styles.textCenter}>Qty</th>
              <th className={styles.textRight}>Rate ({currencySymbol})</th>
              {invoice.itemDiscountTotal > 0 && <th className={styles.textRight}>Disc %</th>}
              <th className={styles.textRight}>Tax %</th>
              <th className={styles.textRight}>Amount ({currencySymbol})</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item, index) => (
              <tr key={index}>
                <td className={styles.textCenter}>{index + 1}</td>
                <td>
                  <strong>{item.name}</strong>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    {[
                      item.sku ? `SKU: ${item.sku}` : null,
                      item.hsnCode ? `HSN: ${item.hsnCode}` : null,
                      item.mrp && item.mrp > item.unitPrice ? `MRP: ${currencySymbol}${Number(item.mrp).toFixed(2)}` : null,
                    ].filter(Boolean).join(" | ")}
                  </div>
                </td>
                <td className={styles.textCenter}>
                  {item.quantity} {item.unit}
                </td>
                <td className={styles.textRight}>{Number(item.unitPrice).toFixed(2)}</td>
                {invoice.itemDiscountTotal > 0 && (
                  <td className={styles.textRight}>{item.discountRate || 0}%</td>
                )}
                <td className={styles.textRight}>{item.taxRate || 0}%</td>
                <td className={styles.textRight}><strong>{Number(item.lineTotal).toFixed(2)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.summarySection}>
        <div className={styles.termsColumn}>
          <div className={styles.termsTitle}>Terms & Conditions</div>
          <div style={{ whiteSpace: "pre-line" }}>
            {invoice.termsAndConditions || business?.invoiceSettings?.termsAndConditions || "Thank you for your business!"}
          </div>
        </div>

        <div className={styles.totalsColumn}>
          <div className={styles.totalRow}>
            <span>Subtotal:</span>
            <span>{currencySymbol}{Number(invoice.subtotal).toFixed(2)}</span>
          </div>

          {invoice.itemDiscountTotal > 0 && (
            <div className={styles.totalRow} style={{ color: "#16a34a" }}>
              <span>Item Discounts:</span>
              <span>-{currencySymbol}{Number(invoice.itemDiscountTotal).toFixed(2)}</span>
            </div>
          )}

          {invoice.invoiceDiscount?.amount > 0 && (
            <div className={styles.totalRow} style={{ color: "#16a34a" }}>
              <span>Special Discount:</span>
              <span>-{currencySymbol}{Number(invoice.invoiceDiscount.amount).toFixed(2)}</span>
            </div>
          )}

          <div className={styles.totalRow}>
            <span>Tax (GST):</span>
            <span>+{currencySymbol}{Number(invoice.taxTotal).toFixed(2)}</span>
          </div>

          <div className={styles.grandTotalRow}>
            <span>Grand Total:</span>
            <span>{currencySymbol}{Number(invoice.grandTotal).toFixed(2)}</span>
          </div>

          <div className={styles.totalRow} style={{ fontWeight: 600 }}>
            <span>Amount Paid:</span>
            <span>{currencySymbol}{Number(invoice.amountPaid).toFixed(2)}</span>
          </div>

          <div className={styles.totalRow} style={{ fontWeight: 700, color: invoice.balanceDue > 0 ? "#dc2626" : "#16a34a" }}>
            <span>Balance Due:</span>
            <span>{currencySymbol}{Number(invoice.balanceDue).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className={styles.footerSignSection}>
        <div className={styles.footerNote}>
          {business?.invoiceSettings?.footerNote || "This is a computer generated invoice."}
        </div>
        <div className={styles.signBox}>
          <div>Authorized Signatory</div>
        </div>
      </div>
    </div>
  );
};

export default PrintableInvoice;
