import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import slugify from "slugify";
import { cloudinary } from "../../config/cloudinary.config.js";

const prisma = new PrismaClient();

export const getProperty = async (req, res) => {
  try {
    const data = await prisma.property.findMany({
      where: { status: "approved", flagged: false },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get property error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch property" });
  }
};

export const searchProperty = async (req, res) => {
  try {
    const { skip = 0, limit = 10 } = req.pagination || {};
    const search = (req.query.search || "").toLowerCase();
    const { type } = req.query;

    const andConditions = [{ status: "approved", flagged: false }];

    if (type) {
      andConditions.push({ type: { equals: type } });
    }

    if (search) {
      andConditions.push({
        OR: [
          { city: { contains: search, mode: "insensitive" } },
          { address: { contains: search, mode: "insensitive" } },
          { zip: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    const where = {
      AND: andConditions,
    };

    const safeSkip = Number.isFinite(Number(skip)) ? Number(skip) : 0;
    const safeLimit = Number.isFinite(Number(limit)) ? Number(limit) : 10;

    const data = await prisma.property.findMany({
      where,
      skip: safeSkip,
      take: safeLimit,
      orderBy: { createdAt: "desc" },
      select: {
        zip: true,
        city: true,
        address: true,
      },
    });

    const total = await prisma.property.count({ where });

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        skip: safeSkip,
        limit: safeLimit,
      },
    });
  } catch (error) {
    console.error("Get property error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch properties",
      error,
    });
  }
};

export const createProperty = async (req, res) => {
  try {
    const {
      title,
      price,
      address,
      city,
      state,
      zip,
      latitude,
      longitude,
      neighborhood,
      type,
      property,
      bedrooms,
      bathrooms,
      size,
      lotSize,
      yearBuilt,
      hoaFees,
      leaseLength,
      furnished,
      deposit,
      moveInDate,
      amenities,
      garage,
      basement,
      fireplace,
      pool,
      pet,
      utilities,
      income,
      school,
      bus,
      restaurant,
      description,
    } = req.body;

    const userId = req.userId;
    console.log(req.body);
    if (!userId)
      return res.status(400).json({ message: "User ID not found from token." });

    if (
      !title ||
      !type ||
      !property ||
      !price ||
      !bedrooms ||
      !bathrooms ||
      !size ||
      !description
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    console.log(user.role);
    // Parse amenities if it comes as a JSON string
    let amenitiesArray = [];
    try {
      amenitiesArray =
        typeof amenities === "string" ? JSON.parse(amenities) : amenities;
      if (!Array.isArray(amenitiesArray)) {
        amenitiesArray = [];
      }
    } catch {
      amenitiesArray = [];
    }

    const slug = slugify(title, { lower: true, strict: true });

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Images are required" });
    }

    const uploadedImages = await Promise.all(
      req.files.map(async (file) => ({
        url: file.path,
        publicId: file.filename,
      }))
    );

    const existingProperty = await prisma.property.findFirst({
      where: {
        OR: [
          { slug },
          {
            latitude: latitude,
            longitude: longitude,
          },
        ],
      },
    });

    const newProperty = await prisma.property.create({
      data: {
        title,
        slug,
        price: parseFloat(price),
        address,
        city,
        state,
        zip,
        latitude,
        longitude,
        neighborhood,
        type,
        property,
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        size: parseInt(size),
        lotSize: lotSize ? parseFloat(lotSize) : undefined,
        yearBuilt: yearBuilt ? parseInt(yearBuilt) : undefined,
        hoaFees: hoaFees ? parseInt(hoaFees) : undefined,
        leaseLength,
        furnished: furnished === "true",
        deposit: deposit ? parseFloat(deposit) : undefined,
        moveInDate: moveInDate ? new Date(moveInDate) : undefined,
        amenities: amenitiesArray || [],
        garage: garage === "true",
        basement: basement === "true",
        fireplace: fireplace === "true",
        pool: pool === "true",
        pet,
        utilities,
        income,
        school,
        bus,
        restaurant,
        description,
        listingStatus: "active",
        listingType: user?.role,
        userId,
        status:
          user?.role === "agent_broker" || user?.role === "property_manager"
            ? "approved"
            : "pending",
        userName: user?.username,
        userAvatar: user?.image,
        userEmail: user?.email,
        images: uploadedImages,
        flagStatus: existingProperty ? "approved" : "pending",
        flagged: existingProperty ? true : false,
        flagReason: existingProperty
          ? "Property data already exist. Duplicate property not allow!"
          : "",
        flaggedAt: existingProperty ? new Date() : null,
        reportedBy: existingProperty ? ["Reported by data created time."] : [],
      },
    });

    res.status(201).json({ success: true, data: newProperty });
  } catch (error) {
    console.error("Create property error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create property",
      error: error.message,
    });
  }
};

export const updateProperty = async (req, res) => {
  try {
    const {
      id,
      title,
      price,
      address,
      city,
      state,
      zip,
      latitude,
      longitude,
      neighborhood,
      type,
      property,
      bedrooms,
      bathrooms,
      size,
      lotSize,
      yearBuilt,
      hoaFees,
      leaseLength,
      furnished,
      deposit,
      moveInDate,
      amenities,
      garage,
      basement,
      fireplace,
      pool,
      pet,
      utilities,
      income,
      school,
      bus,
      restaurant,
      description,
      listingStatus,
    } = req.body;

    const userId = req.userId;

    if (!userId)
      return res.status(400).json({ message: "User ID not found from token." });

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Property ID is required" });
    }

    const existingProperty = await prisma.property.findUnique({
      where: { id },
    });

    if (!existingProperty) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Parse amenities
    let amenitiesArray = [];
    try {
      amenitiesArray =
        typeof amenities === "string" ? JSON.parse(amenities) : amenities;
      if (!Array.isArray(amenitiesArray)) amenitiesArray = [];
    } catch {
      amenitiesArray = [];
    }

    // ✅ Delete old images if new ones provided
    // if (req.files?.length) {
    //   const oldImages = existingProperty.images || [];
    //   await Promise.all(
    //     oldImages.map((img) =>
    //       img.publicId ? cloudinary.uploader.destroy(img.publicId) : null
    //     )
    //   );
    // }

    // const uploadedImages = req.files?.length
    //   ? await Promise.all(
    //       req.files.map((file) => ({
    //         url: file.path,
    //         publicId: file.filename,
    //       }))
    //     )
    //   : existingProperty.images;

    // ✅ Combine old images with newly uploaded ones (if any)
    const newImages =
      req.files?.length > 0
        ? await Promise.all(
            req.files.map((file) => ({
              url: file.path,
              publicId: file.filename,
            }))
          )
        : [];

    const uploadedImages = [...(existingProperty.images || []), ...newImages];

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        title,
        slug: slugify(title, { lower: true, strict: true }),
        price: parseFloat(price),
        address,
        city,
        state,
        zip,
        latitude,
        longitude,
        neighborhood,
        type,
        property,
        bedrooms: parseInt(bedrooms),
        bathrooms: parseInt(bathrooms),
        size: parseInt(size),
        lotSize: lotSize ? parseFloat(lotSize) : undefined,
        yearBuilt: yearBuilt ? parseInt(yearBuilt) : undefined,
        hoaFees: hoaFees ? parseInt(hoaFees) : undefined,
        leaseLength,
        furnished: furnished === "true" || furnished === true,
        deposit: deposit ? parseFloat(deposit) : undefined,
        moveInDate: moveInDate ? new Date(moveInDate) : undefined,
        amenities: amenitiesArray,
        garage: garage === "true" || garage === true,
        basement: basement === "true" || basement === true,
        fireplace: fireplace === "true" || fireplace === true,
        pool: pool === "true" || pool === true,
        pet,
        utilities,
        income,
        school,
        bus,
        restaurant,
        description,
        listingStatus,
        images: uploadedImages,
      },
    });

    res.status(200).json({ success: true, data: updatedProperty });
  } catch (error) {
    console.error("Update property error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update property",
      error: error.message,
    });
  }
};

