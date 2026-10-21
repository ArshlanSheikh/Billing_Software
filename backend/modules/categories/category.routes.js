import { Router } from "express";
import {
  GetCategoriesController,
  CreateCategoryController,
  UpdateCategoryController,
  DeleteCategoryController,
} from "./category.controller.js";
import { authenticate } from "../auth/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", GetCategoriesController);
router.post("/", CreateCategoryController);
router.put("/:id", UpdateCategoryController);
router.delete("/:id", DeleteCategoryController);

export default router;
