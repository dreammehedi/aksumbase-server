import { PrismaClient } from "@prisma/client";
import { cloudinary } from "../../config/cloudinary.config.js";

const prisma = new PrismaClient();

/**
 * GET /sell-types
 * Public - Fetch all sell types
 */
export const getSellTypes = async (req, res) => {
  try {
    const data = await prisma.sellTypes.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get sell types error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sell types",
      error: error.message,
    });
  }
};

/**
 * PUT /sell-types/:id
 * Admin - Update a sell type by ID
 */
export const updateSellType = async (req, res) => {
  const { id } = req.params;
  const { title, description, items } = req.body;

  try {
    const existing = await prisma.sellTypes.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Sell type not found",
      });
    }

    const newImage = req.file;

    if (newImage && existing.imagePublicId) {
      await cloudinary.uploader.destroy(existing.imagePublicId);
    }

    const parsedItems = typeof items === "string" ? JSON.parse(items) : items;

    const updated = await prisma.sellTypes.update({
      where: { id },
      data: {
        title: title || existing.title,
        description: description || existing.description,
        items: parsedItems || existing.items,
        image: newImage?.path || existing.image,
        imagePublicId: newImage?.filename || existing.imagePublicId,
      },
    });

    res.status(200).json({
      success: true,
      message: "Sell type updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update sell type error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update sell type",
      error: error.message,
    });
  }
};
