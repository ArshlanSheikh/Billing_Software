import { Router } from "express";
import {
  GetCustomersController,
  GetCustomerByIdController,
  CreateCustomerController,
  UpdateCustomerController,
  DeleteCustomerController,
} from "./customer.controller.js";
import { authenticate } from "../auth/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", GetCustomersController);
router.get("/:id", GetCustomerByIdController);
router.post("/", CreateCustomerController);
router.put("/:id", UpdateCustomerController);
router.delete("/:id", DeleteCustomerController);

export default router;
