import dayjs from "dayjs"; // For date manipulation
import prisma from "../../lib/prisma.js";

// Purchase role package
export const purchaseRole = async (req, res) => {
  const { userId, rolePackageId } = req.body;

  try {
    const rolePackage = await prisma.rolePackage.findUnique({
      where: { id: rolePackageId },
    });
    if (!rolePackage)
      return res.status(404).json({ error: "Role package not found" });

    const startDate = new Date();
    const endDate = dayjs(startDate)
      .add(rolePackage.durationDays, "day")
      .toDate();

    const newUserRole = await prisma.userRole.create({
      data: {
        userId,
        rolePackageId,
        startDate,
        endDate,
        isActive: false,
        isPaused: false,
        isExpired: false,
      },
    });

    res.status(201).json(newUserRole);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Activate specific role
export const activateRole = async (req, res) => {
  const { userId, userRoleId } = req.body;

  try {
    // Pause all others
    await prisma.userRole.updateMany({
      where: { userId },
      data: { isActive: false, isPaused: true },
    });

    // Activate selected
    const activeRole = await prisma.userRole.update({
      where: { id: userRoleId },
      data: { isActive: true, isPaused: false },
    });

    res.json(activeRole);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Pause a role
export const pauseRole = async (req, res) => {
  const { userRoleId } = req.body;

  try {
    const paused = await prisma.userRole.update({
      where: { id: userRoleId },
      data: { isActive: false, isPaused: true },
    });

    res.json(paused);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Renew expired role
export const renewRole = async (req, res) => {
  const { userRoleId } = req.body;

  try {
    const role = await prisma.userRole.findUnique({
      where: { id: userRoleId },
      include: { rolePackage: true },
    });
    if (!role) return res.status(404).json({ error: "Role not found" });

    const newStartDate = new Date();
    const newEndDate = dayjs(newStartDate)
      .add(role.rolePackage.durationDays, "day")
      .toDate();

    const renewed = await prisma.userRole.update({
      where: { id: userRoleId },
      data: {
        startDate: newStartDate,
        endDate: newEndDate,
        isExpired: false,
        isActive: true,
        isPaused: false,
      },
    });

    res.json(renewed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
