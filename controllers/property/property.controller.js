import { PrismaClient } from "@prisma/client";
import slugify from "slugify";
import { cloudinary } from "../../config/cloudinary.config.js";

const prisma = new PrismaClient();

export const getProperty = async (req, res) => {
  try {
    const data = await prisma.property.findMany({
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

// export const property = async (req, res) => {
//   try {
//     const { skip = 0, limit = 10 } = req.pagination || {};
//     const search = req.query.search || "";

//     const where = {
//       OR: [
//         { title: { contains: search, mode: "insensitive" } },
//         { slug: { contains: search, mode: "insensitive" } },
//       ],
//     };

//     const data = await prisma.property.findMany({
//       where,
//       skip: Number(skip),
//       take: Number(limit),
//       orderBy: { createdAt: "desc" },
//     });

//     const total = await prisma.blog.count({ where });

//     res.status(200).json({
//       success: true,
//       data,
//       pagination: { total, skip: Number(skip), limit: Number(limit) },
//     });
//   } catch (error) {
//     console.error("Get property error:", error);
//     res
//       .status(500)
//       .json({ success: false, message: "Failed to fetch property" });
//   }
// };

export const property = async (req, res) => {
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
      listingStatus,
      listingType,
      userId,
    } = req.body;

    console.log(req.body);
    if (
      !title ||
      !type ||
      !property ||
      !price ||
      !bedrooms ||
      !bathrooms ||
      !size ||
      !description ||
      !userId
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
    console.log(uploadedImages, "uploadedImages");
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
        listingStatus,
        listingType,
        userId,
        status: user?.role === "agent" ? "approved" : "pending",
        userName: user?.username,
        userAvatar: user?.image,
        userEmail: user?.email,
        images: uploadedImages,
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
      listingType,
      userId,
    } = req.body;

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
    if (req.files?.length) {
      const oldImages = existingProperty.images || [];
      await Promise.all(
        oldImages.map((img) =>
          img.publicId ? cloudinary.uploader.destroy(img.publicId) : null
        )
      );
    }

    const uploadedImages = req.files?.length
      ? await Promise.all(
          req.files.map((file) => ({
            url: file.path,
            publicId: file.filename,
          }))
        )
      : existingProperty.images;

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
        listingType,
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

  try {
    const property = await prisma.property.findUnique({ where: { id } });

    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    // Delete all images from Cloudinary
    if (Array.isArray(property.images)) {
      for (const image of property.images) {
        if (image?.publicId) {
          await cloudinary.uploader.destroy(image.publicId);
        }
      }
    }

    // Delete property from DB
    await prisma.property.delete({ where: { id } });

    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete property error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete property",
      error: error.message,
    });
  }
};

export const getPropertyBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const property = await prisma.property.findUnique({
      where: { slug },
    });

    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    // Update the visit count
    await prisma.property.update({
      where: { slug },
      data: {
        views: {
          increment: 1, // increment visitCount by 1
        },
      },
    });

    res.status(200).json({ success: true, data: property });
  } catch (error) {
    console.error("Get property by slug error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch property" });
  }
};
