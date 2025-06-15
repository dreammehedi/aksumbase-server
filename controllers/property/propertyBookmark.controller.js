import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const addBookmark = async (req, res) => {
  const { propertyId } = req.body;
  const userId = req.userId;

  if (!userId)
    return res.status(400).json({ message: "User ID not found from token." });

  if (!userId || !propertyId) {
    return res.status(400).json({
      success: false,
      message: "Both userId and propertyId are required.",
    });
  }

  try {
    const existing = await prisma.bookmark.findFirst({
      where: { userId, propertyId },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Already bookmarked",
      });
    }

    const bookmark = await prisma.bookmark.create({
      data: { userId, propertyId },
    });

    res.status(200).json({ success: true, data: bookmark });
  } catch (error) {
    console.error("Add bookmark error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to bookmark",
    });
  }
};

export const removeBookmark = async (req, res) => {
  const { propertyId } = req.body;

  const userId = req.userId;

  if (!userId)
    return res.status(400).json({ message: "User ID not found from token." });

  // 1. Check required fields
  if (!userId || !propertyId) {
    return res.status(400).json({
      success: false,
      message: "Both userId and propertyId are required.",
    });
  }

  // 2. Validate MongoDB ObjectId format
  const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);
  if (!isValidObjectId(userId) || !isValidObjectId(propertyId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid userId or propertyId format.",
    });
  }

  try {
    // 3. Check if the bookmark exists
    const existing = await prisma.bookmark.findFirst({
      where: { userId, propertyId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Bookmark not found!",
      });
    }

    // 4. Delete the bookmark
    await prisma.bookmark.delete({
      where: { id: existing.id },
    });

    return res.status(200).json({ success: true, message: "Bookmark removed" });
  } catch (error) {
    console.error("Remove bookmark error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove bookmark",
    });
  }
};

export const getUserBookmarks = async (req, res) => {
  const userId = req.params.userId;

  //   const userId = req.userId;

  // if (!userId)
  //   return res.status(400).json({ message: "User ID not found from token." });

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "userId are required.",
    });
  }
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: { property: true },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, data: bookmarks });
  } catch (error) {
    console.error("Get bookmarks error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to get bookmarks" });
  }
};

export const toggleBookmark = async (req, res) => {
  const { propertyId } = req.body;

  const userId = req.userId;

  if (!userId)
    return res.status(400).json({ message: "User ID not found from token." });

  if (!userId || !propertyId) {
    return res.status(400).json({
      success: false,
      message: "Both userId and propertyId are required.",
    });
  }
  try {
    const existing = await prisma.bookmark.findFirst({
      where: { userId, propertyId },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return res
        .status(200)
        .json({ success: true, message: "Bookmark removed" });
    } else {
      const bookmark = await prisma.bookmark.create({
        data: { userId, propertyId },
      });
      return res
        .status(200)
        .json({ success: true, message: "Bookmark added", data: bookmark });
    }
  } catch (error) {
    console.error("Toggle bookmark error:", error);
    res.status(500).json({ success: false, message: "Toggle bookmark failed" });
  }
};
