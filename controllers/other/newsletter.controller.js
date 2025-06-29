// controllers/newsletter.controller.js
import prisma from "../../lib/prisma.js";

/**
 * Handle errors and send proper response
 */
function handleError(res, error) {
  console.error(error);
  res.status(500).json({
    success: false,
    message: error.message || "Internal Server Error",
  });
}

/**
 * Get all newsletters
 */
export const getAllNewsletters = async (req, res) => {
  try {
    const { skip = 0, limit = 10 } = req.pagination || {};
    const { status, segment, type } = req.query;

    let where = {};

    if (status && status !== "All Status") {
      where.status = status;
    }
    if (segment && segment !== "All Segments") {
      where.segment = segment;
    }
    if (type && type !== "All Types") {
      where.type = type;
    }

    // Fetch filtered paginated newsletters
    const data = await prisma.newsletter.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { date: "desc" },
    });

    // Count total matching documents (without pagination)
    const total = await prisma.newsletter.count({ where });

    // === calculate summaries ===
    let totalRecipients = 0;
    let totalOpenRate = 0;
    let totalClickRate = 0;
    let totalUnsubscribeRate = 0;
    let countWithUnsubscribe = 0;

    for (const newsletter of data) {
      totalRecipients += newsletter.recipients || 0;
      totalOpenRate += newsletter.openRate || 0;
      totalClickRate += newsletter.clickRate || 0;
      if (
        newsletter.unsubscribeRate !== null &&
        newsletter.unsubscribeRate !== undefined
      ) {
        totalUnsubscribeRate += newsletter.unsubscribeRate;
        countWithUnsubscribe++;
      }
    }

    const averageOpenRate = data.length > 0 ? totalOpenRate / data.length : 0;
    const averageClickRate = data.length > 0 ? totalClickRate / data.length : 0;
    const averageUnsubscribeRate =
      countWithUnsubscribe > 0
        ? totalUnsubscribeRate / countWithUnsubscribe
        : 0;

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        skip: Number(skip),
        limit: Number(limit),
      },
      summary: {
        totalRecipients,
        averageOpenRate,
        averageClickRate,
        averageUnsubscribeRate,
      },
    });
  } catch (error) {
    console.error("Get newsletters error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch newsletters",
    });
  }
};

/**
 * Create a new newsletter
 */
export const createNewsletter = async (req, res) => {
  try {
    const { title, subject, content, type, segment, status } = req.body;

    // segment অনুযায়ী user count করো
    const recipientsCount = await prisma.user.count({
      where: {
        role: segment,
      },
    });

    const newNewsletter = await prisma.newsletter.create({
      data: {
        title,
        subject,
        content,
        type,
        segment,
        status,
        recipients: recipientsCount,
        openRate: 0,
        clickRate: 0,
      },
    });

    res.status(201).json({
      success: true,
      message: "Newsletter created successfully",
      data: newNewsletter,
    });
  } catch (error) {
    console.error("Create Newsletter Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create newsletter",
    });
  }
};

/**
 * Update a newsletter
 */
export const updateNewsletter = async (req, res) => {
  try {
    const { id } = req.params;
    const { segment } = req.body;

    // Fetch newsletter
    const exist = await prisma.newsletter.findUnique({
      where: { id },
    });

    if (!exist) {
      return res.status(404).json({
        success: false,
        message: "Newsletter not found",
      });
    }

    let recipients = exist.recipients;

    // If segment was updated, re-calculate recipients
    if (segment) {
      recipients = await prisma.user.count({
        where: {
          role: segment,
        },
      });
    }

    // Build data for update, excluding undefined fields
    const updateData = {
      ...req.body,
      recipients,
    };

    if (req.body.date) {
      updateData.date = new Date(req.body.date);
    }

    const updatedNewsletter = await prisma.newsletter.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: "Newsletter updated successfully",
      data: updatedNewsletter,
    });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Delete a newsletter
 */
export const deleteNewsletter = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if exists
    const exist = await prisma.newsletter.findUnique({
      where: { id },
    });

    if (!exist) {
      return res.status(404).json({
        success: false,
        message: "Newsletter not found",
      });
    }

    await prisma.newsletter.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Newsletter deleted successfully",
    });
  } catch (error) {
    handleError(res, error);
  }
};

// controllers/newsletter.controller.js

export const unsubscribeUser = async (req, res) => {
  try {
    const { email, id } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required to unsubscribe",
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Newsletter ID is required to unsubscribe",
      });
    }

    // Check user existence
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Add the newsletter ID to user's unsubscribe list (avoid duplicates)
    const updatedIds = new Set([...(user.unSubscribeNewsletterIds || []), id]);

    // Update user and increment newsletter.unsubscribeRate atomically
    // Using a transaction to keep consistency
    const [updatedUser, updatedNewsletter] = await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: {
          unSubscribeNewsletterIds: Array.from(updatedIds),
        },
      }),
      prisma.newsletter.update({
        where: { id },
        data: {
          unsubscribeRate: {
            increment: 1,
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "You have successfully unsubscribed from the newsletter.",
      data: {
        user: updatedUser,
        newsletter: updatedNewsletter,
      },
    });
  } catch (error) {
    console.error("Unsubscribe User Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to unsubscribe user",
    });
  }
};

export const getUserNewsletters = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Get user role and unSubscribeNewsletterIds
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        unSubscribeNewsletterIds: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Fetch newsletters where segment matches user.role AND id not in unSubscribeNewsletterIds
    const newsletters = await prisma.newsletter.findMany({
      where: {
        segment: user.role,
        id: {
          notIn: user.unSubscribeNewsletterIds || [],
        },
        status: "Sent",
      },
      orderBy: { date: "desc" },
    });

    return res.status(200).json({
      success: true,
      data: newsletters,
    });
  } catch (error) {
    console.error("Get User Newsletters Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch newsletters for user",
    });
  }
};

export const incrementNewsletterOpen = async (req, res) => {
  try {
    const { newsletterIds } = req.body;

    if (!Array.isArray(newsletterIds) || newsletterIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "newsletterIds array is required.",
      });
    }

    // Use a transaction to increment all newsletters efficiently
    await prisma.$transaction(
      newsletterIds.map((id) =>
        prisma.newsletter.update({
          where: { id },
          data: {
            openRate: {
              increment: 1,
            },
          },
        })
      )
    );

    return res.status(200).json({
      success: true,
      message: "Open rates incremented successfully.",
    });
  } catch (error) {
    console.error("Increment Newsletter Open Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to increment open rates.",
    });
  }
};

export const incrementNewsletterClick = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Newsletter ID is required.",
      });
    }

    const updatedNewsletter = await prisma.newsletter.update({
      where: { id },
      data: {
        clickRate: {
          increment: 1,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Click rate incremented successfully.",
      data: updatedNewsletter,
    });
  } catch (error) {
    console.error("Increment Newsletter Click Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to increment click rate.",
    });
  }
};
