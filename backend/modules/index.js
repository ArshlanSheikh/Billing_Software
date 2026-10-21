import { Router } from "express";
import authRoutes from "./auth/auth.routes.js";
import businessRoutes from "./business/business.routes.js";
import categoryRoutes from "./categories/category.routes.js";
import productRoutes from "./products/product.routes.js";
import customerRoutes from "./customers/customer.routes.js";
import invoiceRoutes from "./invoices/invoice.routes.js";
import paymentRoutes from "./payments/payment.routes.js";
import reportRoutes from "./reports/report.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/business", businessRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/customers", customerRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/payments", paymentRoutes);
router.use("/reports", reportRoutes);

export default router;
