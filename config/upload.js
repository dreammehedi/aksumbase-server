import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary } from "./cloudinary.config.js"; // Make sure this uses ES6 export

// Cloudinary storage setup
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let resourceType = "image"; // Default

    if (file.mimetype === "application/pdf") {
      resourceType = "auto";
    } else if (file.mimetype.startsWith("video/")) {
      resourceType = "video";
    } else if (file.mimetype.startsWith("image/")) {
      resourceType = "image";
    }

    return {
      folder: "aksumbase",
      allowed_formats: [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "svg",
        "mp4",
        "avi",
        "mov",
        "mkv",
        "pdf",
      ],
      resource_type: resourceType,
      public_id: `${Date.now()}-${file.originalname}`,
    };
  },
});

// Initialize Multer with limits
const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
});

export { upload };
