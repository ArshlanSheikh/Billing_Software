import { Router } from "express";
import {
  GetProductsController,
  SearchProductsController,
  GetProductByIdController,
  CreateProductController,
  UpdateProductController,
  DeleteProductController,
  UploadProductImageController,
} from "./product.controller.js";
import { authenticate } from "../auth/auth.middleware.js";
import { uploadProductImage } from "./upload.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", GetProductsController);
router.get("/search", SearchProductsController);
router.get("/:id", GetProductByIdController);
router.post(
  "/upload-image",
  (req, res, next) => {
    uploadProductImage.single("image")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Failed to process image upload",
          data: null,
          error: "UPLOAD_ERROR",
        });
      }
      next();
    });
  },
  UploadProductImageController
);
router.post("/", CreateProductController);
router.put("/:id", UpdateProductController);
router.delete("/:id", DeleteProductController);

export default router;
