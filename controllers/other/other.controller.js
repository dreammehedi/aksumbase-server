// controllers/other/other.controller.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// GET /api/privacy-policy
export const getPrivacyPolicy = async (req, res) => {
  try {
    const policy = await prisma.privacyPolicy.findFirst();
    res.status(200).json({ success: true, data: policy });
  } catch (error) {
    console.error("Get privacy policy error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch privacy policy" });
  }
};

// PUT /api/privacy-policy
export const updatePrivacyPolicy = async (req, res) => {
  const { content, id } = req.body;

  try {
    const existingPolicy = await prisma.privacyPolicy.findUnique({
      where: { id },
    });

    if (!existingPolicy) {
      return res
        .status(404)
        .json({ success: false, message: "Privacy policy not found" });
    }

    const updated = await prisma.privacyPolicy.update({
      where: { id },
      data: { content },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Update privacy policy error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update privacy policy",
      error: error.message,
    });
  }
};

// GET /api/terms-of-use
export const getTermsOfUse = async (req, res) => {
  try {
    const policy = await prisma.termsOfUse.findFirst();
    res.status(200).json({ success: true, data: policy });
  } catch (error) {
    console.error("Get terms of use error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch terms of use" });
  }
};

// PUT /api/terms-of-use
export const updateTermsOfUse = async (req, res) => {
  const { content, id } = req.body;

  try {
    const existingPolicy = await prisma.termsOfUse.findUnique({
      where: { id },
    });

    if (!existingPolicy) {
      return res
        .status(404)
        .json({ success: false, message: "Terms of use not found" });
    }

    const updated = await prisma.termsOfUse.update({
      where: { id },
      data: { content },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Update terms of use error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update terms of use",
      error: error.message,
    });
  }
};

// GET /api/buying-guides
export const getBuyingGuides = async (req, res) => {
  try {
    const data = await prisma.buyingGuides.findFirst({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get buying guides error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch buying guides" });
  }
};

// PUT /api/buying-guides
export const updateBuyingGuides = async (req, res) => {
  const { content, id } = req.body;
  try {
    const existing = await prisma.buyingGuides.findUnique({ where: { id } });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Buying guide not found" });
    }

    const updated = await prisma.buyingGuides.update({
      where: { id },
      data: { content },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Update buying guide error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update buying guide",
      error: error.message,
    });
  }
};

export const getSellingTips = async (req, res) => {
  try {
    const data = await prisma.sellingTips.findFirst({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get selling tips error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch selling tips" });
  }
};

export const updateSellingTips = async (req, res) => {
  const { content, id } = req.body;
  try {
    const existing = await prisma.sellingTips.findUnique({ where: { id } });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Selling tip not found" });
    }

    const updated = await prisma.sellingTips.update({
      where: { id },
      data: { content },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Update selling tip error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update selling tip",
      error: error.message,
    });
  }
};

export const getMarketInsights = async (req, res) => {
  try {
    const data = await prisma.marketInsights.findFirst({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get market insights error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch market insights" });
  }
};

export const updateMarketInsights = async (req, res) => {
  const { content, id } = req.body;
  try {
    const existing = await prisma.marketInsights.findUnique({ where: { id } });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Market insight not found" });
    }

    const updated = await prisma.marketInsights.update({
      where: { id },
      data: { content },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Update market insight error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update market insight",
      error: error.message,
    });
  }
};
