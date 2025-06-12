import prisma from "../../lib/prisma.js";

export const createRolePackage = async (req, res) => {
  try {
    const { name, price, durationDays, features, roleName } = req.body;

    let featuresArray;

    if (typeof features === "string") {
      // Try parsing JSON string or comma-separated string
      try {
        featuresArray = JSON.parse(features); // For JSON string: '["a", "b"]'
      } catch {
        featuresArray = features.split(",").map((f) => f.trim()); // Fallback to comma-separated
      }
    } else {
      featuresArray = features;
    }

    const newPackage = await prisma.rolePackage.create({
      data: {
        name,
        price: parseFloat(price),
        durationDays: parseInt(durationDays),
        features: featuresArray,
        roleName,
      },
    });

    res.status(201).json(newPackage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all Role Packages
export const getAllRolePackages = async (req, res) => {
  try {
    const packages = await prisma.rolePackage.findMany();
    res.json(packages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
