import dayjs from "dayjs"; // For date manipulation
import prisma from "../../lib/prisma.js";

export const purchaseRole = async (req, res) => {
  const {
    rolePackageId,
    fullName,
    phone,
    address,
    message,
    passportNum,
    nidNum,
  } = req.body;

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

    if (!passportNum || !nidNum) {
      return res
        .status(400)
        .json({ error: "Both passport and NID PDFs are required." });
    }

    // 3. Create user role request without setting start/end date
    const newUserRole = await prisma.userRole.create({
      data: {
        userId,
        rolePackageId,
        isActive: false,
        isPaused: false,
        isExpired: false,
        fullName,
        phone,
        nid: nidNum,
        Passport: passportNum,
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

export const activateRole = async (req, res) => {
  const { userRoleId } = req.body;
  const adminId = req.userId;

  if (!adminId) {
    return res.status(400).json({ message: "Admin ID not found from token." });
  }

  try {
    // 1. Find the specific user role with package info
    const userRole = await prisma.userRole.findUnique({
      where: { id: userRoleId },
      include: { rolePackage: true },
    });

    if (!userRole) {
      return res.status(404).json({ error: "User role not found." });
    }

    // 2. Prevent re-activation if already active
    if (userRole.isActive) {
      return res.status(400).json({ error: "Role is already active." });
    }

    // 3. Calculate duration
    const startDate = new Date();
    const endDate = dayjs(startDate)
      .add(userRole.rolePackage.durationDays, "day")
      .toDate();

    // 5. Activate and verify the selected role
    const activatedRole = await prisma.userRole.update({
      where: { id: userRoleId },
      data: {
        startDate,
        endDate,
        isActive: true,
        isPaused: false,
        isExpired: false,
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: adminId,
      },
    });

    res.status(200).json({
      message: "Role activated and verified successfully.",
      data: activatedRole,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Pause a role
// export const pauseRole = async (req, res) => {
//   const { userRoleId } = req.body;

//   try {
//     const userRole = await prisma.userRole.findUnique({
//       where: { id: userRoleId },
//     });

//     if (!userRole) {
//       return res.status(404).json({ error: "User role not found" });
//     }

//     // 2. Check if it's already inactive
//     if (!userRole.isActive) {
//       return res
//         .status(400)
//         .json({ error: "Role is not active, cannot pause." });
//     }

//     // 3. Pause the role
//     const paused = await prisma.userRole.update({
//       where: { id: userRoleId },
//       data: {
//         isActive: false,
//         isPaused: true,
//       },
//     });

//     res.json(paused);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
// Renew expired role
export const renewRole = async (req, res) => {
  const { userRoleId } = req.body;

  try {
    const role = await prisma.userRole.findUnique({
      where: { id: userRoleId },
      include: { rolePackage: true },
    });

    if (!role) {
      return res.status(404).json({ error: "Role not found." });
    }

    if (!role.isExpired) {
      return res
        .status(400)
        .json({ error: "Role is not expired, cannot renew." });
    }

    // 3. Set new duration
    const newStartDate = new Date();
    const newEndDate = dayjs(newStartDate)
      .add(role.rolePackage.durationDays, "day")
      .toDate();

    // 4. Renew the role
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

    res.status(200).json({
      message: "Role renewed successfully.",
      data: renewed,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all user role applications (Admin only)
export const getAllUserRoleApplications = async (req, res) => {
  const adminId = req.userId; // assume admin auth middleware already used

  if (!adminId) {
    return res.status(401).json({ error: "Unauthorized access." });
  }

  try {
    const userRoles = await prisma.userRole.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        rolePackage: {
          select: {
            id: true,
            name: true,
            durationDays: true,
            price: true,
          },
        },
      },
    });

    res.status(200).json({
      message: "User role applications fetched successfully.",
      data: userRoles,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
