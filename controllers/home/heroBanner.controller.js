import { PrismaClient } from "@prisma/client";
import { cloudinary } from "../../config/cloudinary.config.js";
const prisma = new PrismaClient();

// GET /api/hero-banner
export const getHeroBanner = async (req, res) => {
  try {
    const banners = await prisma.heroBanner.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    console.error("Get heroBanner error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch banners" });
  }
};
// PUT /api/hero-banner/:id
export const updateHeroBanner = async (req, res) => {
  const { title, description, id } = req.body;

  try {
    // Fetch existing data for cleanup
    const existingBanner = await prisma.heroBanner.findUnique({
      where: { id },
    });

    if (!existingBanner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    const updatedFields = { title, description };

    if (req.file) {
      try {
        // Delete old image if exists
        if (existingBanner.imagePublicId) {
          await cloudinary.uploader.destroy(existingBanner.imagePublicId);
        }

        // Save new image data
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

    // Update in DB
    const updated = await prisma.heroBanner.update({
      where: { id },
      data: updatedFields,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Update heroBanner error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update banner",
      error: error.message,
    });
  }
};
