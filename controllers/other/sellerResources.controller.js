import { PrismaClient } from "@prisma/client";
import { cloudinary } from "../../config/cloudinary.config.js";

const prisma = new PrismaClient();

// Get all
export const getSellerResources = async (req, res) => {
  try {
    const data = await prisma.sellerResources.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get seller resources error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch resources" });
  }
};

// Get with pagination and optional search
export const sellerResources = async (req, res) => {
  try {
    const { skip = 0, limit = 10 } = req.pagination || {};
    const search = req.query.search || "";

    const where = {
      title: { contains: search, mode: "insensitive" },
    };

    const data = await prisma.sellerResources.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.sellerResources.count({ where });

    res.status(200).json({
      success: true,
      data,
      pagination: { total, skip: Number(skip), limit: Number(limit) },
    });
  } catch (error) {
    console.error("Pagination seller resources error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch resources" });
  }
};

// export const createSellerResources = async (req, res) => {
//   const { title, description, itemContent } = req.body;

//   try {
//     // Validate required fields
//     if (!title) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Missing required fields" });
//     }

//     // Upload images
//     const image = req.files?.image?.[0];
//     const itemImage = req.files?.itemImage?.[0];

//     // Construct the items array
//     const items = [
//       {
//         itemContent,
//         itemImage: itemImage?.path,
//         itemImagePublicId: itemImage?.filename,
//       },
//     ];

//     const newSellerResources = await prisma.sellerResources.create({
//       data: {
//         title,
//         description,
//         image: image?.path,
//         imagePublicId: image?.filename,
//         items,
//       },
//     });

//     res.status(201).json({ success: true, data: newSellerResources });
//   } catch (error) {
//     console.error("Create seller resource error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to create seller resource",
//       error: error.message,
//     });
//   }
// };

// export const updateSellerResources = async (req, res) => {
//   const { title, description, itemContent, id } = req.body;

//   try {
//     const existingResource = await prisma.sellerResources.findUnique({
//       where: { id },
//     });

//     if (!existingResource) {
//       return res.status(404).json({
//         success: false,
//         message: "Seller resource not found",
//       });
//     }

//     // Handle updated files (optional)
//     const image = req.files?.image?.[0];
//     const itemImage = req.files?.itemImage?.[0];

//     const updatedData = {
//       title: title || existingResource.title,
//       description: description || existingResource.description,
//       image: image?.path || existingResource.image,
//       imagePublicId: image?.filename || existingResource.imagePublicId,
//       items: [
//         {
//           itemContent: itemContent || existingResource.items?.[0]?.itemContent,
//           itemImage: itemImage?.path || existingResource.items?.[0]?.itemImage,
//           itemImagePublicId:
//             itemImage?.filename ||
//             existingResource.items?.[0]?.itemImagePublicId,
//         },
//       ],
//     };

//     const updatedResource = await prisma.sellerResources.update({
//       where: { id },
//       data: updatedData,
//     });

//     res.status(200).json({ success: true, data: updatedResource });
//   } catch (error) {
//     console.error("Update seller resource error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to update seller resource",
//       error: error.message,
//     });
//   }
// };

export const createSellerResources = async (req, res) => {
  const { title, description, itemContents } = req.body;
  // `itemContents` should be an array of strings (content for each item)

  try {
    if (!title) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Main image upload
    const image = req.files?.image?.[0];

    // Multiple item images upload - assume itemImages come as an array of files
    const itemImages = req.files?.itemImage || [];

    // Construct items array
    const items =
      itemContents && Array.isArray(itemContents)
        ? itemContents.map((content, index) => ({
            itemContent: content,
            itemImage: itemImages[index]?.path || null,
            itemImagePublicId: itemImages[index]?.filename || null,
          }))
        : [];

    const newSellerResources = await prisma.sellerResources.create({
      data: {
        title,
        description,
        image: image?.path,
        imagePublicId: image?.filename,
        items,
      },
    });

    res.status(201).json({ success: true, data: newSellerResources });
  } catch (error) {
    console.error("Create seller resource error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create seller resource",
      error: error.message,
    });
  }
};
export const updateSellerResources = async (req, res) => {
  const { title, description, itemContents, id } = req.body;

  try {
    const existingResource = await prisma.sellerResources.findUnique({
      where: { id },
    });

    if (!existingResource) {
      return res.status(404).json({
        success: false,
        message: "Seller resource not found",
      });
    }

    // Parse description safely if it is a string
    const parsedDescription =
      typeof description === "string" ? JSON.parse(description) : description;

    // Parse itemContents safely if it is a string
    const parsedItemContents =
      typeof itemContents === "string"
        ? JSON.parse(itemContents)
        : itemContents;

    // Handle main image update
    const newImage = req.files?.image?.[0];
    if (newImage && existingResource.imagePublicId) {
      await cloudinary.uploader.destroy(existingResource.imagePublicId);
    }

    // Handle item images update
    const newItemImages = req.files?.itemImage || [];

    const updatedItems =
      Array.isArray(parsedItemContents) && parsedItemContents.length > 0
        ? parsedItemContents.map((content, index) => {
            const oldItem = existingResource.items?.[index] || {};

            if (newItemImages[index] && oldItem.itemImagePublicId) {
              cloudinary.uploader.destroy(oldItem.itemImagePublicId);
            }

            return {
              itemContent: content || oldItem.itemContent,
              itemImage: newItemImages[index]?.path || oldItem.itemImage,
              itemImagePublicId:
                newItemImages[index]?.filename || oldItem.itemImagePublicId,
            };
          })
        : existingResource.items || [];

    const updatedResource = await prisma.sellerResources.update({
      where: { id },
      data: {
        title: title || existingResource.title,
        description: parsedDescription || existingResource.description,
        image: newImage?.path || existingResource.image,
        imagePublicId: newImage?.filename || existingResource.imagePublicId,
        items: updatedItems,
      },
    });

    res.status(200).json({ success: true, data: updatedResource });
  } catch (error) {
    console.error("Update seller resource error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update seller resource",
      error: error.message,
    });
  }
};

export const deleteSellerResources = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the resource
    const sellerResource = await prisma.sellerResources.findUnique({
      where: { id },
    });

    if (!sellerResource) {
      return res.status(404).json({
        success: false,
        message: "Seller resource not found",
      });
    }

    // Delete main image from Cloudinary (if exists)
    if (sellerResource.imagePublicId) {
      await cloudinary.uploader.destroy(sellerResource.imagePublicId);
    }

    // Delete item images from Cloudinary
    if (Array.isArray(sellerResource.items)) {
      for (const item of sellerResource.items) {
        if (item.itemImagePublicId) {
          await cloudinary.uploader.destroy(item.itemImagePublicId);
        }
      }
    }

    // Delete resource from database
    await prisma.sellerResources.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Seller resource deleted successfully",
    });
  } catch (error) {
    console.error("Delete seller resource error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete seller resource",
      error: error.message,
    });
  }
};
