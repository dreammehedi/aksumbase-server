import prisma from "../../lib/prisma.js";

export const getAdminDashboardOverview = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Recent users within last 7 days
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

    res.status(200).json({
      success: true,
      data: {
        recentUsers,
        totalUsers,
        totalProperties,
        totalRevenue: 3000,
        recentListing: recentListingProperties,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsersByAdmin = async (req, res) => {
  try {
    const { skip = 0, limit = 10 } = req.pagination || {};
    const search = req.query.search || "";
    const role = req.query.role || null; // e.g., 'admin', 'user', 'moderator'

    const where = {
      AND: [
        role ? { role } : {},
        {
          OR: [
            { username: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
      ],
    };

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
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const total = await prisma.user.count({ where });

    res.status(200).json({
      success: true,
      data,
      pagination: { total, skip: Number(skip), limit: Number(limit) },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch all users",
    });
  }
};

export const getAllUsersSessionByAdmin = async (req, res) => {
  try {
    const { skip = 0, limit = 10 } = req.pagination || {};
    const search = req.query.search || "";
    const role = req.query.role || null;

    // Build the user filtering condition
    const userWhere = {
      AND: [
        role ? { role } : {},
        {
          NOT: { role: "admin" }, // Exclude admin users
        },
        {
          OR: [
            { username: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
      ],
    };

    // Find sessions including user data filtered by userWhere
    const data = await prisma.session.findMany({
      where: {
        user: userWhere,
      },
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

    // Count total sessions for users that match filters
    const total = await prisma.session.count({
      where: {
        user: userWhere,
      },
    });

    res.status(200).json({
      success: true,
      data,
      pagination: { total, skip: Number(skip), limit: Number(limit) },
    });
  } catch (error) {
    console.error("Get all user sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user sessions",
    });
  }
};
