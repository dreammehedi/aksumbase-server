import dayjs from "dayjs"; // For date manipulation
import prisma from "../../lib/prisma.js";

export const purchaseRole = async (req, res) => {
  const { rolePackageId, message } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized user." });
  }

  if (!rolePackageId) {
    return res.status(400).json({
      error: "Required fields: rolePackageId.",
    });
  }

  // Image validation
  const imageFile = req.file; // assuming upload.single('image') is used

  if (!imageFile) {
    return res.status(400).json({
      success: false,
      message: "Image is required.",
    });
  }

  try {
    // 1. Check if role package exists
    const rolePackage = await prisma.rolePackage.findUnique({
      where: { id: rolePackageId },
    });

    if (!rolePackage) {
      return res.status(404).json({ error: "Role package not found." });
    }

    // 2. Prevent duplicate submission
    const existingPurchase = await prisma.userRole.findFirst({
      where: {
        userId,
        rolePackageId,
      },
    });

    if (existingPurchase) {
      return res.status(400).json({
        error: "You have already submitted this role package.",
      });
    }

    // 3. Create new userRole with image info
    const newUserRole = await prisma.userRole.create({
      data: {
        userId,
        rolePackageId,
        message: message || null,
        image: imageFile.path,
        imagePublicId: imageFile.filename,
        isActive: false,
        isPaused: false,
        isExpired: false,
        isVerified: false,
      },
    });

    res.status(201).json({
      message: "Your request has been submitted for verification.",
      data: newUserRole,
    });
  } catch (error) {
    console.error("Purchase Role Error:", error.message);
    res.status(500).json({ error: "Failed to submit role purchase." });
  }
};

export const activateRole = async (req, res) => {
  const { userId, rolePackageId } = req.body;
  const adminId = req.userId;

  // Validate admin
  if (!adminId) {
    return res.status(400).json({ message: "Admin ID not found from token." });
  }

  // Validate required fields
  if (!userId || !rolePackageId) {
    return res
      .status(400)
      .json({ message: "userId and rolePackageId are required." });
  }

  try {
    // 1. Find the userRole record by userId + rolePackageId
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId,
        rolePackageId,
      },
      include: {
        rolePackage: true,
      },
    });

    if (!userRole) {
      return res.status(404).json({ error: "User role not found." });
    }

    // 2. Prevent re-activation
    if (userRole.isActive) {
      return res.status(400).json({ error: "This role is already active." });
    }

    // 3. Calculate start and end dates
    const startDate = new Date();
    const endDate = dayjs(startDate)
      .add(userRole.rolePackage.durationDays, "day")
      .toDate();

    // 4. Activate the user role
    const activatedRole = await prisma.userRole.update({
      where: { id: userRole.id },
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
    console.error("Activate Role Error:", error.message);
    res.status(500).json({ error: "Failed to activate role." });
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
  const { userId, rolePackageId } = req.body;

  if (!userId || !rolePackageId) {
    return res.status(400).json({
      error: "Both userId and rolePackageId are required.",
    });
  }

  try {
    // 1. Get userRole by user and package
    const role = await prisma.userRole.findFirst({
      where: {
        userId,
        rolePackageId,
      },
      include: { rolePackage: true },
    });

    if (!role) {
      return res.status(404).json({
        error: "Role not found for this user and package.",
      });
    }

    // 2. Check if expired based on endDate
    const now = new Date();
    const isActuallyExpired = role.endDate && dayjs(role.endDate).isBefore(now);

    if (!isActuallyExpired && !role.isExpired) {
      return res.status(400).json({
        error: "Role is not expired yet. Cannot renew.",
      });
    }

    // 3. Optionally update isExpired in DB if it's outdated
    if (isActuallyExpired && !role.isExpired) {
      await prisma.userRole.update({
        where: { id: role.id },
        data: { isExpired: true },
      });
    }

    // 4. Calculate new start/end date
    const newStartDate = new Date();
    const newEndDate = dayjs(newStartDate)
      .add(role.rolePackage.durationDays, "day")
      .toDate();

    // 5. Renew the role
    const renewed = await prisma.userRole.update({
      where: { id: role.id },
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
    console.error("Renew Role Error:", error.message);
    res.status(500).json({ error: "Failed to renew role." });
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
