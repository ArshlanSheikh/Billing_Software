import jwt from "jsonwebtoken";
import { User } from "./auth.model.js";
import { Business } from "../business/business.model.js";

const generateToken = (userId, businessId) => {
  const secret = process.env.JWT_SECRET || "super_secret_billing_jwt_token_key_2026_secure";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign({ userId, businessId }, secret, { expiresIn });
};

export const RegisterController = async (req, res) => {
  try {
    const comingData = req.body;
    const requiredFields = ["name", "email", "password", "businessName"];

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

    const { name, email, password, businessName, businessType, phone } = comingData;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists",
        data: null,
        error: "EMAIL_ALREADY_EXISTS",
      });
    }

    // Create Business entity
    const newBusiness = await Business.create({
      name: businessName.trim(),
      type: businessType ? businessType.trim() : "Retail",
      ownerName: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : "",
    });

    // Create Admin User
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: "admin",
      businessId: newBusiness._id,
    });

    const token = generateToken(newUser._id, newBusiness._id);

    return res.status(201).json({
      success: true,
      message: "Account and business created successfully",
      data: {
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
        business: newBusiness,
      },
      error: null,
    });
  } catch (error) {
    console.error("[Auth Register Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred during registration",
      data: null,
      error: error.message,
    });
  }
};

export const LoginController = async (req, res) => {
  try {
    const comingData = req.body;
    const requiredFields = ["email", "password"];

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

    const { email, password } = comingData;

    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate("businessId");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        data: null,
        error: "INVALID_CREDENTIALS",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        data: null,
        error: "INVALID_CREDENTIALS",
      });
    }

    const token = generateToken(user._id, user.businessId._id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        business: user.businessId,
      },
      error: null,
    });
  } catch (error) {
    console.error("[Auth Login Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred during login",
      data: null,
      error: error.message,
    });
  }
};

export const GetProfileController = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },
        business: req.business,
      },
      error: null,
    });
  } catch (error) {
    console.error("[Auth Profile Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user profile",
      data: null,
      error: error.message,
    });
  }
};

export const UpdateProfileController = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Name field cannot be empty",
        data: null,
        error: ["name"],
      });
    }

    req.user.name = name.trim();
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },
      },
      error: null,
    });
  } catch (error) {
    console.error("[Auth Update Profile Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      data: null,
      error: error.message,
    });
  }
};
