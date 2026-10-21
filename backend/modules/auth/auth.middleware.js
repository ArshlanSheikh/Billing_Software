import jwt from "jsonwebtoken";
import { User } from "./auth.model.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing or malformed",
        data: null,
        error: "TOKEN_MISSING",
      });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "super_secret_billing_jwt_token_key_2026_secure";
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.userId).populate("businessId");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User session not found or account was removed",
        data: null,
        error: "USER_NOT_FOUND",
      });
    }

    req.user = user;
    req.businessId = user.businessId._id ? user.businessId._id : user.businessId;
    req.business = user.businessId;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Session expired or invalid token",
      data: null,
      error: error.message,
    });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: insufficient permissions",
        data: null,
        error: "FORBIDDEN",
      });
    }
    next();
  };
};
