import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create Review
export const addReview = async (req, res) => {
  const { propertyId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;

  try {
    const review = await prisma.review.create({
      data: {
        propertyId,
        userId,
        rating: Number(rating),
        comment,
      },
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    console.error("Add Review Error:", error);
    res.status(500).json({ success: false, message: "Failed to add review" });
  }
};

// Update Review
export const updateReview = async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;

  try {
    const existing = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existing || existing.userId !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { rating: Number(rating), comment },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Update Review Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update review" });
  }
};

// Delete Review
export const deleteReview = async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.id;

  try {
    const existing = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existing || existing.userId !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    await prisma.review.delete({ where: { id: reviewId } });

    res.status(200).json({ success: true, message: "Review deleted" });
  } catch (error) {
    console.error("Delete Review Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete review" });
  }
};

// Get all reviews for a property
export const getPropertyReviews = async (req, res) => {
  const { propertyId } = req.params;
  const { page = 1, limit = 10 } = req.pagination;

  try {
    const reviews = await prisma.review.findMany({
      where: { propertyId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    console.error("Get Property Reviews Error:", error);
    res.status(500).json({ success: false, message: "Failed to get reviews" });
  }
};
