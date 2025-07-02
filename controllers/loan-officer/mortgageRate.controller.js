import prisma from "../../lib/prisma.js";

// Get all mortgage rates (ordered)
export const getMortgageRate = async (req, res) => {
  try {
    const data = await prisma.mortgageRate.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get mortgage rate error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch mortgage rate" });
  }
};

// List mortgage rates with pagination & optional filters
export const mortgageRate = async (req, res) => {
  try {
    const { skip = 0, limit = 10 } = req.pagination || {};
    const search = req.query.search || "";

    const where = {
      OR: [
        { loanType: { contains: search, mode: "insensitive" } },
        { creditScore: { contains: search, mode: "insensitive" } },
        { homePurpose: { contains: search, mode: "insensitive" } },
      ],
    };

    const data = await prisma.mortgageRate.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.mortgageRate.count({ where });

    res.status(200).json({
      success: true,
      data,
      pagination: { total, skip: Number(skip), limit: Number(limit) },
    });
  } catch (error) {
    console.error("List mortgage rates error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch mortgage rates" });
  }
};

// Create mortgage rate (loan officer only)
export const createMortgageRate = async (req, res) => {
  try {
    const { type, rate, loanType, creditScore, homePurpose } = req.body;
    const userId = req.userId;

    if (!type || !rate || !loanType) {
      return res.status(400).json({
        success: false,
        message: "Type, rate and loanType are required.",
      });
    }

    const newRate = await prisma.mortgageRate.create({
      data: {
        type,
        rate: parseFloat(rate),
        loanType,
        creditScore: creditScore || null,
        homePurpose: homePurpose || null,
        user: {
          connect: { id: userId },
        },
      },
    });

    res.status(201).json({ success: true, data: newRate });
  } catch (error) {
    console.error("Create mortgage rate error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update mortgage rate (loan officer only)
export const updateMortgageRate = async (req, res) => {
  try {
    const { id, type, rate, loanType, creditScore, homePurpose } = req.body;
    const userId = req.userId;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Mortgage rate ID required." });
    }

    const existingRate = await prisma.mortgageRate.findUnique({
      where: { id },
    });

    if (!existingRate) {
      return res
        .status(404)
        .json({ success: false, message: "Mortgage rate not found." });
    }

    if (existingRate.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this mortgage rate.",
      });
    }

    const updatedRate = await prisma.mortgageRate.update({
      where: { id },
      data: {
        type: type || existingRate.type,
        rate: rate ? parseFloat(rate) : existingRate.rate,
        loanType: loanType || existingRate.loanType,
        creditScore: creditScore || existingRate.creditScore,
        homePurpose: homePurpose || existingRate.homePurpose,
      },
    });

    res.json({ success: true, data: updatedRate });
  } catch (error) {
    console.error("Update mortgage rate error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete mortgage rate (loan officer only)
export const deleteMortgageRate = async (req, res) => {
  try {
    const { id } = req.body;
    const userId = req.userId;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Mortgage rate ID required." });
    }

    const existingRate = await prisma.mortgageRate.findUnique({
      where: { id },
    });

    if (!existingRate) {
      return res
        .status(404)
        .json({ success: false, message: "Mortgage rate not found." });
    }

    if (existingRate.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this mortgage rate.",
      });
    }

    await prisma.mortgageRate.delete({ where: { id } });

    res.json({ success: true, message: "Mortgage rate deleted successfully." });
  } catch (error) {
    console.error("Delete mortgage rate error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
