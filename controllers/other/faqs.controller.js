import { PrismaClient } from "@prisma/client";
import slugify from "slugify";

const prisma = new PrismaClient();

export const getFaqs = async (req, res) => {
  try {
    const data = await prisma.faqs.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get faqs error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch faqs" });
  }
};

export const faqs = async (req, res) => {
  try {
    const { skip = 0, limit = 10 } = req.pagination || {};
    const search = req.query.search || "";

    const where = {
      OR: [{ question: { contains: search, mode: "insensitive" } }],
    };

    const data = await prisma.faqs.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.faqs.count({ where });

    res.status(200).json({
      success: true,
      data,
      pagination: { total, skip: Number(skip), limit: Number(limit) },
    });
  } catch (error) {
    console.error("Get faqs error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch faqs" });
  }
};

export const createFaqs = async (req, res) => {
  const { question, answer } = req.body;
  console.log(question, answer);

  const slug = slugify(question, { lower: true, strict: true });
  try {
    if (!question || !answer) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Check if question already exists
    const existingFaq = await prisma.faqs.findFirst({
      where: { question },
    });

    if (existingFaq) {
      return res.status(409).json({
        success: false,
        message: "A FAQ with this question already exists",
      });
    }

    const newFaqs = await prisma.faqs.create({
      data: {
        question,
        answer,
        slug,
      },
    });

    res.status(201).json({ success: true, data: newFaqs });
  } catch (error) {
    console.error("Create faqs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create faqs",
      error: error.message,
    });
  }
};

export const updateFaqs = async (req, res) => {
  const { id, question, answer } = req.body;

  try {
    const existingFaqs = await prisma.faqs.findUnique({ where: { id } });

    if (!existingFaqs) {
      return res
        .status(404)
        .json({ success: false, message: "Faqs not found" });
    }

    // Check if another FAQ with the same question exists (excluding current id)
    const faqWithSameQuestion = await prisma.faqs.findFirst({
      where: {
        question,
        NOT: { id },
      },
    });

    if (faqWithSameQuestion) {
      return res.status(409).json({
        success: false,
        message: "Another FAQ with this question already exists",
      });
    }

    const updatedFields = {
      question,
      answer,
      slug: slugify(question, { lower: true, strict: true }),
    };

    const updatedFaqs = await prisma.faqs.update({
      where: { id },
      data: updatedFields,
    });

    return res.status(200).json({ success: true, data: updatedFaqs });
  } catch (error) {
    console.error("Update faqs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update faqs",
      error: error.message,
    });
  }
};

export const deleteFaqs = async (req, res) => {
  const faqsId = req.body;
  console.log(faqsId);

  if (!Array.isArray(faqsId) || faqsId.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No faqs IDs provided" });
  }

  try {
    for (const id of faqsId) {
      const faqs = await prisma.faqs.findUnique({ where: { id } });

      if (!faqs) {
        continue; // Skip if faqs not found
      }

      // Delete faqs from DB
      await prisma.faqs.delete({ where: { id } });
    }

    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete faqs error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete faq(s)" });
  }
};
