import { Product } from "./product.model.js";
import cloudinary from "../../config/cloudinary.js";
import {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
} from "../../config/cloudinary.js";



export const GetProductsController = async (req, res) => {
  try {
    const { search, category, isActive } = req.query;
    const filter = { businessId: req.businessId };

    if (isActive !== undefined && isActive !== "all") {
      filter.isActive = isActive === "true";
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: regex },
        { sku: regex },
        { barcode: regex },
        { brand: regex },
        { category: regex },
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: { products, total: products.length },
      error: null,
    });
  } catch (error) {
    console.error("[GetProducts Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      data: null,
      error: error.message,
    });
  }
};

export const SearchProductsController = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === "") {
      const activeProducts = await Product.find({ businessId: req.businessId, isActive: true })
        .limit(30)
        .sort({ name: 1 });
      return res.status(200).json({
        success: true,
        message: "Default products returned",
        data: { products: activeProducts },
        error: null,
      });
    }

    const regex = new RegExp(query.trim(), "i");
    const products = await Product.find({
      businessId: req.businessId,
      isActive: true,
      $or: [
        { name: regex },
        { sku: regex },
        { barcode: regex },
        { brand: regex },
        { category: regex },
      ],
    })
      .limit(30)
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      message: "Products search completed",
      data: { products },
      error: null,
    });
  } catch (error) {
    console.error("[SearchProducts Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search products",
      data: null,
      error: error.message,
    });
  }
};

export const GetProductByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id, businessId: req.businessId });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
        data: null,
        error: "NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product details retrieved",
      data: { product },
      error: null,
    });
  } catch (error) {
    console.error("[GetProductById Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve product details",
      data: null,
      error: error.message,
    });
  }
};

export const UploadProductImageController = async (req, res) => {
  try {

    console.log("[UploadProductImageController] request hit .....");

    console.log("req.file", req.file);
    console.log("req.body", req.body);
    console.log("req.businessId", req.businessId);


    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
        data: null,
        error: "NO_FILE",
      });
    }

    const { oldPublicId } = req.body;

    const result = await uploadImageToCloudinary(req.file.buffer);

    // If a previous publicId was provided, remove it from Cloudinary
    if (oldPublicId && typeof oldPublicId === "string" && oldPublicId.trim() !== "") {
      await deleteImageFromCloudinary(oldPublicId.trim());
    }

    return res.status(200).json({
      success: true,
      message: "Product image uploaded successfully",
      data: {
        imageUrl: result.secure_url,
        imagePublicId: result.public_id,
      },
      error: null,
    });
  } catch (error) {
    console.error("[UploadProductImage Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload image to Cloudinary",
      data: null,
      error: error.message,
    });
  }
};

export const CreateProductController = async (req, res) => {
  try {
    const comingData = req.body;
    const requiredFields = ["name", "sellingPrice"];

    const missingFields = requiredFields.filter((item) => {
      return (
        comingData[item] === null ||
        comingData[item] === undefined ||
        (typeof comingData[item] === "string" && comingData[item].trim() === "")
      );
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
        data: null,
        error: missingFields,
      });
    }

    const {
      name,
      sku,
      barcode,
      brand,
      hsnCode,
      description,
      category,
      sellingPrice,
      mrp,
      purchasePrice,
      unit,
      taxRate,
      imageUrl,
      imagePublicId,
    } = comingData;

    // Check SKU uniqueness if provided
    if (sku && sku.trim() !== "") {
      const existingSku = await Product.findOne({
        businessId: req.businessId,
        sku: sku.trim(),
      });
      if (existingSku) {
        return res.status(409).json({
          success: false,
          message: "A product with this SKU already exists",
          data: null,
          error: "SKU_EXISTS",
        });
      }
    }

    const product = await Product.create({
      businessId: req.businessId,
      name: name.trim(),
      sku: sku ? sku.trim() : "",
      barcode: barcode ? barcode.trim() : "",
      brand: brand ? brand.trim() : "",
      hsnCode: hsnCode ? hsnCode.trim() : "",
      description: description ? description.trim() : "",
      category: category ? category.trim() : "General",
      sellingPrice: Number(sellingPrice),
      mrp: mrp !== undefined && mrp !== "" ? Number(mrp) : 0,
      purchasePrice: purchasePrice !== undefined && purchasePrice !== "" ? Number(purchasePrice) : 0,
      unit: unit ? unit.trim().toLowerCase() : "piece",
      taxRate: taxRate !== undefined ? Number(taxRate) : 0,
      imageUrl: imageUrl ? imageUrl.trim() : "",
      imagePublicId: imagePublicId ? imagePublicId.trim() : "",
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: { product },
      error: null,
    });
  } catch (error) {
    console.error("[CreateProduct Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create product",
      data: null,
      error: error.message,
    });
  }
};

export const UpdateProductController = async (req, res) => {
  try {
    const { id } = req.params;
    const comingData = req.body;

    const product = await Product.findOne({ _id: id, businessId: req.businessId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
        data: null,
        error: "NOT_FOUND",
      });
    }

    // Check SKU collision if SKU changed
    if (comingData.sku && comingData.sku.trim() !== product.sku) {
      const existingSku = await Product.findOne({
        businessId: req.businessId,
        sku: comingData.sku.trim(),
        _id: { $ne: id },
      });
      if (existingSku) {
        return res.status(409).json({
          success: false,
          message: "Another product with this SKU already exists",
          data: null,
          error: "SKU_EXISTS",
        });
      }
    }

    // Remove old Cloudinary image if it was replaced or removed
    if (
      comingData.imagePublicId !== undefined &&
      product.imagePublicId &&
      product.imagePublicId !== comingData.imagePublicId
    ) {
      await deleteImageFromCloudinary(product.imagePublicId);
    }

    const fields = [
      "name",
      "sku",
      "barcode",
      "brand",
      "hsnCode",
      "description",
      "category",
      "sellingPrice",
      "mrp",
      "purchasePrice",
      "unit",
      "taxRate",
      "imageUrl",
      "imagePublicId",
      "isActive",
    ];

    fields.forEach((field) => {
      if (comingData[field] !== undefined) {
        if (
          field === "sellingPrice" ||
          field === "mrp" ||
          field === "purchasePrice" ||
          field === "taxRate"
        ) {
          product[field] = Number(comingData[field]);
        } else if (typeof comingData[field] === "string") {
          product[field] = comingData[field].trim();
        } else {
          product[field] = comingData[field];
        }
      }
    });

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: { product },
      error: null,
    });
  } catch (error) {
    console.error("[UpdateProduct Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      data: null,
      error: error.message,
    });
  }
};

export const DeleteProductController = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.findOneAndDelete({ _id: id, businessId: req.businessId });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
        data: null,
        error: "NOT_FOUND",
      });
    }

    // If product had a Cloudinary image, clean it up
    if (deleted.imagePublicId) {
      await deleteImageFromCloudinary(deleted.imagePublicId);
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: null,
      error: null,
    });
  } catch (error) {
    console.error("[DeleteProduct Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
      data: null,
      error: error.message,
    });
  }
};
