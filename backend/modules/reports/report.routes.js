import { Router } from "express";
import {
  GetDashboardStatsController,
  GetSalesReportController,
} from "./report.controller.js";
import { authenticate } from "../auth/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/dashboard", GetDashboardStatsController);
router.get("/sales", GetSalesReportController);

export default router;
