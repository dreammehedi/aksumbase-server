import { v2 as cloudinary } from 'cloudinary';
import { createError } from './error.js';

export const uploadToCloudinary = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      resource_type: "auto",
      folder: "your_app_name"
    });
    return result;
  } catch (error) {
    throw createError(500, "Error uploading to Cloudinary");
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw createError(500, "Error deleting from Cloudinary");
  }
};

export default cloudinary;