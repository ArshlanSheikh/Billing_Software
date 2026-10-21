import { Invoice } from "./invoice.model.js";
import { Business } from "../business/business.model.js";
import { Customer } from "../customers/customer.model.js";
import { Payment } from "../payments/payment.model.js";
import { calculateInvoiceFinancials, roundMoney } from "./invoice.utils.js";

export const GetNextInvoiceNumberController = async (req, res) => {
  try {
    const business = await Business.findById(req.businessId);
    const prefix = business?.invoiceSettings?.prefix || "INV-";
    const currentNum = business?.invoiceSettings?.currentNumber || 0;
    const startNum = business?.invoiceSettings?.startingNumber || 1;

    const nextCount = Math.max(startNum, currentNum + 1);
    const padded = String(nextCount).padStart(4, "0");
    const nextInvoiceNumber = `${prefix}${padded}`;

    return res.status(200).json({
      success: true,
      message: "Next invoice number generated",
      data: { nextInvoiceNumber, nextSequence: nextCount },
      error: null,
    });
  } catch (error) {
    console.error("[GetNextInvoiceNumber Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate invoice number",
      data: null,
      error: error.message,
    });
  }
};

export const CreateInvoiceController = async (req, res) => {
  try {
    const comingData = req.body;
    const {
      invoiceNumber,
      invoiceDate,
      dueDate,
      customerId,
      customerDetails,
      items,
      invoiceDiscount,
      paymentMethod,
      amountReceived,
      notes,
      termsAndConditions,
      isDraft,
    } = comingData;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invoice must contain at least one item",
        data: null,
        error: ["items"],
      });
    }

    // Zero-trust backend recalculation
    const calculated = calculateInvoiceFinancials(items, invoiceDiscount);
    const {
      verifiedItems,
      subtotal,
      itemDiscountTotal,
      invoiceDiscount: verifiedInvoiceDiscount,
      taxableAmount,
      taxTotal,
      grandTotal,
    } = calculated;

    // Check duplicate invoice number
    let finalInvoiceNumber = invoiceNumber ? invoiceNumber.trim() : "";
    if (!finalInvoiceNumber) {
      const business = await Business.findById(req.businessId);
      const prefix = business?.invoiceSettings?.prefix || "INV-";
      const currentNum = business?.invoiceSettings?.currentNumber || 0;
      const startNum = business?.invoiceSettings?.startingNumber || 1;
      const nextCount = Math.max(startNum, currentNum + 1);
      finalInvoiceNumber = `${prefix}${String(nextCount).padStart(4, "0")}`;
    }

    const existing = await Invoice.findOne({
      businessId: req.businessId,
      invoiceNumber: finalInvoiceNumber,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Invoice number ${finalInvoiceNumber} is already in use. Please use a unique number.`,
        data: null,
        error: "DUPLICATE_INVOICE_NUMBER",
      });
    }

    // Determine payment amounts
    const received = roundMoney(Number(amountReceived) || 0);
    let amountPaid = 0;
    let balanceDue = grandTotal;
    let paymentStatus = "UNPAID";

    if (received >= grandTotal) {
      amountPaid = grandTotal;
      balanceDue = 0;
      paymentStatus = "PAID";
    } else if (received > 0) {
      amountPaid = received;
      balanceDue = roundMoney(grandTotal - received);
      paymentStatus = "PARTIALLY_PAID";
    }

    // Customer Snapshot
    let customerSnapshot = {
      name: "Walk-in Customer",
      phone: "",
      email: "",
      address: "",
      gstin: "",
    };

    let targetCustomer = null;
    if (customerId) {
      targetCustomer = await Customer.findOne({ _id: customerId, businessId: req.businessId });
      if (targetCustomer) {
        customerSnapshot = {
          name: targetCustomer.name,
          phone: targetCustomer.phone || "",
          email: targetCustomer.email || "",
          address: targetCustomer.address || "",
          gstin: targetCustomer.gstin || "",
        };
      }
    } else if (customerDetails && customerDetails.name) {
      customerSnapshot = {
        name: customerDetails.name.trim(),
        phone: customerDetails.phone ? customerDetails.phone.trim() : "",
        email: customerDetails.email ? customerDetails.email.trim() : "",
        address: customerDetails.address ? customerDetails.address.trim() : "",
        gstin: customerDetails.gstin ? customerDetails.gstin.trim() : "",
      };
    }

    // Create Invoice
    const invoice = await Invoice.create({
      businessId: req.businessId,
      createdBy: req.user._id,
      invoiceNumber: finalInvoiceNumber,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      customerId: targetCustomer ? targetCustomer._id : null,
      customerSnapshot,
      items: verifiedItems,
      subtotal,
      itemDiscountTotal,
      invoiceDiscount: verifiedInvoiceDiscount,
      taxableAmount,
      taxTotal,
      grandTotal,
      amountPaid,
      balanceDue,
      paymentStatus,
      paymentMethod: paymentMethod || "CASH",
      status: isDraft ? "DRAFT" : "COMPLETED",
      notes: notes ? notes.trim() : "",
      termsAndConditions: termsAndConditions ? termsAndConditions.trim() : "",
    });

    // Record initial Payment if amount paid > 0 and not draft
    let initialPayment = null;
    if (amountPaid > 0 && !isDraft) {
      initialPayment = await Payment.create({
        businessId: req.businessId,
        invoiceId: invoice._id,
        customerId: targetCustomer ? targetCustomer._id : null,
        amount: amountPaid,
        paymentDate: invoice.invoiceDate,
        paymentMethod: paymentMethod || "CASH",
        referenceNumber: comingData.referenceNumber || "",
        notes: `Initial payment at billing for invoice ${invoice.invoiceNumber}`,
        recordedBy: req.user._id,
      });
    }

    // Update Customer financial totals
    if (targetCustomer && !isDraft) {
      targetCustomer.totalBilled = roundMoney(targetCustomer.totalBilled + grandTotal);
      targetCustomer.totalPaid = roundMoney(targetCustomer.totalPaid + amountPaid);
      targetCustomer.outstandingBalance = roundMoney(targetCustomer.outstandingBalance + balanceDue);
      await targetCustomer.save();
    }

    // Increment Business sequence number
    await Business.findByIdAndUpdate(req.businessId, {
      $inc: { "invoiceSettings.currentNumber": 1 },
    });

    return res.status(201).json({
      success: true,
      message: isDraft ? "Invoice draft saved successfully" : "Invoice created and sale completed successfully",
      data: { invoice, payment: initialPayment },
      error: null,
    });
  } catch (error) {
    console.error("[CreateInvoice Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create invoice",
      data: null,
      error: error.message,
    });
  }
};

export const GetInvoicesController = async (req, res) => {
  try {
    const { search, paymentStatus, status, startDate, endDate, customerId } = req.query;
    const filter = { businessId: req.businessId };

    if (paymentStatus && paymentStatus !== "ALL") {
      filter.paymentStatus = paymentStatus;
    }

    if (status && status !== "ALL") {
      filter.status = status;
    }

    if (customerId) {
      filter.customerId = customerId;
    }

    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.invoiceDate.$lte = end;
      }
    }

    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { invoiceNumber: regex },
        { "customerSnapshot.name": regex },
        { "customerSnapshot.phone": regex },
      ];
    }

    const invoices = await Invoice.find(filter)
      .sort({ invoiceDate: -1, createdAt: -1 })
      .populate("customerId", "name phone email");

    return res.status(200).json({
      success: true,
      message: "Invoices fetched successfully",
      data: { invoices, total: invoices.length },
      error: null,
    });
  } catch (error) {
    console.error("[GetInvoices Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
      data: null,
      error: error.message,
    });
  }
};

export const GetInvoiceByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findOne({ _id: id, businessId: req.businessId })
      .populate("customerId")
      .populate("createdBy", "name email");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
        data: null,
        error: "NOT_FOUND",
      });
    }

    const payments = await Payment.find({ invoiceId: invoice._id, businessId: req.businessId }).sort({
      paymentDate: -1,
    });

    const business = await Business.findById(req.businessId);

    return res.status(200).json({
      success: true,
      message: "Invoice retrieved successfully",
      data: { invoice, payments, business },
      error: null,
    });
  } catch (error) {
    console.error("[GetInvoiceById Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve invoice",
      data: null,
      error: error.message,
    });
  }
};

export const CancelInvoiceController = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const invoice = await Invoice.findOne({ _id: id, businessId: req.businessId });
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
        data: null,
        error: "NOT_FOUND",
      });
    }

    if (invoice.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Invoice is already cancelled",
        data: null,
        error: "ALREADY_CANCELLED",
      });
    }

    // Reverse customer balance if linked and invoice was completed
    if (invoice.customerId && invoice.status === "COMPLETED") {
      const customer = await Customer.findOne({ _id: invoice.customerId, businessId: req.businessId });
      if (customer) {
        customer.totalBilled = Math.max(0, roundMoney(customer.totalBilled - invoice.grandTotal));
        customer.totalPaid = Math.max(0, roundMoney(customer.totalPaid - invoice.amountPaid));
        customer.outstandingBalance = Math.max(0, roundMoney(customer.outstandingBalance - invoice.balanceDue));
        await customer.save();
      }
    }

    invoice.status = "CANCELLED";
    invoice.cancellationReason = reason ? reason.trim() : "Cancelled by user";
    invoice.cancelledAt = new Date();
    invoice.cancelledBy = req.user._id;
    await invoice.save();

    return res.status(200).json({
      success: true,
      message: "Invoice has been cancelled and financial records updated",
      data: { invoice },
      error: null,
    });
  } catch (error) {
    console.error("[CancelInvoice Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel invoice",
      data: null,
      error: error.message,
    });
  }
};
