import stripeConfig from "../../config/stripe.config.js";
import prisma from "../../lib/prisma.js";

// admin controller
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

export const getUserSession = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized access" });
    }

    const session = await prisma.session.findMany({
      where: {
        userId,
      },
      orderBy: { createdAt: "desc" }, // get latest session
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

    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "Session not found" });
    }

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error("Get user session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user session",
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
          transaction: {
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
// renew role with static data
// export const renewRole = async (req, res) => {
//   const { userId, rolePackageId } = req.body;

//   if (!userId || !rolePackageId) {
//     return res.status(400).json({
//       error: "Both userId and rolePackageId are required.",
//     });
//   }

//   try {
//     // 1. Get userRole by user and package
//     const role = await prisma.userRole.findFirst({
//       where: {
//         userId,
//         rolePackageId,
//       },
//       include: { rolePackage: true },
//     });

//     if (!role) {
//       return res.status(404).json({
//         error: "Role not found for this user and package.",
//       });
//     }

//     // 2. Check if expired based on endDate
//     const now = new Date();
//     const isActuallyExpired = role.endDate && dayjs(role.endDate).isBefore(now);

//     if (!isActuallyExpired && !role.isExpired) {
//       return res.status(400).json({
//         error: "Role is not expired yet. Cannot renew.",
//       });
//     }

//     // 3. Optionally update isExpired in DB if it's outdated
//     if (isActuallyExpired && !role.isExpired) {
//       await prisma.userRole.update({
//         where: { id: role.id },
//         data: { isExpired: true },
//       });
//     }

//     // 4. Calculate new start/end date
//     const newStartDate = new Date();
//     const newEndDate = dayjs(newStartDate)
//       .add(role.rolePackage.durationDays, "day")
//       .toDate();

//     // 5. Renew the role
//     const renewed = await prisma.userRole.update({
//       where: { id: role.id },
//       data: {
//         startDate: newStartDate,
//         endDate: newEndDate,
//         isExpired: false,
//         isActive: true,
//         isPaused: false,
//       },
//     });

//     res.status(200).json({
//       message: "Role renewed successfully.",
//       data: renewed,
//     });
//   } catch (error) {
//     console.error("Renew Role Error:", error.message);
//     res.status(500).json({ error: "Failed to renew role." });
//   }
// };

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

    res.status(200).json({
      success: true,
      role,
      data: filtered,
      pagination: {
        total: filtered.length,
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
