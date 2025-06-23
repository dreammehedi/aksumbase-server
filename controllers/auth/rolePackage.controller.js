import prisma from "../../lib/prisma.js";
const allowedRoles = [
  "homeowner_landlord",
  "agent_broker",
  "loan_officer",
  "property_manager",
];

export const createRolePackage = async (req, res) => {
  try {
    const { name, price, durationDays, features, roleName } = req.body;

    if (!name || !price || !durationDays || !roleName || !features) {
      return res.status(400).json({
        error:
          "All fields (name, price, durationDays, features, roleName) are required.",
      });
    }

    if (!allowedRoles.includes(roleName)) {
      return res.status(400).json({
        error: `Invalid roleName. Allowed values are: ${allowedRoles.join(
          ", "
        )}`,
      });
    }

    // Check for duplicate price + durationDays on same roleName
    const existingPackage = await prisma.rolePackage.findFirst({
      where: {
        roleName,
        price: parseFloat(price),
        durationDays: parseInt(durationDays),
      },
    });

    if (existingPackage) {
      return res.status(409).json({
        error: `A package already exists for role "${roleName}" with price ${price} and duration ${durationDays} days.`,
      });
    }

    if (existingPackage) {
      return res.status(409).json({
        error:
          "A package with the same name, role, price, and duration already exists.",
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

    const newPackage = await prisma.rolePackage.create({
      data: {
        name: name.toLowerCase(),
        price: parseFloat(price),
        durationDays: parseInt(durationDays),
        features: featuresArray,
        roleName,
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

export const updateRolePackage = async (req, res) => {
  try {
    const { id, name, price, durationDays, features, roleName } = req.body;

    if (!name || !price || !durationDays || !roleName || !features) {
      return res.status(400).json({
        error:
          "All fields (name, price, durationDays, features, roleName) are required.",
      });
    }

    if (!allowedRoles.includes(roleName)) {
      return res.status(400).json({
        error: `Invalid roleName. Allowed values are: ${allowedRoles.join(
          ", "
        )}`,
      });
    }

    // Check if package exists
    const existing = await prisma.rolePackage.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Role package not found." });
    }

    // Check for duplicate price + durationDays on same roleName, excluding current one
    const duplicate = await prisma.rolePackage.findFirst({
      where: {
        id: { not: id },
        roleName,
        price: parseFloat(price),
        durationDays: parseInt(durationDays),
      },
    });

    if (duplicate) {
      return res.status(409).json({
        error: `Another package already exists for role "${roleName}" with price ${price} and duration ${durationDays} days.`,
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

    const updatedPackage = await prisma.rolePackage.update({
      where: { id },
      data: {
        name: name.toLowerCase(),
        price: parseFloat(price),
        durationDays: parseInt(durationDays),
        features: featuresArray,
        roleName,
      },
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
