import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const addReview = async (req, res) => {
  try {
    const reviewerId = req.userId; // set by verifyToken middleware
    if (!reviewerId) {
      return res.status(400).json({ error: "User id not found." });
    }

    const { targetUserId, rating, comment } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: "Review target user is required." });
    }

    if (reviewerId === targetUserId) {
      return res.status(400).json({ error: "You cannot review yourself." });
    }

    const parsedRating = parseInt(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res
        .status(400)
        .json({ error: "Rating must be a number between 1 and 5." });
    }

    // Check if reviewer exists
    const reviewer = await prisma.user.findUnique({
      where: { id: reviewerId },
    });
    if (!reviewer) {
      return res.status(404).json({ error: "Reviewer not found." });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) {
      return res.status(404).json({ error: "Target user not found." });
    }

    // Prevent duplicate review
    const existingReview = await prisma.review.findUnique({
      where: {
        reviewerId_targetUserId: {
          reviewerId,
          targetUserId,
        },
      },
    });

    if (existingReview) {
      return res.status(409).json({ error: "You already reviewed this user." });
    }

    const review = await prisma.review.create({
      data: {
        reviewerId,
        targetUserId,
        rating: parsedRating,
        comment,
      },
    });

    res.status(201).json({ message: "Review submitted.", review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add review." });
  }
};

export const updateReview = async (req, res) => {
  try {
    const reviewerId = req.userId;
    const { rating, comment, id } = req.body;

    // Validate review ID
    if (!id) {
      return res.status(400).json({ error: "Review ID is required." });
    }

    // Validate rating
    const parsedRating = parseInt(rating);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }

    // Check review exists
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return res.status(404).json({ error: "Review not found." });
    }

    // Check permission
    if (review.reviewerId !== reviewerId) {
      return res
        .status(403)
        .json({ error: "You can only update your own review." });
    }

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        rating: parsedRating,
        comment,
      },
    });

    res.json({ message: "Review updated.", review: updatedReview });
  } catch (error) {
    console.error("Review Update Error:", error);
    res.status(500).json({ error: "Failed to update review." });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const reviewerId = req.userId;
    const { id } = req.params;

    const review = await prisma.review.findUnique({ where: { id } });

    if (!review) {
      return res.status(404).json({ error: "Review not found." });
    }

    if (review.reviewerId !== reviewerId) {
      return res
        .status(403)
        .json({ error: "You can only delete your own review." });
    }

    await prisma.review.delete({ where: { id } });

    res.json({ message: "Review deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete review." });
  }
};

export const deleteReviewByAdmin = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Get the current user (the one trying to delete)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isAdmin: true },
    });

    if (!currentUser || !currentUser.isAdmin) {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    // Check if the review exists
    const review = await prisma.review.findUnique({ where: { id } });

    if (!review) {
      return res.status(404).json({ error: "Review not found." });
    }

    await prisma.review.delete({ where: { id } });

    res.json({ message: "Review deleted successfully." });
  } catch (error) {
    console.error("deleteReviewByAdmin error:", error);
    res.status(500).json({ error: "Failed to delete review." });
  }
};

