import { cloudinary } from "../../config/cloudinary.config.js";
import prisma from "../../lib/prisma.js";
const allowedRoles = [
  "homeowner_landlord",
  "agent_broker",
  "loan_officer",
  "property_manager",
];

import slugify from "slugify";

// CREATE
export const createRolePackage = async (req, res) => {
  try {
    const { name, singleListingPrice, features, roleName, listingLimit } =
      req.body;

    if (
      !name ||
      !singleListingPrice ||
      !roleName ||
      !features ||
      !listingLimit
    ) {
      return res.status(400).json({
        error:
          "All fields (name, singleListingPrice, features, roleName, listingLimit) are required.",
      });
    }

    if (!allowedRoles.includes(roleName)) {
      return res.status(400).json({
        error: `Invalid roleName. Allowed values are: ${allowedRoles.join(
          ", "
        )}`,
      });
    }

    const image = req.file;
    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const existingPackage = await prisma.rolePackage.findFirst({
      where: {
        roleName,
        listingLimit: parseInt(listingLimit),
      },
    });

    if (existingPackage) {
      return res.status(409).json({
        error: `A package already exists for role "${roleName}" with listing limit ${listingLimit}.`,
      });
    }

    // Features parsing
    let featuresArray;
    if (typeof features === "string") {
      try {
        featuresArray = JSON.parse(features);
        if (!Array.isArray(featuresArray)) throw new Error();
      } catch {
        featuresArray = features
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean);
      }
    } else if (Array.isArray(features)) {
      featuresArray = features;
    } else {
      return res.status(400).json({ error: "Invalid features format." });
    }

    const slug = slugify(name, { lower: true, strict: true });

    const newPackage = await prisma.rolePackage.create({
      data: {
        name: name.toLowerCase(),
        slug,
        singleListingPrice: parseFloat(singleListingPrice),
        totalPrice: parseFloat(singleListingPrice) * parseInt(listingLimit),
        features: featuresArray,
        roleName,
        status: "active",
        listingLimit: parseInt(listingLimit),
        image: image.path,
        imagePublicId: image.filename,
      },
    });

    res.status(201).json({
      message: "Role package created successfully.",
      data: newPackage,
    });
  } catch (error) {
    console.error("Create Role Package Error:", error.message);
    res.status(500).json({ error: "Something went wrong." });
  }
};

// UPDATE
export const updateRolePackage = async (req, res) => {
  try {
    const {
      id,
      name,
      singleListingPrice,
      features,
      roleName,
      status,
      listingLimit,
    } = req.body;

    // Validation
    if (
      !id ||
      !name ||
      !singleListingPrice ||
      !features ||
      !roleName ||
      status === undefined ||
      !listingLimit
    ) {
      return res.status(400).json({
        error:
          "All fields (id, name, singleListingPrice, features, roleName, status, listingLimit) are required.",
      });
    }

    if (!allowedRoles.includes(roleName)) {
      return res.status(400).json({
        error: `Invalid roleName. Allowed values are: ${allowedRoles.join(
          ", "
        )}`,
      });
    }

    const existing = await prisma.rolePackage.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Role package not found." });
    }

    // Check for duplicate by roleName, listingLimit, singleListingPrice
    const duplicate = await prisma.rolePackage.findFirst({
      where: {
        id: { not: id },
        roleName,
        listingLimit: parseInt(listingLimit),
        singleListingPrice: parseFloat(singleListingPrice),
      },
    });

    if (duplicate) {
      return res.status(409).json({
        error: `Another package already exists for role "${roleName}" with listing limit ${listingLimit} and single price ${singleListingPrice}.`,
      });
    }

    // Parse features
    let featuresArray;
    if (typeof features === "string") {
      try {
        featuresArray = JSON.parse(features);
        if (!Array.isArray(featuresArray)) throw new Error();
      } catch {
        featuresArray = features
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean);
      }
    } else if (Array.isArray(features)) {
      featuresArray = features;
    } else {
      return res.status(400).json({ error: "Invalid features format." });
    }

    const updatedFields = {
      name: name.toLowerCase(),
      slug: slugify(name, { lower: true, strict: true }),
      singleListingPrice: parseFloat(singleListingPrice),
      totalPrice: parseFloat(singleListingPrice) * parseInt(listingLimit),
      listingLimit: parseInt(listingLimit),
      features: featuresArray,
      roleName,
      status,
    };

    // Handle image update
    if (req.file) {
      if (existing.imagePublicId) {
        await cloudinary.uploader.destroy(existing.imagePublicId);
      }
      updatedFields.image = req.file.path;
      updatedFields.imagePublicId = req.file.filename;
    }

    const updatedPackage = await prisma.rolePackage.update({
      where: { id },
      data: updatedFields,
    });

    res.status(200).json({
      message: "Role package updated successfully.",
      data: updatedPackage,
    });
  } catch (error) {
    console.error("Update Role Package Error:", error.message);
    res.status(500).json({ error: "Something went wrong." });
  }
};
// GET ALL
export const getAllRolePackages = async (req, res) => {
  try {
    const packages = await prisma.rolePackage.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({
      total: packages.length,
      data: packages,
    });
  } catch (error) {
    console.error("🔥 Get Role Packages Error:", error.message);
    res.status(500).json({ error: "Failed to fetch role packages." });
  }
};

// GET SINGLE
export const getSingleRolePackage = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({ error: "Role package slug is required." });
    }

    const rolePackage = await prisma.rolePackage.findUnique({
      where: { slug },
    });

    if (!rolePackage) {
      return res.status(404).json({ error: "Role package not found." });
    }

    res.json({
      success: true,
      message: "Role package fetched successfully.",
      data: rolePackage,
    });
  } catch (error) {
    console.error("🔥 Get Single Role Package Error:", error.message);
    res.status(500).json({ error: "Failed to fetch role package." });
  }
};
