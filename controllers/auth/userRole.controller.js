import dayjs from "dayjs"; // For date manipulation
import prisma from "../../lib/prisma.js";

export const purchaseRole = async (req, res) => {
  const { rolePackageId, fullName, phone, address, message } = req.body;

  const userId = req.userId;

  if (!userId)
    return res.status(400).json({ message: "User ID not found from token." });

  // Validate required fields
  if (!rolePackageId || !fullName || !phone || !address) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    // 1. Check if role package exists
    const rolePackage = await prisma.rolePackage.findUnique({
      where: { id: rolePackageId },
    });

    if (!rolePackage) {
      return res.status(404).json({ error: "Role package not found" });
    }

    // 2. Check if already purchased
    const existingPurchase = await prisma.userRole.findFirst({
      where: { userId, rolePackageId },
    });

    if (existingPurchase) {
      return res.status(400).json({ error: "Already purchased." });
    }

    // 3. Extract uploaded files from Cloudinary via multer
    const passportFile = req.files["passport"]?.[0];
    const nidFile = req.files["nid"]?.[0];

    if (!passportFile || !nidFile) {
      return res
        .status(400)
        .json({ error: "Both passport and NID PDFs are required." });
    }

    const documentUrls = {
      passport: passportFile.path || passportFile.url,
      nid: nidFile.path || nidFile.url,
    };

    // 4. Create user role request
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
        fullName,
        phone,
        nid: documentUrls.nid,
        Passport: documentUrls.passport,
        address,
        message: message || null,
        isVerified: false,
      },
    });

    res.status(201).json({
      message: "Submitted for verification.",
      data: newUserRole,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Activate specific role
export const activateRole = async (req, res) => {
  const { userRoleId } = req.body;
  const userId = req.userId;

  if (!userId)
    return res.status(400).json({ message: "User ID not found from token." });

  try {
    // 1. Find the specific user role
    const userRole = await prisma.userRole.findUnique({
      where: { id: userRoleId },
    });

    if (!userRole) {
      return res.status(404).json({ error: "User role not found." });
    }

    // 2. Check if it belongs to the user
    if (userRole.userId !== userId) {
      return res.status(403).json({
        error: "You cannot activate a role that doesn't belong to you.",
      });
    }

    // 3. Check if the role is expired
    const now = new Date();
    if (userRole.isExpired || userRole.endDate < now) {
      return res
        .status(400)
        .json({ error: "Cannot activate an expired role." });
    }

    // 4. Pause all other roles
    await prisma.userRole.updateMany({
      where: {
        userId,
        NOT: { id: userRoleId },
      },
      data: { isActive: false, isPaused: true },
    });

    // 5. Activate the selected role
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
    const userRole = await prisma.userRole.findUnique({
      where: { id: userRoleId },
    });

    if (!userRole) {
      return res.status(404).json({ error: "User role not found" });
    }

    // 2. Check if it's already inactive
    if (!userRole.isActive) {
      return res
        .status(400)
        .json({ error: "Role is not active, cannot pause." });
    }

    // 3. Pause the role
    const paused = await prisma.userRole.update({
      where: { id: userRoleId },
      data: {
        isActive: false,
        isPaused: true,
      },
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

    if (!role.isExpired) {
      return res
        .status(400)
        .json({ error: "Role is not expired, cannot renew." });
    }

    // 3. Renew logic
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
