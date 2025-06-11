import prisma from "../../lib/prisma.js";

// Create Role Package (Admin)
export const createRolePackage = async (req, res) => {
  try {
    const { name, price, durationDays, features } = req.body;

    const newPackage = await prisma.rolePackage.create({
      data: {
        name,
        price,
        durationDays,
        features,
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
