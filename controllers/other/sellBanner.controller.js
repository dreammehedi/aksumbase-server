import { PrismaClient } from "@prisma/client";
import { cloudinary } from "../../config/cloudinary.config.js";

const prisma = new PrismaClient();

/**
 * GET /sell-banner
 * Public - Fetch the one and only sell page banner
 */
export const getSellPageBanner = async (req, res) => {
  try {
    const banner = await prisma.sellPageBanner.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "No sell page banner found. Please create one first.",
      });
    }

    res.status(200).json({ success: true, data: banner });
  } catch (error) {
    console.error("Get sell banner error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch banner",
      error: error.message,
    });
  }
};

/**
 * PUT /sell-banner
 * Admin-only - Update the banner (singleton, no ID needed)
 */
export const updateSellPageBanner = async (req, res) => {
  const { title, description } = req.body;

  try {
    const existingBanner = await prisma.sellPageBanner.findFirst();

    if (!existingBanner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found. Please seed it first.",
      });
    }

    // Handle new image upload (form field: image)
    const newImage = req.file;

    // Delete old image from Cloudinary if new one is uploaded
    if (newImage && existingBanner.imagePublicId) {
      await cloudinary.uploader.destroy(existingBanner.imagePublicId);
    }

    const updatedBanner = await prisma.sellPageBanner.update({
      where: { id: existingBanner.id },
      data: {
        title: title || existingBanner.title,
        description: description || existingBanner.description,
        image: newImage?.path || existingBanner.image,
        imagePublicId: newImage?.filename || existingBanner.imagePublicId,
      },
    });

    res.status(200).json({
      success: true,
      message: "Sell page banner updated successfully",
      data: updatedBanner,
    });
  } catch (error) {
    console.error("Update sell banner error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update banner",
      error: error.message,
    });
  }
};
