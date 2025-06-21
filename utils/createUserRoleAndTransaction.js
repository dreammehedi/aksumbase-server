import prisma from "../lib/prisma.js";

// utils/createUserRoleAndTransaction.js
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
