import dayjs from "dayjs"; // For date manipulation
import stripeConfig from "../../config/stripe.config.js";
import prisma from "../../lib/prisma.js";

// export const createRolePurchaseIntent = async (req, res) => {
//   try {
//     const stripe = await stripeConfig(); // ✅ secret key used here

//     const { rolePackageId, currency = "usd", metadata = {} } = req.body;
//     const userId = req.userId;

//     if (!userId) {
//       return res.status(401).json({ message: "Unauthorized user." });
//     }

//     if (!rolePackageId) {
//       return res.status(400).json({
//         error: "Required field: rolePackageId.",
//       });
//     }

//     const rolePackage = await prisma.rolePackage.findUnique({
//       where: { id: rolePackageId },
//     });

//     if (!rolePackage || !rolePackage?.price) {
//       return res.status(404).json({ error: "Role package not found." });
//     }

//     const existingActiveRole = await prisma.userRole.findFirst({
//       where: {
//         userId,
//         isExpired: false,
//       },
//     });

//     if (existingActiveRole) {
//       return res.status(400).json({
//         error:
//           "You already have an active or pending role package. Please wait until it expires or gets reviewed.",
//       });
//     }

//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: Math.round((rolePackage.price || 0) * 100),
//       currency,
//       metadata,
//     });

//     res.status(200).json({
//       success: true,
//       clientSecret: paymentIntent?.client_secret,
//     });
//   } catch (err) {
//     console.error("Stripe error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Payment failed",
//       error: err.message,
//     });
//   }
// };

export const createRolePurchaseIntent = async (req, res) => {
  try {
    const stripe = await stripeConfig();
    const { rolePackageId, currency = "usd", metadata = {} } = req.body;
    const userId = req.userId;

    if (!userId) return res.status(401).json({ message: "Unauthorized user." });

    if (!rolePackageId) {
      return res.status(400).json({ error: "Required field: rolePackageId." });
    }

    const rolePackage = await prisma.rolePackage.findUnique({
      where: { id: rolePackageId },
    });

    if (!rolePackage || !rolePackage.price) {
      return res.status(404).json({ error: "Role package not found." });
    }

    const existingActiveRole = await prisma.userRole.findFirst({
      where: { userId, isExpired: false },
    });

    if (existingActiveRole) {
      return res.status(400).json({
        error: "You already have an active or pending role package.",
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: req.userEmail, // optional, if you have user's email
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: rolePackage.name,
              description: rolePackage.roleName,
            },
            unit_amount: Math.round(rolePackage.price * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        rolePackageId,
        ...metadata,
      },
      invoice_creation: { enabled: true }, // ✅ Enable invoice
      success_url: `${process.env.FRONTEND_LINK}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_LINK}/payment-cancelled`,
    });

    res.status(200).json({
      success: true,
      url: session.url,
    });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({
      success: false,
      message: "Checkout session creation failed",
      error: err.message,
    });
  }
};
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    const stripe = await stripeConfig();
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const { userId, rolePackageId } = session.metadata;
    const amount = session.amount_total / 100;
    const currency = session.currency;
    const paymentStatus = session.payment_status;
    const stripeId = session.id;
    const invoiceUrl = session.invoice ? session.invoice : null;

    try {
      // Create the user role record
      const userRole = await prisma.userRole.create({
        data: {
          userId,
          rolePackageId,
          message: null,
          isActive: false,
          isPaused: false,
          isExpired: false,
          isVerified: false,
        },
      });

      // Create transaction
      await prisma.transaction.create({
        data: {
          userId,
          userRoleId: userRole.id,
          amount,
          currency,
          status: paymentStatus,
          method: session.payment_method_types[0] || "card",
          stripeId,
        },
      });

      res.status(200).send("Payment and role creation handled successfully");
    } catch (err) {
      console.error("Error during webhook handling:", err);
      res.status(500).send("Internal server error");
    }
  } else {
    res.status(200).send("Webhook event ignored");
  }
};

// export const purchaseRole = async (req, res) => {
//   const { rolePackageId, message } = req.body;
//   const userId = req.userId;

//   // 1. Auth check
//   if (!userId) {
//     return res.status(401).json({ message: "Unauthorized user." });
//   }

//   // 2. Role package ID check
//   if (!rolePackageId) {
//     return res.status(400).json({
//       error: "Required fields: rolePackageId.",
//     });
//   }

//   // 3. Image file check (assuming middleware: upload.single('image'))
//   const imageFile = req.file;
//   if (!imageFile) {
//     return res.status(400).json({
//       success: false,
//       message: "Image is required.",
//     });
//   }

//   try {
//     // 4. Check if the role package exists
//     const rolePackage = await prisma.rolePackage.findUnique({
//       where: { id: rolePackageId },
//     });

//     if (!rolePackage) {
//       return res.status(404).json({ error: "Role package not found." });
//     }

//     // 5. Check if user already has an active or pending role (not expired)
//     const existingActiveRole = await prisma.userRole.findFirst({
//       where: {
//         userId,
//         isExpired: false, // still active or awaiting verification
//       },
//     });

//     if (existingActiveRole) {
//       return res.status(400).json({
//         error:
//           "You already have an active or pending role package. Please wait until it expires or gets reviewed.",
//       });
//     }

//     // 6. Create new userRole with image
//     const newUserRole = await prisma.userRole.create({
//       data: {
//         userId,
//         rolePackageId,
//         message: message || null,
//         image: imageFile.path,
//         imagePublicId: imageFile.filename,
//         isActive: false,
//         isPaused: false,
//         isExpired: false,
//         isVerified: false,
//       },
//     });

//     // 7. Respond success
//     res.status(201).json({
//       message: "Your request has been submitted for verification.",
//       data: newUserRole,
//     });
//   } catch (error) {
//     console.error("Purchase Role Error:", error.message);
//     res.status(500).json({ error: "Failed to submit role purchase." });
//   }
// };

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
