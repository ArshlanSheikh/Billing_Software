import { Router } from "express";
import {
  GetProductsController,
  SearchProductsController,
  GetProductByIdController,
  CreateProductController,
  UpdateProductController,
  DeleteProductController,
} from "./product.controller.js";
import { authenticate } from "../auth/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", GetProductsController);
router.get("/search", SearchProductsController);
router.get("/:id", GetProductByIdController);
router.post("/", CreateProductController);
router.put("/:id", UpdateProductController);
router.delete("/:id", DeleteProductController);

export default router;
