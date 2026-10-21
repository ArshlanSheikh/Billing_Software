import React, { useState, useEffect, useCallback } from "react";
import { BarChart3, TrendingUp, Calendar, Package, CreditCard, DollarSign } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Loader from "../../components/common/Loader/Loader";
import styles from "./ReportsPage.module.css";

const ReportsPage = () => {
  const { business } = useAuth();
  const { showToast } = useToast();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);

      const res = await api.get(`/reports/sales?${queryParams.toString()}`);
      if (res.success && res.data) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error("Fetch sales report error:", err);
      showToast("Failed to generate sales report", "error");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, showToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleQuickRange = (rangeType) => {
    const today = new Date();
    const formatDate = (d) => d.toISOString().split("T")[0];

    if (rangeType === "today") {
      setStartDate(formatDate(today));
      setEndDate(formatDate(today));
    } else if (rangeType === "week") {
      const pastWeek = new Date();
      pastWeek.setDate(today.getDate() - 7);
      setStartDate(formatDate(pastWeek));
      setEndDate(formatDate(today));
    } else if (rangeType === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(today));
    } else if (rangeType === "all") {
      setStartDate("");
      setEndDate("");
    }
  };

  const currencySymbol = business?.currency?.symbol || "₹";

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Sales Analytics & Tax Reports</h1>
          <p className={styles.subtitle}>Audit financial figures, tax collections, and product demand</p>
        </div>
      </div>

      <div className={styles.filterCard}>
        <div className={styles.quickPills}>
          <button className="btn btn-secondary btn-sm" onClick={() => handleQuickRange("today")}>
            Today
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => handleQuickRange("week")}>
            Last 7 Days
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => handleQuickRange("month")}>
            This Month
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => handleQuickRange("all")}>
            All Time
          </button>
        </div>

        <div className={styles.datePickers}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.825rem", color: "#64748b" }}>From:</span>
            <input
              type="date"
              className="form-input"
              style={{ width: "auto" }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.825rem", color: "#64748b" }}>To:</span>
            <input
              type="date"
              className="form-input"
              style={{ width: "auto" }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <Loader message="Compiling report metrics..." />
      ) : (
        <>
          {/* Summary KPIs */}
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Total Sales Revenue</div>
              <div className={styles.summaryValue} style={{ color: "#2563eb" }}>
                {currencySymbol}{Number(reportData?.summary?.totalSales || 0).toFixed(2)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
                Across {reportData?.summary?.invoiceCount || 0} completed invoices
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>GST / Tax Collected</div>
              <div className={styles.summaryValue} style={{ color: "#059669" }}>
                {currencySymbol}{Number(reportData?.summary?.totalTax || 0).toFixed(2)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
                Total Tax Liability
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Payments Collected</div>
              <div className={styles.summaryValue} style={{ color: "#16a34a" }}>
                {currencySymbol}{Number(reportData?.summary?.totalPaid || 0).toFixed(2)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
                Received in Accounts
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Outstanding Receivables</div>
              <div className={styles.summaryValue} style={{ color: (reportData?.summary?.totalOutstanding || 0) > 0 ? "#dc2626" : "#475569" }}>
                {currencySymbol}{Number(reportData?.summary?.totalOutstanding || 0).toFixed(2)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
                Credit to be collected
              </div>
            </div>
          </div>

          <div className={styles.reportsGrid}>
            {/* Product Sales Breakdown */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Product Sales Breakdown</h2>
                <Package size={18} color="#64748b" />
              </div>
              {(!reportData?.productSales || reportData.productSales.length === 0) ? (
                <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                  No item sales in this period.
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Qty Sold</th>
                      <th style={{ textAlign: "right" }}>Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.productSales.map((p, idx) => (
                      <tr key={idx}>
                        <td><strong>{p.name}</strong></td>
                        <td>{p.sku || "—"}</td>
                        <td>{p.totalQuantity} {p.unit}</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          {currencySymbol}{Number(p.totalRevenue).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Payment Method Breakdown */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Payment Modes</h2>
                <CreditCard size={18} color="#64748b" />
              </div>
              {(!reportData?.paymentBreakdown || reportData.paymentBreakdown.length === 0) ? (
                <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                  No payments recorded.
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Mode</th>
                      <th>Transactions</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.paymentBreakdown.map((pm, idx) => (
                      <tr key={idx}>
                        <td><strong>{pm.method}</strong></td>
                        <td>{pm.count} txns</td>
                        <td style={{ textAlign: "right", fontWeight: 700, color: "#16a34a" }}>
                          {currencySymbol}{Number(pm.totalAmount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
