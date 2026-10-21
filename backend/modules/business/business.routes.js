import { Router } from "express";
import {
  GetCurrentBusinessController,
  UpdateBusinessSettingsController,
} from "./business.controller.js";
import { authenticate } from "../auth/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/current", GetCurrentBusinessController);
router.put("/settings", UpdateBusinessSettingsController);

export default router;
