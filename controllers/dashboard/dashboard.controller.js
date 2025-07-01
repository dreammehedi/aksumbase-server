import stripeConfig from "../../config/stripe.config.js";
import prisma from "../../lib/prisma.js";
import { createError } from "../../utils/error.js";

// admin controller
export const getAdminDashboardOverview = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Recent users within last 7 days excluding admin
    const recentUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
        NOT: {
          role: "admin",
          isAdmin: true,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Count total users
    const totalUsers = await prisma.user.count();

    // Count total properties
    const totalProperties = await prisma.property.count();

    // Recent properties created within last 7 days
    const recentListingProperties = await prisma.property.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Fetch all paid transactions
    const paidTransactions = await prisma.transaction.findMany({
      where: {
        status: "paid",
      },
      select: {
        amount: true,
      },
    });

    // Calculate total revenue by summing amounts
    const totalRevenue = paidTransactions.reduce(
      (sum, tx) => sum + tx.amount,
      0
    );

    res.status(200).json({
      success: true,
      data: {
        recentUsers,
        totalUsers,
        totalProperties,
        totalRevenue,
        recentListing: recentListingProperties,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminAnalysisOverview = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Total users (excluding admins)
    const totalUsers = await prisma.user.count({
      where: {
        NOT: {
          role: {
            in: ["admin", "super_admin"],
          },
        },
      },
    });

    // 2. Total properties
    const totalProperties = await prisma.property.count();

    // 3. Today's listing count
    const todayListingCount = await prisma.property.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // 4. Total flagged content
    const totalFlaggedContent = await prisma.property.count({
      where: {
        flagged: true,
      },
    });

    // 5. Total blog
    const totalBlog = await prisma.blog.count();

    // 6. Total property tour request
    const totalPropertyTourRequest = await prisma.propertyTourRequest.count();

    // 7. Total property contact user request
    const totalPropertyContactUserRequest =
      await prisma.propertyContactUserRequest.count();

    // 8. Total contact user
    const totalContactUser = await prisma.contactUser.count();

    // 9. Total get estimate
    const totalGetEstimate = await prisma.getEstimate.count();

    // 10. Total faqs
    const totalFaqs = await prisma.faqs.count();

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalProperties,
        todayListingCount,
        totalFlaggedContent,
        totalBlog,
        totalPropertyTourRequest,
        totalPropertyContactUserRequest,
        totalContactUser,
        totalGetEstimate,
        totalFaqs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// export const getAdminWeeklyReportOverview = async (req, res, next) => {
//   try {

//     const sevenDaysAgo = new Date();
//     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

//     // Weekly property listings
//     const weeklyProperties = await prisma.property.findMany({
//       where: {
//         createdAt: {
//           gte: sevenDaysAgo,
//         },
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//     // Weekly agent_broker registrations
//     const weeklyAgents = await prisma.user.findMany({
//       where: {
//         createdAt: {
//           gte: sevenDaysAgo,
//         },
//         role: "agent_broker",
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//     // Weekly users registrations
//     const weeklyUsers = await prisma.user.findMany({
//       where: {
//         createdAt: {
//           gte: sevenDaysAgo,
//         },
//         role: "user",
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//     const { type } = req.query;

//     if (type === "csv") {
//       // Combine data for CSV download
//       const data = [
//         { section: "Weekly Property Listings" },
//         ...weeklyProperties.map((item) => ({
//           id: item.id,
//           title: item.title,
//           createdAt: item.createdAt,
//           status: item.status || "",
//         })),
//         {},
//         { section: "Weekly Agent/Broker Registrations" },
//         ...weeklyAgents.map((user) => ({
//           id: user.id,
//           name: user.username,
//           email: user.email,
//           createdAt: user.createdAt,
//         })),
//         {},
//         { section: "Weekly User Registrations" },
//         ...weeklyUsers.map((user) => ({
//           id: user.id,
//           name: user.username,
//           email: user.email,
//           createdAt: user.createdAt,
//         })),
//       ];

//       const json2csv = new Json2CsvParser();
//       const csv = json2csv.parse(data);

//       res.header("Content-Type", "text/csv");
//       res.attachment("weekly-report.csv");
//       return res.send(csv);
//     }

//     res.status(200).json({
//       success: true,
//       data: {
//         weeklyProperties,
//         weeklyAgents,
//         weeklyUsers,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const getAdminWeeklyReportOverview = async (req, res, next) => {
  try {
    const { skip = 0, limit = 10 } = req.pagination || {};
    const { type } = req.query;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // ──────── Property Listings ────────
    const [weeklyProperties, totalProperties] = await Promise.all([
      prisma.property.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
        },
        orderBy: { createdAt: "desc" },
        skip: Number(skip),
        take: Number(limit),
      }),
      prisma.property.count({
        where: {
          createdAt: { gte: sevenDaysAgo },
        },
      }),
    ]);

    // ──────── Agent/Broker Registrations ────────
    const [weeklyAgents, totalAgents] = await Promise.all([
      prisma.user.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
          role: "agent_broker",
        },
        orderBy: { createdAt: "desc" },
        skip: Number(skip),
        take: Number(limit),
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: sevenDaysAgo },
          role: "agent_broker",
        },
      }),
    ]);

    // ──────── User Registrations ────────
    const [weeklyUsers, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
          role: "user",
        },
        orderBy: { createdAt: "desc" },
        skip: Number(skip),
        take: Number(limit),
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: sevenDaysAgo },
          role: "user",
        },
      }),
    ]);

    // ──────── CSV Export ────────
    if (type === "csv") {
      const { Parser } = await import("json2csv"); // dynamic import
      const fields = ["id", "title", "name", "email", "createdAt", "status"];
      const parser = new Parser({ fields, withBOM: true });

      const csvData = [
        ...weeklyProperties.map((item) => ({
          id: item.id,
          title: item.title,
          createdAt: item.createdAt,
          status: item.status || "",
        })),
        ...weeklyAgents.map((user) => ({
          id: user.id,
          name: user.username,
          email: user.email,
          createdAt: user.createdAt,
        })),
        ...weeklyUsers.map((user) => ({
          id: user.id,
          name: user.username,
          email: user.email,
          createdAt: user.createdAt,
        })),
      ];

      const csv = parser.parse(csvData);

      res.header("Content-Type", "text/csv");
      res.attachment("weekly-report.csv");
      return res.send(csv);
    }

    // ──────── JSON Response ────────
    res.status(200).json({
      success: true,
      data: {
        weeklyProperties,
        weeklyAgents,
        weeklyUsers,
      },
      pagination: {
        skip: Number(skip),
        limit: Number(limit),
        total: {
          properties: totalProperties,
          agents: totalAgents,
          users: totalUsers,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsersByAdmin = async (req, res) => {
  try {
    const { skip = 0, limit = 10 } = req.pagination || {};
    const {
      search = "",
      role,
      email = null,
      city = null,
      state = null,
      zipCode = null,
      phone = null,
      address = null,
    } = req.query;

    // Define allowed roles
    const allowedRoles = [
      "user",
      "admin",
      "agent_broker",
      "property_manager",
      "homeowner_landlord",
    ];

    // Validate role
    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role query parameter is required.",
      });
    }
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role value. Allowed values: ${allowedRoles.join(
          ", "
        )}`,
      });
    }

    // Helper for partial match filter
    const exactOrContains = (fieldValue) =>
      fieldValue ? { contains: fieldValue, mode: "insensitive" } : undefined;

    // Compose OR filter for search on multiple fields
    const searchFilter = search
      ? {
          OR: [
            { username: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
            { state: { contains: search, mode: "insensitive" } },
            { zipCode: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { address: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    // Build the Prisma where filter
    const where = {
      AND: [
        { role },
        email ? { email: exactOrContains(email) } : {},
        city ? { city: exactOrContains(city) } : {},
        state ? { state: exactOrContains(state) } : {},
        zipCode ? { zipCode: exactOrContains(zipCode) } : {},
        phone ? { phone: exactOrContains(phone) } : {},
        address ? { address: exactOrContains(address) } : {},
        searchFilter,
      ],
    };

    // Query users
    const data = await prisma.user.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const total = await prisma.user.count({ where });

    return res.status(200).json({
      success: true,
      data,
      pagination: { total, skip: Number(skip), limit: Number(limit) },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch all users",
    });
  }
};

export const getAllAdminsByAdmin = async (req, res) => {
  try {
    const { skip = 0, limit = 10 } = req.pagination || {};
    const {
      search = "",
      email = null,
      city = null,
      state = null,
      zipCode = null,
      phone = null,
      address = null,
    } = req.query;

    // Helper for partial match filter
    const exactOrContains = (fieldValue) =>
      fieldValue ? { contains: fieldValue, mode: "insensitive" } : undefined;

    // Compose OR filter for search on multiple fields
    const searchFilter = search
      ? {
          OR: [
            { username: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
            { state: { contains: search, mode: "insensitive" } },
            { zipCode: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { address: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    // Build the Prisma where filter
    const where = {
      AND: [
        { role: "admin" },
        email ? { email: exactOrContains(email) } : {},
        city ? { city: exactOrContains(city) } : {},
        state ? { state: exactOrContains(state) } : {},
        zipCode ? { zipCode: exactOrContains(zipCode) } : {},
        phone ? { phone: exactOrContains(phone) } : {},
        address ? { address: exactOrContains(address) } : {},
        searchFilter,
      ],
    };

    // Query users
    const data = await prisma.user.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const total = await prisma.user.count({ where });

    return res.status(200).json({
      success: true,
      data,
      pagination: { total, skip: Number(skip), limit: Number(limit) },
    });
  } catch (error) {
    console.error("Get all admins error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch all admins",
    });
  }
};

export const getAllUsersSessionByAdmin = async (req, res) => {
  try {
    const { skip = 0, limit = 10 } = req.pagination || {};
    const search = req.query.search || "";
    const email = req.query.email || "";
    const role = req.query.role || "";
    const isActiveRaw = req.query.isActive;
    const currentSessionId = req.sessionId; // ✅ Decoded from token

    const isActive =
      isActiveRaw === "true"
        ? true
        : isActiveRaw === "false"
        ? false
        : undefined;

    const userWhere = {
      AND: [
        role ? { role } : {},
        email ? { email: { contains: email, mode: "insensitive" } } : {},
        search
          ? {
              OR: [
                { username: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    };

    const sessionWhere = {
      ...(typeof isActive !== "undefined" && { isActive }),
      user: userWhere,
    };

    const sessions = await prisma.session.findMany({
      where: sessionWhere,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    const sessionsWithCurrentFlag = sessions.map((session) => ({
      ...session,
      isCurrentUserSession: session.id === currentSessionId,
    }));

    const total = await prisma.session.count({ where: sessionWhere });

    res.status(200).json({
      success: true,
      data: sessionsWithCurrentFlag,
      pagination: {
        total,
        skip: Number(skip),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("❌ Get all user sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user sessions",
    });
  }
};

export const getUserSession = async (req, res) => {
  try {
    const userId = req.userId;
    const sessionId = req.sessionId; // Current session ID
    const { skip = 0, limit = 10 } = req.pagination || {};

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized access" });
    }

    // Fetch all sessions (including current session) with pagination
    const sessions = await prisma.session.findMany({
      where: { userId },
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    const total = await prisma.session.count({ where: { userId } });

    if (!sessions || sessions.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No sessions found" });
    }

    // Add isCurrentUserSession flag
    const sessionsWithFlag = sessions.map((session) => ({
      ...session,
      isCurrentUserSession: session.id === sessionId,
    }));

    res.status(200).json({
      success: true,
      data: sessionsWithFlag,
      pagination: {
        total,
        skip: Number(skip),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("Get user session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user session",
    });
  }
};

export const deleteUserSessionDataAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    // Validate the session ID format (24-char MongoDB ObjectId)
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID format.",
      });
    }

    // Check if session exists
    const existingSession = await prisma.session.findUnique({
      where: { id },
    });

    if (!existingSession) {
      return res.status(404).json({
        success: false,
        message: "Session not found.",
      });
    }

    // Delete the session
    await prisma.session.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Session deleted successfully.",
    });
  } catch (error) {
    console.error("❌ Error deleting session:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete user session",
    });
  }
};

export const deleteMySession = async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.userId; // from JWT middleware

  try {
    // ✅ Validate sessionId format
    if (!/^[0-9a-fA-F]{24}$/.test(sessionId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid session ID format." });
    }

    // ✅ Check if user exists in the User collection
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ✅ Find the session by ID
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized or session not found.",
      });
    }

    // ✅ Delete or deactivate the session
    await prisma.session.delete({
      where: { id: sessionId },
    });

    return res.status(200).json({
      success: true,
      message: "Logged out from this device.",
    });
  } catch (error) {
    console.error("❌ Error in deleteMySession:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while logging out session.",
    });
  }
};

export const getAllProperty = async (req, res) => {
  try {
    const { skip = 0, limit = 10 } = req.pagination || {};
    const search = req.query.search || "";

    const {
      city,
      state,
      zip,
      type,
      property,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      furnished,
      garage,
      pool,
      listingType,
      listingStatus,
      amenities,
      isFlagged,
    } = req.query;

    const where = {
      AND: [
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
            { address: { contains: search, mode: "insensitive" } },
            { zip: { contains: search, mode: "insensitive" } },
          ],
        },
        city ? { city: { equals: city, mode: "insensitive" } } : {},
        state ? { state: { equals: state, mode: "insensitive" } } : {},
        zip ? { zip: { equals: zip } } : {},
        type ? { type: { equals: type } } : {},
        property ? { property: { equals: property } } : {},
        listingType ? { listingType: { equals: listingType } } : {},
        listingStatus ? { listingStatus: { equals: listingStatus } } : {},
        minPrice ? { price: { gte: parseFloat(minPrice) } } : {},
        maxPrice ? { price: { lte: parseFloat(maxPrice) } } : {},
        bedrooms ? { bedrooms: { gte: parseInt(bedrooms) } } : {},
        bathrooms ? { bathrooms: { gte: parseInt(bathrooms) } } : {},
        furnished !== undefined ? { furnished: furnished === "true" } : {},
        garage !== undefined ? { garage: garage === "true" } : {},
        pool !== undefined ? { pool: pool === "true" } : {},
        isFlagged !== undefined ? { flagged: isFlagged === "true" } : {},
        // amenities filter (matches any of the provided amenities)
        amenities
          ? {
              amenities: {
                hasSome: Array.isArray(amenities)
                  ? amenities
                  : amenities.split(","),
              },
            }
          : {},
      ],
    };

    const data = await prisma.property.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.property.count({ where });

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        skip: Number(skip),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("Get property error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch property" });
  }
};

export const updateMultiplePropertyStatus = async (req, res) => {
  try {
    const { ids = [], status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Property IDs are required.",
      });
    }

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status provided.",
      });
    }

    const updated = await prisma.property.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });

    res.status(200).json({
      success: true,
      message: `${updated.count} properties updated to "${status}"`,
    });
  } catch (error) {
    console.error("Update property status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update property status",
    });
  }
};

export const updateMultiplePropertyTourStatus = async (req, res) => {
  try {
    const { ids = [], status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Property IDs are required.",
      });
    }

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status provided.",
      });
    }

    const updated = await prisma.propertyTourRequest.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });

    res.status(200).json({
      success: true,
      message: `${updated.count} properties tour request updated to "${status}"`,
    });
  } catch (error) {
    console.error("Update property tour request status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update property tour request status",
    });
  }
};

export const updateMultiplePropertyFlagged = async (req, res) => {
  try {
    const { ids = [], flagged, reportedBy, flagReason } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Property IDs are required.",
      });
    }

    if (
      !Array.isArray(reportedBy) ||
      reportedBy.length === 0 ||
      typeof flagReason !== "string" ||
      flagReason.trim() === "" ||
      typeof flagged !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Reported by, Flag Reason, and Flagged status are required and must be valid.",
      });
    }

    // Prepare data to update (only include fields that are defined)
    const updateData = {
      flagStatus: flagged ? "approved" : "pending",
    };

    if (typeof flagged === "boolean") updateData.flagged = flagged;
    if (Array.isArray(reportedBy)) updateData.reportedBy = reportedBy;
    if (typeof flagReason === "string") updateData.flagReason = flagReason;
    updateData.flaggedAt = new Date();

    const updated = await prisma.property.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: `${updated.count} properties updated.`,
      data: updateData,
    });
  } catch (error) {
    console.error("Update property flagged status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update property flagged status",
    });
  }
};

export const adminRequestPropertyContactUser = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID not found from token." });
    }

    const { skip = 0, limit = 10 } = req.pagination || {};

    const requests = await prisma.propertyContactUserRequest.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        message: true,
        createdAt: true,
        property: {
          select: {
            title: true,
            price: true,
            address: true,
            city: true,
            state: true,
            zip: true,
            latitude: true,
            longitude: true,
            type: true,
            bedrooms: true,
            bathrooms: true,
            size: true,
            images: true,
          },
        },
      },
      skip: Number(skip),
      take: Number(limit),
    });

    const total = await prisma.propertyContactUserRequest.count({
      where: {
        userId,
      },
    });

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        total,
        skip: Number(skip),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("Fetch user property contact requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch property contact requests.",
    });
  }
};

export const getAllUserRoleApplications = async (req, res) => {
  const adminId = req.userId;
  const { skip = 0, limit = 10 } = req.query;
  const search = req.query.search?.trim() || "";

  if (!adminId) {
    return res.status(401).json({ error: "Unauthorized access." });
  }

  try {
    const whereClause = search
      ? {
          OR: [
            { user: { username: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {};

    const [userRoles, total] = await Promise.all([
      prisma.userRole.findMany({
        where: whereClause,
        skip: Number(skip),
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              phone: true,
              bio: true,
              role: true,
            },
          },
          rolePackage: {
            select: {
              id: true,
              name: true,
              durationDays: true,
              price: true,
              roleName: true,
            },
          },
          transactions: {
            select: {
              id: true,
              amount: true,
              currency: true,
              method: true,
              invoiceUrl: true,
              stripeId: true,
              createdAt: true,
              status: true,
            },
          },
        },
      }),

      prisma.userRole.count({
        where: whereClause,
      }),
    ]);

    res.status(200).json({
      message: "User role applications fetched successfully.",
      success: true,
      data: userRoles,
      pagination: { total, skip: Number(skip), limit: Number(limit) },
    });
  } catch (error) {
    console.error("Error fetching user role applications:", error.message);
    res.status(500).json({ error: "Failed to fetch applications." });
  }
};

export const getAdminRolePackage = async (req, res) => {
  try {
    const { skip = 0, limit = 10 } = req.pagination || {};

    const data = await prisma.rolePackage.findMany({
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.rolePackage.count();

    res.status(200).json({
      success: true,
      data,
      pagination: { total, skip: Number(skip), limit: Number(limit) },
    });
  } catch (error) {
    console.error("Get role package error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch role package" });
  }
};

// user controller
export const getUserRolePackagePurchase = async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized access." });
  }

  try {
    // Fetch in parallel
    const [allPackages, userRole] = await Promise.all([
      prisma.rolePackage.findMany({
        where: { status: "active" },
        orderBy: { price: "asc" }, // Optional: sort packages by price or name
      }),
      prisma.userRole.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              phone: true,
              bio: true,
              role: true,
            },
          },
          rolePackage: {
            select: {
              id: true,
              name: true,
              durationDays: true,
              price: true,
              roleName: true,
              features: true,
            },
          },
          transactions: {
            select: {
              id: true,
              amount: true,
              currency: true,
              method: true,
              invoiceUrl: true,
              stripeId: true,
              createdAt: true,
              status: true,
            },
          },
        },
      }),
    ]);

    res.status(200).json({
      message: "Fetched role packages and user purchase successfully.",
      success: true,
      allPackages,
      userPurchase: userRole || null,
    });
  } catch (error) {
    console.error(
      "Error fetching role packages or user purchase:",
      error.message
    );
    res.status(500).json({ error: "Failed to fetch data." });
  }
};

// get property by user
export const getPropertyByUser = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId)
      return res.status(400).json({ message: "User ID not found from token." });

    // 3. Get filters
    const { skip = 0, limit = 10 } = req.pagination || {};
    const search = req.query.search || "";

    const {
      city,
      state,
      zip,
      type,
      property,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      furnished,
      garage,
      pool,
      listingType,
      listingStatus,
      amenities,
      isSold,
      isRent,
    } = req.query;

    const where = {
      AND: [
        { userId: { equals: userId } }, // ✅ This limits results to properties added by the user
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
            { address: { contains: search, mode: "insensitive" } },
            { zip: { contains: search, mode: "insensitive" } },
          ],
        },
        city ? { city: { equals: city, mode: "insensitive" } } : {},
        state ? { state: { equals: state, mode: "insensitive" } } : {},
        zip ? { zip: { equals: zip } } : {},
        type ? { type: { equals: type } } : {},
        property ? { property: { equals: property } } : {},
        listingType ? { listingType: { equals: listingType } } : {},
        listingStatus ? { listingStatus: { equals: listingStatus } } : {},
        minPrice ? { price: { gte: parseFloat(minPrice) } } : {},
        maxPrice ? { price: { lte: parseFloat(maxPrice) } } : {},
        bedrooms ? { bedrooms: { gte: parseInt(bedrooms) } } : {},
        bathrooms ? { bathrooms: { gte: parseInt(bathrooms) } } : {},
        furnished !== undefined ? { furnished: furnished === "true" } : {},
        garage !== undefined ? { garage: garage === "true" } : {},
        pool !== undefined ? { pool: pool === "true" } : {},
        isSold !== undefined ? { isSold: isSold === "true" } : {},
        isRent !== undefined ? { isRent: isRent === "true" } : {},
        amenities
          ? {
              amenities: {
                hasSome: Array.isArray(amenities)
                  ? amenities
                  : amenities.split(","),
              },
            }
          : {},
      ],
    };

    // 4. Fetch properties
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.property.count({ where }),
    ]);

    // 5. Get user bookmark property IDs (if user is logged in)
    let bookmarkedPropertyIds = [];

    if (userId) {
      const bookmarks = await prisma.bookmark.findMany({
        where: { userId },
        select: { propertyId: true, userId: true },
      });
      bookmarkedPropertyIds = bookmarks.map((b) => b.propertyId);
    }

    // 6. Add `isBookmarked` to each property
    const updatedProperties = properties.map((prop) => {
      return {
        ...prop,
        isBookmarked: bookmarkedPropertyIds.includes(prop.id),
      };
    });

    // 7. Response
    res.status(200).json({
      success: true,
      data: updatedProperties,
      pagination: {
        total,
        skip: Number(skip),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("Get property error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch property",
    });
  }
};

// renew role with stripe payment method
export const renewRolePurchaseIntent = async (req, res) => {
  try {
    const stripe = await stripeConfig();
    const userId = req.userId;
    const { rolePackageId, currency = "usd", metadata = {} } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user." });
    }

    if (!rolePackageId) {
      return res.status(400).json({ error: "rolePackageId is required." });
    }

    // 🔎 Get current package details
    const rolePackage = await prisma.rolePackage.findUnique({
      where: { id: rolePackageId },
    });

    if (!rolePackage || !rolePackage.price) {
      return res.status(404).json({ error: "Role package not found." });
    }

    // 🔎 Find expired userRole (same user + same package)
    const expiredRole = await prisma.userRole.findFirst({
      where: {
        userId,
        rolePackageId,
        isExpired: true,
      },
      orderBy: { endDate: "desc" }, // Get the most recent expired one
    });

    if (!expiredRole) {
      return res.status(400).json({
        error: "No expired role found for this package. Cannot renew.",
      });
    }

    // ✅ Create Stripe Checkout session with current package price
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: req.userEmail, // optional
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: rolePackage.name,
              description: rolePackage.roleName,
            },
            unit_amount: Math.round(rolePackage.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        rolePackageId,
        renewUserRoleId: expiredRole.id, // Pass expired role ID to update later
        ...metadata,
      },
      invoice_creation: { enabled: true },
      success_url: `${process.env.FRONTEND_LINK}/renew-role-payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_LINK}/renew-role-payment-cancelled`,
    });

    res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    console.error("Renew role purchase error:", error);
    res.status(500).json({ error: "Failed to create renew session." });
  }
};

// Get all reviews by the user
export const getUserReviews = async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.pagination;

  try {
    const reviews = await prisma.review.findMany({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { property: true },
    });

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    console.error("Get User Reviews Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to get user reviews" });
  }
};

export const userRequestPropertyContactUser = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID not found from token." });
    }

    const { skip = 0, limit = 10 } = req.pagination || {};

    const requests = await prisma.propertyContactUserRequest.findMany({
      where: {
        userId, // Only match requests created by this user
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        message: true,
        createdAt: true,
        property: {
          select: {
            title: true,
            price: true,
            address: true,
            city: true,
            state: true,
            zip: true,
            latitude: true,
            longitude: true,
            type: true,
            bedrooms: true,
            bathrooms: true,
            size: true,
            images: true,
          },
        },
      },
      skip: Number(skip),
      take: Number(limit),
    });

    const total = await prisma.propertyContactUserRequest.count({
      where: {
        userId,
      },
    });

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        total,
        skip: Number(skip),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("Fetch user property contact requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch property contact requests.",
    });
  }
};

export const getUserRecentActivity = async (req, res) => {
  const userId = req.userId;

  // Get date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    const [listings, views, bookmarks] = await Promise.all([
      // 1. User's reviews in last 7 days

      // 2. Properties listed by the user in last 7 days
      prisma.property.findMany({
        where: {
          userId,
          createdAt: { gte: sevenDaysAgo },
        },
        orderBy: { createdAt: "desc" },
      }),

      // 3. Property views in last 7 days
      prisma.propertyView.findMany({
        where: {
          userId,
          viewedAt: { gte: sevenDaysAgo },
        },
        orderBy: { viewedAt: "desc" },
        include: {
          property: true,
        },
      }),

      // 4. Bookmarked properties in last 7 days
      prisma.bookmark.findMany({
        where: {
          userId,
          createdAt: { gte: sevenDaysAgo },
          property: {
            isNot: null,
          },
        },
        orderBy: { createdAt: "desc" },
        include: {
          property: true,
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        listings,
        views,
        bookmarks,
      },
    });
  } catch (error) {
    console.error("Get User Recent Activity Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user recent activity.",
    });
  }
};

export const getUsersByRole = async (req, res) => {
  const { role, search = "" } = req.query;
  const { skip = 0, limit = 20 } = req.pagination || {};

  // Block invalid or unauthorized roles
  if (!role || ["user", "admin"].includes(role)) {
    return res.status(403).json({
      success: false,
      message: "Invalid or unauthorized role.",
    });
  }

  let rolesToQuery = [role];

  // Map 'other_professionals' to multiple roles
  if (role === "other_professionals") {
    rolesToQuery = ["homeowner_landlord", "property_manager"];
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        role: { in: rolesToQuery },
        OR: [
          { email: { contains: search, mode: "insensitive" } },
          { address: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
          { state: { contains: search, mode: "insensitive" } },
          { zipCode: { contains: search, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        bio: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        avatar: true,
        userRoles: {
          where: { isActive: true },
          orderBy: { startDate: "asc" },
          take: 1,
          select: {
            id: true,
            startDate: true,
            endDate: true,
            isActive: true,
            isExpired: true,
            isPaused: true,
          },
        },
        reviewsReceived: {
          include: {
            reviewer: {
              select: {
                id: true,
                username: true,
                avatar: true,
                email: true,
                phone: true,
                address: true,
                city: true,
                state: true,
                zipCode: true,
              },
            },
          },
        },
      },
      skip: Number(skip),
      take: Number(limit),
    });

    const filtered = users
      .map((user) => {
        const reviews = user.reviewsReceived || [];
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = reviews.length
          ? (totalRating / reviews.length).toFixed(1)
          : null;

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role,
          bio: user.bio,
          address: user.address,
          city: user.city,
          state: user.state,
          zipCode: user.zipCode,
          avatar: user.avatar,
          userRole: user.userRoles[0] || null,
          averageRating,
          totalReviews: reviews.length,
          reviews,
        };
      })
      .sort((a, b) => {
        const aActive = a.userRole?.isActive;
        const bActive = b.userRole?.isActive;

        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;

        const dateA = new Date(a.userRole?.startDate || 0);
        const dateB = new Date(b.userRole?.startDate || 0);
        return dateA - dateB;
      });

    const total = await prisma.user.count({
      where: {
        role: { in: rolesToQuery },
        OR: [
          { email: { contains: search, mode: "insensitive" } },
          { address: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
          { state: { contains: search, mode: "insensitive" } },
          { zipCode: { contains: search, mode: "insensitive" } },
        ],
      },
    });

    res.status(200).json({
      success: true,
      role,
      data: filtered,
      pagination: {
        total,
        skip: Number(skip),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users by role:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to get users by role.",
    });
  }
};

export const getSingleUserProfile = async (req, res) => {
  const { id } = req.params;

  const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

  if (!id || !isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid or missing user ID.",
    });
  }

  const allowedRoles = [
    "agent_broker",
    "homeowner_landlord",
    "property_manager",
  ];

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        bio: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        avatar: true,
        userRoles: {
          where: { isActive: true },
          orderBy: { startDate: "asc" },
          take: 1,
          select: {
            id: true,
            startDate: true,
            endDate: true,
            isActive: true,
            isExpired: true,
            isPaused: true,
          },
        },
        reviewsReceived: {
          include: {
            reviewer: {
              select: {
                id: true,
                username: true,
                avatar: true,
                email: true,
                phone: true,
                address: true,
                city: true,
                state: true,
                zipCode: true,
              },
            },
          },
        },
        // Fetch only active properties
        property: {
          where: { status: "approved" },
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            address: true,
            city: true,
            state: true,
            zip: true,
            images: true,
            latitude: true,
            longitude: true,
            neighborhood: true,
            views: true,
            type: true,
            property: true,
            bedrooms: true,
            bathrooms: true,
            size: true,
            lotSize: true,
            yearBuilt: true,
            description: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Role not permitted.",
      });
    }

    const reviews = user.reviewsReceived || [];
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = reviews.length
      ? (totalRating / reviews.length).toFixed(1)
      : null;

    const userProfile = {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      bio: user.bio,
      address: user.address,
      city: user.city,
      state: user.state,
      zipCode: user.zipCode,
      avatar: user.avatar,
      userRole: user.userRoles[0] || null,
      averageRating,
      totalReviews: reviews.length,
      reviews,
      listingProperties: user.property || [],
    };

    return res.status(200).json({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    console.error("Error fetching single user profile:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user profile.",
    });
  }
};

export const getUserStatisticsOverview = async (req, res) => {
  const userId = req.userId;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    const [
      pendingCount,
      activeCount,
      soldProperties,
      recentSales,
      rentProperties,
      recentRented,
    ] = await Promise.all([
      // Count of pending listings
      prisma.property.count({
        where: {
          userId,
          status: "pending",
        },
      }),

      // Count of active listings
      prisma.property.count({
        where: {
          userId,
          status: "approved",
          isSold: false,
        },
      }),

      // All sold properties for user
      prisma.property.findMany({
        where: {
          userId,
          isSold: true,
          type: "buy",
        },
        select: {
          soldPrice: true,
          soldAt: true,
        },
      }),

      // Recent sold properties (latest 5)
      prisma.property.findMany({
        where: {
          userId,
          isSold: true,
        },
        orderBy: {
          soldAt: "desc",
        },
        take: 5,
      }),

      // All rent properties for user
      prisma.property.findMany({
        where: {
          userId,
          isRent: true,
          type: "rent",
        },
        select: {
          rentPrice: true,
          rentAt: true,
        },
      }),

      // Recent rent properties (latest 5)
      prisma.property.findMany({
        where: {
          userId,
          isRent: true,
        },
        orderBy: {
          rentAt: "desc",
        },
        take: 5,
      }),
    ]);

    const totalRevenue = soldProperties.reduce(
      (sum, prop) => sum + (prop.soldPrice || 0),
      0
    );

    const totalRentRevenue = rentProperties.reduce(
      (sum, prop) => sum + (prop.rentPrice || 0),
      0
    );
    res.status(200).json({
      success: true,
      data: {
        pendingCount, // pending properties count
        activeCount, // active (approved) listings not sold
        soldCount: soldProperties.length, // total sold count
        totalRevenue, // total revenue from soldPrice
        recentSales, // latest 5 sold properties
        totalRentRevenue, // total revenue from rentPrice
        recentRented, // latest 5 rent properties
      },
    });
  } catch (error) {
    console.error("Get User Statistics Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user statistics.",
    });
  }
};

export const updatePropertySoldStatus = async (req, res, next) => {
  try {
    const { id, soldPrice, soldFeedback } = req.body;
    const userId = req.userId;
    const isSold = true;

    // 1. Check if ID is provided
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Property ID is required.",
      });
    }

    // 2. Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // 3. Check if property exists
    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    // 4. Check if property belongs to the user
    if (property.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this property.",
      });
    }

    // 5. Check if property is approved
    if (property.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved properties can be marked as sold.",
      });
    }

    // 6. Ensure only 'buy' type properties can be sold
    if (property.type !== "buy") {
      return res.status(400).json({
        success: false,
        message: "Only properties listed for 'buy' can be marked as sold.",
      });
    }

    // 7. Build update data
    const updateData = {
      isSold,
      soldPrice: parseInt(soldPrice),
      soldAt: new Date(),
      soldFeedback,
    };

    // 8. Update property
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: `Property marked as sold.`,
      data: updatedProperty,
    });
  } catch (error) {
    console.error("Update property sold status error:", error);
    return next(createError(500, "Failed to update sold status"));
  }
};

export const updatePropertyRentStatus = async (req, res, next) => {
  try {
    const { id, rentPrice, rentFeedback } = req.body;
    const userId = req.userId;
    const isRent = true;

    // 1. Check if ID is provided
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Property ID is required.",
      });
    }

    // 2. Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // 3. Check if property exists
    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    // 4. Check if property belongs to the user
    if (property.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this property.",
      });
    }

    // 5. Check if property is approved
    if (property.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved properties can be marked as rented.",
      });
    }

    // 6. Ensure only 'rent' type properties can be rented
    if (property.type !== "rent") {
      return res.status(400).json({
        success: false,
        message: "Only properties listed for 'rent' can be marked as rented.",
      });
    }

    // 7. Build update data
    const updateData = {
      isRent,
      rentPrice: parseInt(rentPrice),
      rentAt: new Date(),
      rentFeedback,
    };

    // 8. Update property
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: `Property marked as rent.`,
      data: updatedProperty,
    });
  } catch (error) {
    console.error("Update property rent status error:", error);
    return next(createError(500, "Failed to update rent status"));
  }
};

export const userRequestTour = async (req, res) => {
  try {
    const { skip = 0, limit = 10 } = req.pagination || {};
    const search = req.query.search || "";
    const filterDate = req.query.date;
    const filterTime = req.query.time;

    // Base Prisma filter (excluding tourTimes)
    const where = {
      AND: [
        {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
      ],
    };

    // Fetch all matching data (before tourTimes filtering)
    const allRequests = await prisma.propertyTourRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        message: true,
        tourTimes: true,
        status: true,
        propertyId: true,
        createdAt: true,
        property: {
          select: {
            title: true,
            price: true,
            address: true,
            city: true,
            state: true,
            zip: true,
            latitude: true,
            longitude: true,
            type: true,
            bedrooms: true,
            bathrooms: true,
            size: true,
            images: true,
          },
        },
      },
    });

    // Filter by tourTimes.date and/or tourTimes.time
    const filteredRequests = allRequests.filter((request) =>
      request.tourTimes?.some((slot) => {
        const matchDate = filterDate ? slot.date === filterDate : true;
        const matchTime = filterTime ? slot.time === filterTime : true;
        return matchDate && matchTime;
      })
    );

    // Paginate filtered data
    const paginated = filteredRequests.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: paginated,
      pagination: {
        total: filteredRequests.length,
        skip: Number(skip),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("User tour request fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user tour requests",
    });
  }
};
