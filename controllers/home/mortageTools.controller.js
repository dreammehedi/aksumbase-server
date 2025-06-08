import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ✅ GET - For Frontend (No Pagination)
export const getFrontendData = async (req, res) => {
  try {
    const data = await prisma.mortageTools.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get mortage tools error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch mortage tools data",
    });
  }
};

// ✅ GET - With Pagination + Search
export const getData = async (req, res) => {
  try {
    const { skip = 0, limit = 10 } = req.pagination || {};
    const search = req.query.search || "";

    const where = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { ctaLink: { contains: search, mode: "insensitive" } },
        { ctaName: { contains: search, mode: "insensitive" } },
      ],
    };

    const [data, total] = await Promise.all([
      prisma.mortageTools.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.mortageTools.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data,
      pagination: { total, skip: Number(skip), limit: Number(limit) },
    });
  } catch (error) {
    console.error("Paginated mortage tools fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch mortage tools",
    });
  }
};

// ✅ POST - Create New Tool
export const createData = async (req, res) => {
  const { name, description, ctaLink, ctaName } = req.body;

  try {
    const newTool = await prisma.mortageTools.create({
      data: { name, description, ctaLink, ctaName },
    });

    res.status(201).json({ success: true, data: newTool });
  } catch (error) {
    console.error("Create mortage tool error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create mortage tool",
    });
  }
};

// ✅ PUT - Update Tool by ID
export const updateData = async (req, res) => {
  const { id, name, description, ctaName, ctaLink } = req.body;

  try {
    const existing = await prisma.mortageTools.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Mortage tool not found",
      });
    }

    const updated = await prisma.mortageTools.update({
      where: { id },
      data: {
        name,
        description,
        ctaLink,
        ctaName,
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Update mortage tool error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update mortage tool",
    });
  }
};

// ✅ DELETE - Remove Tool by ID
export const deleteData = async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await prisma.mortageTools.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Mortage tool not found",
      });
    }

    await prisma.mortageTools.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: "Mortage tool deleted successfully",
    });
  } catch (error) {
    console.error("Delete mortage tool error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete mortage tool",
    });
  }
};
