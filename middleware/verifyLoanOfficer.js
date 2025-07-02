import prisma from "../lib/prisma.js";
import { createError } from "../utils/error.js";

export const verifyLoanOfficer = async (req, res, next) => {
  try {
    const userId = req.userId;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    // Check if user exists and is an loan_officer
    if (!user || user.role !== "loan_officer") {
      return next(
        createError(403, "You are not authorized to access this resource")
      );
    }

    next();
  } catch (error) {
    next(createError(500, "Error verifying loan officer status"));
  }
};
