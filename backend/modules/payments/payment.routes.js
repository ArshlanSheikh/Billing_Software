import { Router } from "express";
import {
  GetPaymentsController,
  RecordPaymentController,
} from "./payment.controller.js";
import { authenticate } from "../auth/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", GetPaymentsController);
router.post("/", RecordPaymentController);

export default router;
