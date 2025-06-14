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
