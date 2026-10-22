import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Removes an image from Cloudinary by its public ID.
 * @param {string} publicId - Cloudinary public_id
 * @returns {Promise<any>}
 */
export const deleteImageFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("[Cloudinary Delete Error]:", error.message);
  }
};

/**
 * Uploads an image buffer directly to Cloudinary using a stream.
 * @param {Buffer} fileBuffer - Image buffer from Multer memoryStorage
 * @param {string} folder - Cloudinary folder path
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export const uploadImageToCloudinary = (fileBuffer, folder = "billing_software/products") => {
  return new Promise((resolve, reject) => {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return reject(
        new Error(
          "Cloudinary credentials are missing. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend .env."
        )
      );
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        allowed_formats: ["jpg", "png", "jpeg", "webp", "gif"],
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) {
          console.error("[Cloudinary Upload Error]:", error);
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export default cloudinary;