export const deleteProperty = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  console.log("Property ID param:", id);

  if (!userId) {
    return res.status(400).json({ message: "User ID not found from token." });
  }

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Property ID is missing from URL params.",
    });
  }

  try {
    // Find the property
    const property = await prisma.property.findUnique({
      where: { id: id },
    });

    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    // Delete all related PropertyView records
    await prisma.propertyView.deleteMany({
      where: {
        propertyId: id,
      },
    });

    await prisma.bookmark.deleteMany({
      where: {
        propertyId: id,
      },
    });

    await prisma.propertyTourRequest.deleteMany({
      where: {
        propertyId: id,
      },
    });

    await prisma.propertyContactUserRequest.deleteMany({
      where: {
        propertyId: id,
      },
    });
    // Delete images from Cloudinary
    if (Array.isArray(property.images)) {
      for (const image of property.images) {
        if (image?.publicId) {
          await cloudinary.uploader.destroy(image.publicId);
        }
      }
    }

    // Delete property
    await prisma.property.delete({
      where: { id: id },
    });

    res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    console.error("Delete property error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete property",
      error: error.message,
      data: id,
    });
  }
};

export const getPropertyBySlug = async (req, res) => {
  const { slug } = req.params;

  let userId;
  const token = req.headers.authorization?.split(" ")[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch (err) {
      console.warn("Invalid or expired token:", err.message);
    }
  }

  try {
    const property = await prisma.property.findFirst({
      where: {
        slug: slug,
      },
    });
    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    await prisma.property.update({
      where: { id: property.id },
      data: {
        views: {
          increment: 1,
        },
      },
    });

    if (userId) {
      try {
        await prisma.propertyView.create({
          data: {
            userId,
            propertyId: property.id,
          },
        });
      } catch (err) {
        if (
          err.code !== "P2002" ||
          !err.meta?.target?.includes("userId_propertyId")
        ) {
          console.error("Property view tracking failed:", err);
        }
      }
    }

    const relevantProperties = await prisma.property.findMany({
      where: {
        id: { not: property.id },
        address: property?.address || "",
        city: property?.city || "",
        state: property?.state || "",
        type: property?.type || "",
        status: "approved",
        flagged: false,
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      data: {
        property,
        relevantProperties,
      },
    });
  } catch (error) {
    console.error("Get property by slug error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch property" });
  }
};

