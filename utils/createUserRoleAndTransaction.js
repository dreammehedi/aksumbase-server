import dayjs from "dayjs";
import stripeConfig from "../config/stripe.config.js";
import prisma from "../lib/prisma.js";

// role package purchase stripe webhook & transation
export const createUserRoleAndTransaction = async (session) => {
  const { userId, rolePackageId } = session.metadata;
  const stripeId = session.id;
  const amount = session.amount_total / 100;
  const currency = session.currency;
  const paymentStatus = session.payment_status;
  const paymentMethod = session.payment_method_types?.[0] || "card";

  // Check if already created (by webhook or frontend)
  const existingTx = await prisma.transaction.findFirst({
    where: { stripeId },
  });

  if (existingTx) {
    return { alreadyExists: true };
  }

  // Get invoice URL
  let invoiceUrl = null;
  if (session.invoice) {
    const stripe = await stripeConfig();
    const invoice = await stripe.invoices.retrieve(session.invoice);
    invoiceUrl = invoice.hosted_invoice_url;
  }

  // Create role (inactive by default)
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
      method: paymentMethod,
      stripeId,
      invoiceUrl,
    },
  });

  return { success: true };
};

// role package renew purchase stripe webhook & transation
export const createRenewUserRoleAndTransaction = async (session) => {
  const userId = session.metadata.userId;
  const rolePackageId = session.metadata.rolePackageId;
  const renewUserRoleId = session.metadata.renewUserRoleId;

  const stripeId = session.id;
  const amount = session.amount_total / 100;
  const currency = session.currency;
  const paymentStatus = session.payment_status;
  const paymentMethod = session.payment_method_types?.[0] || "card";

  try {
    // ✅ Step 1: Prevent duplicate transaction
    const existingTx = await prisma.transaction.findFirst({
      where: { stripeId },
    });
    if (existingTx) return { alreadyExists: true };

    // ✅ Step 2: Get role package
    const rolePackage = await prisma.rolePackage.findUnique({
      where: { id: rolePackageId },
    });
    if (!rolePackage) throw new Error("Role package not found.");

    // ✅ Step 3: Validate existing expired userRole
    if (!renewUserRoleId) {
      throw new Error(
        "renewUserRoleId missing. Cannot renew without existing expired role."
      );
    }

    const now = new Date();
    const newEndDate = dayjs(now).add(rolePackage.durationDays, "day").toDate();

    const updatedRole = await prisma.userRole.update({
      where: { id: renewUserRoleId },
      data: {
        startDate: now,
        endDate: newEndDate,
        isExpired: false,
        isActive: true,
        isPaused: false,
      },
    });

    // ✅ Step 4: Fetch invoice URL (optional)
    let invoiceUrl = null;
    if (session.invoice) {
      const stripe = await stripeConfig();
      const invoice = await stripe.invoices.retrieve(session.invoice);
      invoiceUrl = invoice.hosted_invoice_url;
    }

    // ✅ Step 5: Create transaction
    await prisma.transaction.create({
      data: {
        userId,
        userRoleId: updatedRole.id,
        amount,
        currency,
        status: paymentStatus,
        method: paymentMethod,
        stripeId,
        invoiceUrl,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("❌ Error in createRenewUserRoleAndTransaction:", error);
    return { error: error.message };
  }
};