export const getUserReviews = async (req, res) => {
  try {
    const { targetUserId, search = "", rating } = req.query;
    const { skip = 0, limit = 10 } = req.pagination || {};

    // Base where filter
    let where = {};

    if (targetUserId) {
      where.targetUserId = targetUserId;
    }

    if (rating) {
      const parsedRating = parseInt(rating);
      if (!isNaN(parsedRating) && parsedRating >= 1 && parsedRating <= 5) {
        where.rating = parsedRating;
      }
    }

    // Fetch reviews
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          reviewer: {
            select: {
              id: true,
              username: true,
              email: true,
              avatar: true,
              address: true,
              city: true,
              state: true,
              zipCode: true,
              phone: true,
            },
          },
          targetUser: {
            select: {
              id: true,
              username: true,
              email: true,
              avatar: true,
              address: true,
              city: true,
              state: true,
              zipCode: true,
              phone: true,
            },
          },
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.count({ where }),
    ]);

    // Filter by search (on reviewer info)
    const filteredReviews = reviews.filter((r) => {
      const s = search.toLowerCase();
      const { username, email, address, city, state, zipCode } = r.reviewer;

      return (
        username?.toLowerCase().includes(s) ||
        email?.toLowerCase().includes(s) ||
        address?.toLowerCase().includes(s) ||
        city?.toLowerCase().includes(s) ||
        state?.toLowerCase().includes(s) ||
        zipCode?.toLowerCase().includes(s)
      );
    });

    res.json({
      data: search ? filteredReviews : reviews,
      pagination: {
        total: search ? filteredReviews.length : total,
        skip: Number(skip),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("getUserReviews error:", error);
    res.status(500).json({ error: "Failed to fetch reviews." });
  }
};

export const getReviewsGivenByUser = async (req, res) => {
  try {
    const reviewerId = req.userId;
    const { search = "" } = req.query;
    let { skip = 0, limit = 10 } = req.pagination || {};

    // Ensure skip/limit are integers
    skip = parseInt(skip);
    limit = parseInt(limit);

    if (!reviewerId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: User ID not found." });
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { reviewerId },
        include: {
          targetUser: {
            select: {
              id: true,
              username: true,
              avatar: true,
              email: true,
              address: true,
              city: true,
              state: true,
              zipCode: true,
              phone: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.count({ where: { reviewerId } }),
    ]);

    // Optional: search filter on targetUser fields
    const filteredReviews = reviews.filter((r) => {
      const s = search.toLowerCase();
      const user = r.targetUser || {};
      return (
        user.username?.toLowerCase().includes(s) ||
        user.email?.toLowerCase().includes(s) ||
        user.address?.toLowerCase().includes(s) ||
        user.city?.toLowerCase().includes(s) ||
        user.state?.toLowerCase().includes(s) ||
        user.zipCode?.toLowerCase().includes(s) ||
        user.phone?.toLowerCase().includes(s)
      );
    });

    res.status(200).json({
      data: search ? filteredReviews : reviews,
      pagination: {
        total: search ? filteredReviews.length : total,
        skip,
        limit,
      },
    });
  } catch (error) {
    console.error("getReviewsGivenByUser error:", error);
    res.status(500).json({ error: "Failed to fetch reviews given by user." });
  }
};

export const getReviewsReceivedByUser = async (req, res) => {
  try {
    const targetUserId = req.userId;
    const { search = "" } = req.query;
    let { skip = 0, limit = 10 } = req.pagination || {};

    // Ensure valid pagination values
    skip = parseInt(skip);
    limit = parseInt(limit);

    if (!targetUserId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: User ID not found." });
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { targetUserId },
        include: {
          reviewer: {
            select: {
              id: true,
              username: true,
              email: true,
              avatar: true,
              address: true,
              city: true,
              state: true,
              zipCode: true,
              phone: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.count({ where: { targetUserId } }),
    ]);

    // Optional: apply search filtering (on reviewer info)
    const filteredReviews = reviews.filter((r) => {
      const s = search.toLowerCase();
      const u = r.reviewer || {};
      return (
        u.username?.toLowerCase().includes(s) ||
        u.email?.toLowerCase().includes(s) ||
        u.address?.toLowerCase().includes(s) ||
        u.city?.toLowerCase().includes(s) ||
        u.state?.toLowerCase().includes(s) ||
        u.zipCode?.toLowerCase().includes(s) ||
        u.phone?.toLowerCase().includes(s)
      );
    });

    res.status(200).json({
      data: search ? filteredReviews : reviews,
      pagination: {
        total: search ? filteredReviews.length : total,
        skip,
        limit,
      },
    });
  } catch (error) {
    console.error("getReviewsReceivedByUser error:", error);
    res.status(500).json({
      error: "Failed to fetch reviews received by user.",
    });
  }
};
