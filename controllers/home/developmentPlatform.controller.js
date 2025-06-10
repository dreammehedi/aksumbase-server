import { PrismaClient } from "@prisma/client";
import { cloudinary } from "../../config/cloudinary.config.js";
const prisma = new PrismaClient();

// GET /api/development-platform
export const getDevelopmentPlatform = async (req, res) => {
  try {
    const banners = await prisma.developmentPlatform.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    console.error("Get development platform error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch development platform ",
    });
  }
};
// PUT /api/development-platform/:id
export const updateDevelopmentPlatform = async (req, res) => {
  const { title, description, iosLink, androidLink, id } = req.body;

  try {
    const existingData = await prisma.developmentPlatform.findUnique({
      where: { id },
    });

    if (!existingData) {
      return res
        .status(404)
        .json({ success: false, message: "Development platform not found" });
    }

    const updatedFields = { title, description, iosLink, androidLink };

    if (req.file) {
      try {
        if (existingData.imagePublicId) {
          await cloudinary.uploader.destroy(existingData.imagePublicId);
        }

        updatedFields.image = req.file.path;
        updatedFields.imagePublicId = req.file.filename;
      } catch (imageError) {
        return res.status(500).json({
          success: false,
          message: "Image update failed",
          error: imageError.message,
        });
      }
    }

    const updated = await prisma.developmentPlatform.update({
      where: { id },
      data: updatedFields,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Update development platform error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update development platform",
      error: error.message,
    });
  }
};
