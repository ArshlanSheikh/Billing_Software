import { Product } from "./product.model.js";

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
      filter.$or = [{ name: regex }, { sku: regex }, { category: regex }];
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
        .limit(20)
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
      $or: [{ name: regex }, { sku: regex }, { category: regex }],
    })
      .limit(20)
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
      description,
      category,
      sellingPrice,
      purchasePrice,
      unit,
      taxRate,
      imageUrl,
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
      description: description ? description.trim() : "",
      category: category ? category.trim() : "General",
      sellingPrice: Number(sellingPrice),
      purchasePrice: purchasePrice !== undefined ? Number(purchasePrice) : 0,
      unit: unit ? unit.trim().toLowerCase() : "piece",
      taxRate: taxRate !== undefined ? Number(taxRate) : 0,
      imageUrl: imageUrl ? imageUrl.trim() : "",
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

    const fields = [
      "name",
      "sku",
      "description",
      "category",
      "sellingPrice",
      "purchasePrice",
      "unit",
      "taxRate",
      "imageUrl",
      "isActive",
    ];

    fields.forEach((field) => {
      if (comingData[field] !== undefined) {
        if (field === "sellingPrice" || field === "purchasePrice" || field === "taxRate") {
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
    // We can delete or soft-delete. Let's delete if requested, or deactivate.
    const deleted = await Product.findOneAndDelete({ _id: id, businessId: req.businessId });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
        data: null,
        error: "NOT_FOUND",
      });
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
