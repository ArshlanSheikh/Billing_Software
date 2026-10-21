import mongoose from "mongoose";
import { Invoice } from "../invoices/invoice.model.js";
import { Payment } from "../payments/payment.model.js";
import { Customer } from "../customers/customer.model.js";
import { Product } from "../products/product.model.js";
import { roundMoney } from "../invoices/invoice.utils.js";

export const GetDashboardStatsController = async (req, res) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.businessId);

    // Today range in server local time
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Today's Invoices Aggregation
    const todayInvoiceStats = await Invoice.aggregate([
      {
        $match: {
          businessId,
          status: "COMPLETED",
          invoiceDate: { $gte: todayStart, $lte: todayEnd },
        },
      },
      {
        $group: {
          _id: null,
          todaySales: { $sum: "$grandTotal" },
          todayCount: { $sum: 1 },
          todayReceived: { $sum: "$amountPaid" },
        },
      },
    ]);

    // Overall Outstanding Dues
    const overallStats = await Invoice.aggregate([
      {
        $match: {
          businessId,
          status: "COMPLETED",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$grandTotal" },
          totalPaid: { $sum: "$amountPaid" },
          totalOutstanding: { $sum: "$balanceDue" },
          totalInvoicesCount: { $sum: 1 },
        },
      },
    ]);

    // Today's Payments Collected directly from Payment records
    const todayPayments = await Payment.aggregate([
      {
        $match: {
          businessId,
          paymentDate: { $gte: todayStart, $lte: todayEnd },
        },
      },
      {
        $group: {
          _id: null,
          collected: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Counts
    const totalCustomers = await Customer.countDocuments({ businessId, isActive: true });
    const totalProducts = await Product.countDocuments({ businessId, isActive: true });

    // 5 Recent Invoices
    const recentInvoices = await Invoice.find({ businessId })
      .sort({ invoiceDate: -1, createdAt: -1 })
      .limit(5)
      .select("invoiceNumber invoiceDate customerSnapshot grandTotal amountPaid balanceDue paymentStatus status");

    const todaySales = todayInvoiceStats[0]?.todaySales ? roundMoney(todayInvoiceStats[0].todaySales) : 0;
    const todayInvoiceCount = todayInvoiceStats[0]?.todayCount || 0;
    const paymentsReceivedToday = todayPayments[0]?.collected ? roundMoney(todayPayments[0].collected) : 0;
    const outstandingDues = overallStats[0]?.totalOutstanding ? roundMoney(overallStats[0].totalOutstanding) : 0;
    const totalRevenue = overallStats[0]?.totalRevenue ? roundMoney(overallStats[0].totalRevenue) : 0;
    const totalInvoices = overallStats[0]?.totalInvoicesCount || 0;

    return res.status(200).json({
      success: true,
      message: "Dashboard statistics calculated successfully",
      data: {
        todaySales,
        todayInvoiceCount,
        paymentsReceivedToday,
        outstandingDues,
        totalRevenue,
        totalInvoices,
        totalCustomers,
        totalProducts,
        recentInvoices,
      },
      error: null,
    });
  } catch (error) {
    console.error("[DashboardStats Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate dashboard statistics",
      data: null,
      error: error.message,
    });
  }
};

export const GetSalesReportController = async (req, res) => {
  try {
    const businessId = new mongoose.Types.ObjectId(req.businessId);
    const { startDate, endDate } = req.query;

    const matchFilter = {
      businessId,
      status: "COMPLETED",
    };

    if (startDate || endDate) {
      matchFilter.invoiceDate = {};
      if (startDate) matchFilter.invoiceDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchFilter.invoiceDate.$lte = end;
      }
    }

    // Totals Aggregation
    const summaryAgg = await Invoice.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$grandTotal" },
          totalSubtotal: { $sum: "$subtotal" },
          totalTax: { $sum: "$taxTotal" },
          totalItemDiscount: { $sum: "$itemDiscountTotal" },
          totalInvoiceDiscount: { $sum: "$invoiceDiscount.amount" },
          totalPaid: { $sum: "$amountPaid" },
          totalOutstanding: { $sum: "$balanceDue" },
          invoiceCount: { $sum: 1 },
        },
      },
    ]);

    // Product Breakdown Aggregation
    const productSalesAgg = await Invoice.aggregate([
      { $match: matchFilter },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          sku: { $first: "$items.sku" },
          unit: { $first: "$items.unit" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.lineTotal" },
          invoicesCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 15 },
    ]);

    // Payment Method Breakdown
    const paymentMethodAgg = await Payment.aggregate([
      {
        $match: {
          businessId,
          ...(startDate || endDate
            ? {
                paymentDate: {
                  ...(startDate ? { $gte: new Date(startDate) } : {}),
                  ...(endDate
                    ? {
                        $lte: (() => {
                          const e = new Date(endDate);
                          e.setHours(23, 59, 59, 999);
                          return e;
                        })(),
                      }
                    : {}),
                },
              }
            : {}),
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const summary = summaryAgg[0] || {
      totalSales: 0,
      totalSubtotal: 0,
      totalTax: 0,
      totalItemDiscount: 0,
      totalInvoiceDiscount: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      invoiceCount: 0,
    };

    return res.status(200).json({
      success: true,
      message: "Sales report generated successfully",
      data: {
        summary: {
          totalSales: roundMoney(summary.totalSales),
          totalSubtotal: roundMoney(summary.totalSubtotal),
          totalTax: roundMoney(summary.totalTax),
          totalDiscount: roundMoney(summary.totalItemDiscount + summary.totalInvoiceDiscount),
          totalPaid: roundMoney(summary.totalPaid),
          totalOutstanding: roundMoney(summary.totalOutstanding),
          invoiceCount: summary.invoiceCount,
        },
        productSales: productSalesAgg.map((p) => ({
          name: p._id,
          sku: p.sku,
          unit: p.unit,
          totalQuantity: p.totalQuantity,
          totalRevenue: roundMoney(p.totalRevenue),
          invoicesCount: p.invoicesCount,
        })),
        paymentBreakdown: paymentMethodAgg.map((pm) => ({
          method: pm._id,
          totalAmount: roundMoney(pm.totalAmount),
          count: pm.count,
        })),
      },
      error: null,
    });
  } catch (error) {
    console.error("[SalesReport Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate sales report",
      data: null,
      error: error.message,
    });
  }
};
