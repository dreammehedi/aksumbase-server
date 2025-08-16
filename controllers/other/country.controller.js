import { PrismaClient } from "@prisma/client";
import slugify from "slugify";

const prisma = new PrismaClient();

export const getCountry = async (req, res) => {
  try {
    // 1. Get only active countries
    const countries = await prisma.country.findMany({
      where: { status: "active" }, // ✅ filter active
      orderBy: { createdAt: "desc" },
    });

    // 2. Count properties grouped by country name
    const propertyCounts = await prisma.property.groupBy({
      by: ["country"],
      _count: { country: true },
    });

    // 3. Attach listing count
    const countryWithCounts = countries.map((country) => {
      const countObj = propertyCounts.find((p) => p.country === country.name);
      return {
        ...country,
        listingCount: countObj ? countObj._count.country : 0,
      };
    });

    res.status(200).json({ success: true, data: countryWithCounts });
  } catch (error) {
    console.error("Get country error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch countries" });
  }
};

export const country = async (req, res) => {
  try {
    const { skip = 0, limit = 10 } = req.pagination || {};
    const search = req.query.search || "";

    const where = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ],
    };

    // 1. Get paginated countries
    const countries = await prisma.country.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });

    // 2. Count properties grouped by country string
    const propertyCounts = await prisma.property.groupBy({
      by: ["country"],
      _count: { country: true },
    });

    // 3. Merge property count into each country
    const data = countries.map((c) => {
      const match = propertyCounts.find((p) => p.country === c.name);
      return {
        ...c,
        listingCount: match ? match._count.country : 0,
      };
    });

    // 4. Total country count (for pagination)
    const total = await prisma.country.count({ where });

    res.status(200).json({
      success: true,
      data,
      pagination: { total, skip: Number(skip), limit: Number(limit) },
    });
  } catch (error) {
    console.error("Get country error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch country" });
  }
};

export const createCountry = async (req, res) => {
  const { name, status } = req.body;

  try {
    // Validate required fields
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Prepare slug
    const slug = slugify(name, { lower: true, strict: true });

    const newCountry = await prisma.country.create({
      data: {
        name,
        slug,
        status,
      },
    });

    res.status(201).json({ success: true, data: newCountry });
  } catch (error) {
    console.error("Create country error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create country",
      error: error.message,
    });
  }
};
export const updateCountry = async (req, res) => {
  const { id, name, status } = req.body;

  try {
    const existingCountry = await prisma.country.findUnique({ where: { id } });

    if (!existingCountry) {
      return res
        .status(404)
        .json({ success: false, message: "Country not found" });
    }

    const updatedFields = {
      name,
      slug: slugify(name, { lower: true, strict: true }),
      status,
    };

    const updatedCountry = await prisma.country.update({
      where: { id },
      data: updatedFields,
    });

    return res.status(200).json({ success: true, data: updatedCountry });
  } catch (error) {
    console.error("Update country error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update country",
      error: error.message,
    });
  }
};

export const deleteCountry = async (req, res) => {
  const countryIds = req.body;

  if (!Array.isArray(countryIds) || countryIds.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No country IDs provided" });
  }

  try {
    for (const id of countryIds) {
      const country = await prisma.country.findUnique({ where: { id } });

      if (!country) {
        continue; // Skip if country not found
      }

      // Delete country from DB
      await prisma.country.delete({ where: { id } });
    }

    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete country error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete country(s)" });
  }
};
