import { Customer } from "./customer.model.js";

export const GetCustomersController = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { businessId: req.businessId, isActive: true };

    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [{ name: regex }, { phone: regex }, { email: regex }, { gstin: regex }];
    }

    const customers = await Customer.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Customers fetched successfully",
      data: { customers, total: customers.length },
      error: null,
    });
  } catch (error) {
    console.error("[GetCustomers Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      data: null,
      error: error.message,
    });
  }
};

export const GetCustomerByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findOne({ _id: id, businessId: req.businessId });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
        data: null,
        error: "NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer retrieved successfully",
      data: { customer },
      error: null,
    });
  } catch (error) {
    console.error("[GetCustomerById Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
      data: null,
      error: error.message,
    });
  }
};

export const CreateCustomerController = async (req, res) => {
  try {
    const comingData = req.body;
    const requiredFields = ["name"];

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

    const { name, phone, email, address, gstin, notes } = comingData;

    // If phone is provided, check if already exists for this business
    if (phone && phone.trim() !== "") {
      const existing = await Customer.findOne({
        businessId: req.businessId,
        phone: phone.trim(),
        isActive: true,
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "A customer with this phone number already exists",
          data: { customer: existing },
          error: "PHONE_EXISTS",
        });
      }
    }

    const customer = await Customer.create({
      businessId: req.businessId,
      name: name.trim(),
      phone: phone ? phone.trim() : "",
      email: email ? email.trim().toLowerCase() : "",
      address: address ? address.trim() : "",
      gstin: gstin ? gstin.trim().toUpperCase() : "",
      notes: notes ? notes.trim() : "",
    });

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: { customer },
      error: null,
    });
  } catch (error) {
    console.error("[CreateCustomer Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create customer",
      data: null,
      error: error.message,
    });
  }
};

export const UpdateCustomerController = async (req, res) => {
  try {
    const { id } = req.params;
    const comingData = req.body;

    const customer = await Customer.findOne({ _id: id, businessId: req.businessId });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
        data: null,
        error: "NOT_FOUND",
      });
    }

    const allowedFields = ["name", "phone", "email", "address", "gstin", "notes"];
    allowedFields.forEach((field) => {
      if (comingData[field] !== undefined) {
        customer[field] = typeof comingData[field] === "string" ? comingData[field].trim() : comingData[field];
      }
    });

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: { customer },
      error: null,
    });
  } catch (error) {
    console.error("[UpdateCustomer Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update customer",
      data: null,
      error: error.message,
    });
  }
};

export const DeleteCustomerController = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findOne({ _id: id, businessId: req.businessId });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
        data: null,
        error: "NOT_FOUND",
      });
    }

    // Soft delete so historical invoices referencing this customer are not broken
    customer.isActive = false;
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
      data: null,
      error: null,
    });
  } catch (error) {
    console.error("[DeleteCustomer Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete customer",
      data: null,
      error: error.message,
    });
  }
};
