import dayjs from "dayjs"; // For date manipulation
import stripeConfig from "../../config/stripe.config.js";
import prisma from "../../lib/prisma.js";
import {
  createRenewUserRoleAndTransaction,
  createUserRoleAndTransaction,
} from "../../utils/createUserRoleAndTransaction.js";

export const createRolePurchaseIntent = async (req, res) => {
  try {
    const stripe = await stripeConfig();
    const {
      rolePackageId,
      durationDays,
      currency = "usd",
      metadata = {},
    } = req.body;
    const userId = req.userId;

    if (!userId) return res.status(401).json({ message: "Unauthorized user." });

    if (!rolePackageId || !durationDays) {
      return res
        .status(400)
        .json({ error: "Required fields: rolePackageId, durationDays." });
    }
    // Validate durationDays
    if (durationDays < 30) {
      return res
        .status(400)
        .json({ error: "DurationDays must be a positive number." });
    }
    const rolePackage = await prisma.rolePackage.findUnique({
      where: { id: rolePackageId },
    });

    if (!rolePackage || !rolePackage.totalPrice) {
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
    const singleMonth = durationDays / 30;
    const totalListings = rolePackage.listingLimit * singleMonth;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: req.userEmail,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: rolePackage.name,
              description: rolePackage.roleName,
            },
            unit_amount: Math.round(rolePackage.totalPrice * singleMonth * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        rolePackageId,
        durationDays,
        totalListings,
        ...metadata,
      },
      invoice_creation: { enabled: true },
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

// role package purchase stripe webhook
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event = req.body;

  try {
    const stripe = await stripeConfig(); // returns Stripe instance
    const config = await prisma.stripeConfiguration.findFirst(); // your custom DB config

    if (!config || !config.stripeWebhookSecret) {
      throw new Error("Stripe webhook secret not found in DB");
    }
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      await createUserRoleAndTransaction(session);

      return res.status(200).send("Handled");
    } catch (err) {
      return res.status(500).send("Internal error");
    }
  }

  return res.status(200).send("Event ignored");
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

    // ✅ 3. Fetch the current user (to get current role)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // 4. Calculate start and end dates
    const startDate = new Date();
    const endDate = dayjs(startDate).add(userRole.durationDays, "day").toDate();

    // 5. Activate the user role
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

    // 6. Update the User's role and store previousRole
    await prisma.user.update({
      where: { id: userId },
      data: {
        previousRole: user.role, // ✅ Store current role
        role: userRole.rolePackage.roleName, // ✅ Set new role
      },
    });

    res.status(200).json({
      success: true,
      message: "Role activated and verified successfully.",
      data: activatedRole,
    });
  } catch (error) {
    console.error("Activate Role Error:", error.message);
    res.status(500).json({ error: "Failed to activate role." });
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
            singleListingPrice: true,
            totalPrice: true,
            listingLimit: true,
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

export const handleRolePackageFrontendSuccess = async (req, res) => {
  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: "Session ID is required" });
  }

  try {
    const stripe = await stripeConfig();

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const result = await createUserRoleAndTransaction(session);

    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("Frontend payment-success error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// role package renew purchase stripe webhook
export const handleRenewStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event = req.body;
  console.log(event, "event renew role purchase webhook");
  try {
    const stripe = await stripeConfig(); // returns Stripe instance
    const config = await prisma.stripeConfiguration.findFirst(); // your custom DB config

    if (!config || !config.stripeWebhookSecret) {
      throw new Error("Stripe webhook secret not found in DB");
    }
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      await createRenewUserRoleAndTransaction(session);

      return res.status(200).send("Handled");
    } catch (err) {
      return res.status(500).send("Internal error");
    }
  } else {
    res.json({ received: true }); // acknowledge other events
  }
};

// role package renew purchase success for frontned
export const handleRenewRolePackageFrontendSuccess = async (req, res) => {
  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: "Session ID is required" });
  }

  try {
    const stripe = await stripeConfig();

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const result = await createRenewUserRoleAndTransaction(session);

    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("Frontend payment-success error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
