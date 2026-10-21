import { Business } from "./business.model.js";

export const GetCurrentBusinessController = async (req, res) => {
  try {
    const business = await Business.findById(req.businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
        data: null,
        error: "NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Business details retrieved successfully",
      data: { business },
      error: null,
    });
  } catch (error) {
    console.error("[Business GetCurrent Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error fetching business profile",
      data: null,
      error: error.message,
    });
  }
};

export const UpdateBusinessSettingsController = async (req, res) => {
  try {
    const comingData = req.body;

    const allowedUpdates = [
      "name",
      "type",
      "ownerName",
      "phone",
      "email",
      "address",
      "gstin",
      "logoUrl",
      "currency",
      "invoiceSettings",
      "taxSettings",
      "isConfigured",
    ];

    const updatePayload = {};
    for (const key of allowedUpdates) {
      if (comingData[key] !== undefined) {
        updatePayload[key] = comingData[key];
      }
    }

    // Mark as configured if basic business information is saved
    if (comingData.name && comingData.ownerName) {
      updatePayload.isConfigured = true;
    }

    const updatedBusiness = await Business.findByIdAndUpdate(
      req.businessId,
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    if (!updatedBusiness) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
        data: null,
        error: "NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Business settings updated successfully",
      data: { business: updatedBusiness },
      error: null,
    });
  } catch (error) {
    console.error("[Business Update Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error updating business settings",
      data: null,
      error: error.message,
    });
  }
};
