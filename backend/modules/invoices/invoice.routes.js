import { Router } from "express";
import {
  GetNextInvoiceNumberController,
  CreateInvoiceController,
  GetInvoicesController,
  GetInvoiceByIdController,
  CancelInvoiceController,
} from "./invoice.controller.js";
import { authenticate } from "../auth/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/next-number", GetNextInvoiceNumberController);
router.get("/", GetInvoicesController);
router.get("/:id", GetInvoiceByIdController);
router.post("/", CreateInvoiceController);
router.post("/:id/cancel", CancelInvoiceController);

export default router;
