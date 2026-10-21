import { Category } from "./category.model.js";

export const GetCategoriesController = async (req, res) => {
  try {
    const categories = await Category.find({ businessId: req.businessId }).sort({ name: 1 });
    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: { categories, total: categories.length },
      error: null,
    });
  } catch (error) {
    console.error("[GetCategories Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      data: null,
      error: error.message,
    });
  }
};

export const CreateCategoryController = async (req, res) => {
  try {
    const comingData = req.body;
    const requiredFields = ["name"];

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

    const { name, description } = comingData;
    const existing = await Category.findOne({
      businessId: req.businessId,
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Category with this name already exists",
        data: null,
        error: "CATEGORY_EXISTS",
      });
    }

    const category = await Category.create({
      businessId: req.businessId,
      name: name.trim(),
      description: description ? description.trim() : "",
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: { category },
      error: null,
    });
  } catch (error) {
    console.error("[CreateCategory Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create category",
      data: null,
      error: error.message,
    });
  }
};

export const UpdateCategoryController = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const category = await Category.findOne({ _id: id, businessId: req.businessId });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
        data: null,
        error: "NOT_FOUND",
      });
    }

    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description.trim();
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: { category },
      error: null,
    });
  } catch (error) {
    console.error("[UpdateCategory Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update category",
      data: null,
      error: error.message,
    });
  }
};

export const DeleteCategoryController = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findOneAndDelete({ _id: id, businessId: req.businessId });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
        data: null,
        error: "NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category removed successfully",
      data: null,
      error: null,
    });
  } catch (error) {
    console.error("[DeleteCategory Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete category",
      data: null,
      error: error.message,
    });
  }
};
