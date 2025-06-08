import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getMarketTrends = async (req, res) => {
  try {
    const data = await prisma.marketTrends.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get market trends error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch market trends" });
  }
};

export const marketTrends = async (req, res) => {
  try {
    const { skip = 0, limit = 10 } = req.pagination || {};
    const search = req.query.search || "";

    // Construct Prisma-compatible filter
    const where = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { status: { contains: search, mode: "insensitive" } },
      ],
    };

    // Fetch paginated results
    const data = await prisma.marketTrends.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });

    // Count for frontend pagination
    const total = await prisma.marketTrends.count({ where });

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        skip: Number(skip),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("Get market trends error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch market trends",
    });
  }
};

// ✅ POST /api/market-trends
export const createMarketTrend = async (req, res) => {
  const { name, price, day, status } = req.body;
  try {
    const newTrend = await prisma.marketTrends.create({
      data: {
        name,
        price: parseFloat(price),
        day: parseInt(day),
        status,
      },
    });
    res.status(201).json({ success: true, data: newTrend });
  } catch (error) {
    console.error("Create market trend error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create market trend" });
  }
};

// ✅ PUT /api/market-trends/:id
export const updateMarketTrend = async (req, res) => {
  const { name, price, day, status, id } = req.body;

  try {
    const existingTrend = await prisma.marketTrends.findUnique({
      where: { id },
    });

    if (!existingTrend) {
      return res
        .status(404)
        .json({ success: false, message: "Market trend not found" });
    }

    const updated = await prisma.marketTrends.update({
      where: { id },
      data: {
        name,
        price: parseFloat(price),
        day: parseInt(day),
        status,
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Update market trend error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update market trend" });
  }
};

// ✅ DELETE /api/market-trends/:id
export const deleteMarketTrend = async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await prisma.marketTrends.findUnique({ where: { id } });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Market trend not found" });
    }

    await prisma.marketTrends.delete({ where: { id } });
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete market trend error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete market trend" });
  }
};
