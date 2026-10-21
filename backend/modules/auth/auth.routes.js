import { Router } from "express";
import {
  RegisterController,
  LoginController,
  GetProfileController,
  UpdateProfileController,
} from "./auth.controller.js";
import { authenticate } from "./auth.middleware.js";

const router = Router();

router.post("/register", RegisterController);
router.post("/login", LoginController);
router.get("/me", authenticate, GetProfileController);
router.put("/profile", authenticate, UpdateProfileController);

export default router;