export const getPropertyById = async (req, res) => {
  const { id } = req.params;

  // Validate ID format if you're using MongoDB ObjectId
  if (!id || id.length !== 24) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid property ID." });
  }

  try {
    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found." });
    }

    res.status(200).json({
      success: true,
      data: { property },
    });
  } catch (error) {
    console.error("Get property by ID error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch property." });
  }
};

// export const getPropertyBySlug = async (req, res) => {
//   const { slug } = req.params;

//   let userId;
//   let role;
//   const token = req.headers.authorization?.split(" ")[1];

//   if (token) {
//     try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       userId = decoded.userId;
//       role = decoded.role;
//     } catch (err) {
//       console.warn("Invalid or expired token:", err.message);
//     }
//   }

//   try {
//     // Conditionally filter by status only if role is NOT agent_broker
//     const property = await prisma.property.findFirst({
//       where: {
//         slug: slug,
//         ...(role !== "agent_broker" && { status: "approved" }),
//       },
//     });

//     if (!property) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Property not found" });
//     }

//     await prisma.property.update({
//       where: { id: property.id },
//       data: {
//         views: {
//           increment: 1,
//         },
//       },
//     });

//     if (userId) {
//       try {
//         await prisma.propertyView.create({
//           data: {
//             userId,
//             propertyId: property.id,
//           },
//         });
//       } catch (err) {
//         if (
//           err.code !== "P2002" ||
//           !err.meta?.target?.includes("userId_propertyId")
//         ) {
//           console.error("Property view tracking failed:", err);
//         }
//       }
//     }

//     const relevantProperties = await prisma.property.findMany({
//       where: {
//         id: { not: property.id },
//         address: property?.address || "",
//         city: property?.city || "",
//         state: property?.state || "",
//         type: property?.type || "",
//         ...(role !== "agent_broker" && { status: "approved" }),
//         flagged: false,
//       },
//       take: 20,
//       orderBy: { createdAt: "desc" },
//     });

//     res.status(200).json({
//       success: true,
//       data: {
//         property,
//         relevantProperties,
//       },
//     });
//   } catch (error) {
//     console.error("Get property by slug error:", error);
//     res
//       .status(500)
//       .json({ success: false, message: "Failed to fetch property" });
//   }
// };

export const trackPropertyView = async (req, res) => {
  const { propertyId } = req.body;

  const userId = req.userId;

  if (!userId)
    return res.status(400).json({ message: "User ID not found from token." });

  // Validate inputs
  if (!userId || !propertyId) {
    return res
      .status(400)
      .json({ success: false, message: "userId and propertyId are required" });
  }

  const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);
  if (!isValidObjectId(userId) || !isValidObjectId(propertyId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid ID format" });
  }

  try {
    // Upsert (update timestamp if already viewed)
    const view = await prisma.propertyView.upsert({
      where: {
        userId_propertyId: { userId, propertyId },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        userId,
        propertyId,
      },
    });

    res
      .status(200)
      .json({ success: true, message: "View tracked", data: view });
  } catch (error) {
    console.error("Track view error:", error);
    res.status(500).json({ success: false, message: "Failed to track view" });
  }
};

export const getRecentPropertyViews = async (req, res) => {
  const { userId } = req.params;

  // const userId = req.userId;

  // if (!userId)
  //   return res.status(400).json({ message: "User ID not found from token." });

  if (!userId || !/^[a-f\d]{24}$/i.test(userId)) {
    return res.status(400).json({ success: false, message: "Invalid userId" });
  }

  try {
    const recentViews = await prisma.propertyView.findMany({
      where: { userId },
      orderBy: { viewedAt: "desc" },
      include: { property: true },
      take: 10, // Optional: limit to latest 10
    });

    res.status(200).json({ success: true, data: recentViews });
  } catch (error) {
    console.error("Get views error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch recent views" });
  }
};

// get property data and bookmark data merge
export const property = async (req, res) => {
  try {
    // 1. Extract token
    const token = req.headers.authorization?.split(" ")[1];
    let userId = null;

    // 2. Decode token synchronously
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        console.warn("Invalid token, skipping user-specific logic.");
      }
    }

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
        { status: "approved", flagged: false },

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
