import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getReview = async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        user: true,
        post: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: reviews });
  } catch (error) {
    next(error);
  }
};

// Get all reviews with moderation filters
export const getReviews = async (req, res, next) => {
  try {
    const where = {};
    
    // Filter by status
    if (req.query.status) where.status = req.query.status;
    
    // Filter reported reviews
    if (req.query.reported === 'true') {
      where.reportedBy = { isEmpty: false };
    }
    
    // Filter by user or post
    if (req.query.userId) where.userId = req.query.userId;
    if (req.query.postId) where.postId = req.query.postId;

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            reputation: true
          }
        },
        post: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform the data to handle null postId
    const transformedReviews = reviews.map(review => ({
      ...review,
      post: review.post || { id: null, title: 'Deleted Property' }
    }));

    res.json({ success: true, data: transformedReviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    next(error);
  }
};

// Approve review
export const approveReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const review = await prisma.review.update({
      where: { id },
      data: { 
        status: 'approved',
        reportedBy: [], // Clear reports
        reportReason: null
      }
    });

    // Update agent reputation
    await updateAgentReputation(review.postId);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'approve_review',
        reason: 'Review approved by moderator',
        userId: req.userId
      }
    });

    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

// Edit review
export const editReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment, rating } = req.body;

    const review = await prisma.review.update({
      where: { id },
      data: { 
        comment,
        rating,
        status: 'approved' // Reset status after edit
      }
    });

    // Update agent reputation
    await updateAgentReputation(review.postId);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'edit_review',
        reason: 'Review edited by moderator',
        userId: req.userId
      }
    });

    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

// Delete review
export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await prisma.review.findUnique({
      where: { id },
      select: { postId: true }
    });

    await prisma.review.delete({ where: { id } });

    // Update agent reputation
    if (review) {
      await updateAgentReputation(review.postId);
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'delete_review',
        reason: 'Review deleted by moderator',
        userId: req.userId
      }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Report review
export const reportReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, reportReason } = req.body;

    const review = await prisma.review.update({
      where: { id },
      data: {
        reportedBy: { push: userId },
        reportReason,
        status: 'pending' // Reset status when reported
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'report_review',
        reason: `Review reported: ${reportReason}`,
        userId: req.userId
      }
    });

    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

// Helper function to update agent reputation
async function updateAgentReputation(postId) {
  if (!postId) return; // Skip if no postId

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true }
  });

  if (post) {
    const reviews = await prisma.review.findMany({
      where: { 
        postId,
        status: 'approved'
      }
    });

    const avgRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length || 0;

    await prisma.user.update({
      where: { id: post.userId },
      data: { reputation: avgRating }
    });
  }
} 