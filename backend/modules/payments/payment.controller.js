import { Payment } from "./payment.model.js";
import { Invoice } from "../invoices/invoice.model.js";
import { Customer } from "../customers/customer.model.js";
import { roundMoney } from "../invoices/invoice.utils.js";

export const GetPaymentsController = async (req, res) => {
  try {
    const { invoiceId, customerId, paymentMethod, startDate, endDate } = req.query;
    const filter = { businessId: req.businessId };

    if (invoiceId) filter.invoiceId = invoiceId;
    if (customerId) filter.customerId = customerId;
    if (paymentMethod && paymentMethod !== "ALL") filter.paymentMethod = paymentMethod;

    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.paymentDate.$lte = end;
      }
    }

    const payments = await Payment.find(filter)
      .sort({ paymentDate: -1, createdAt: -1 })
      .populate("invoiceId", "invoiceNumber grandTotal amountPaid balanceDue paymentStatus")
      .populate("customerId", "name phone");

    return res.status(200).json({
      success: true,
      message: "Payments fetched successfully",
      data: { payments, total: payments.length },
      error: null,
    });
  } catch (error) {
    console.error("[GetPayments Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      data: null,
      error: error.message,
    });
  }
};

export const RecordPaymentController = async (req, res) => {
  try {
    const comingData = req.body;
    const requiredFields = ["invoiceId", "amount", "paymentMethod"];

    const missingFields = requiredFields.filter((item) => {
      return (
        comingData[item] === null ||
        comingData[item] === undefined ||
        (typeof comingData[item] === "string" && comingData[item].trim() === "")
      );
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
        data: null,
        error: missingFields,
      });
    }

    const { invoiceId, amount, paymentMethod, referenceNumber, notes, paymentDate } = comingData;
    const payAmount = roundMoney(Number(amount));

    if (payAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be greater than zero",
        data: null,
        error: "INVALID_AMOUNT",
      });
    }

    const invoice = await Invoice.findOne({ _id: invoiceId, businessId: req.businessId });
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
        data: null,
        error: "INVOICE_NOT_FOUND",
      });
    }

    if (invoice.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Cannot record payments against a cancelled invoice",
        data: null,
        error: "INVOICE_CANCELLED",
      });
    }

    if (invoice.balanceDue <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invoice is already fully paid",
        data: null,
        error: "ALREADY_PAID",
      });
    }

    if (payAmount > invoice.balanceDue) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${payAmount}) exceeds the remaining balance due (₹${invoice.balanceDue})`,
        data: null,
        error: "EXCEEDS_BALANCE",
      });
    }

    // Create payment record
    const payment = await Payment.create({
      businessId: req.businessId,
      invoiceId: invoice._id,
      customerId: invoice.customerId || null,
      amount: payAmount,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod,
      referenceNumber: referenceNumber ? referenceNumber.trim() : "",
      notes: notes ? notes.trim() : "",
      recordedBy: req.user._id,
    });

    // Update invoice balance
    invoice.amountPaid = roundMoney(invoice.amountPaid + payAmount);
    invoice.balanceDue = roundMoney(invoice.balanceDue - payAmount);
    if (invoice.balanceDue <= 0) {
      invoice.paymentStatus = "PAID";
    } else {
      invoice.paymentStatus = "PARTIALLY_PAID";
    }
    await invoice.save();

    // Update customer balance if attached
    if (invoice.customerId) {
      const customer = await Customer.findOne({ _id: invoice.customerId, businessId: req.businessId });
      if (customer) {
        customer.totalPaid = roundMoney(customer.totalPaid + payAmount);
        customer.outstandingBalance = Math.max(0, roundMoney(customer.outstandingBalance - payAmount));
        await customer.save();
      }
    }

    return res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: { payment, invoice },
      error: null,
    });
  } catch (error) {
    console.error("[RecordPayment Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to record payment",
      data: null,
      error: error.message,
    });
  }
};
