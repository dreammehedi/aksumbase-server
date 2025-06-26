// controllers/other/other.controller.js
import { PrismaClient } from "@prisma/client";
import { cloudinary } from "../../config/cloudinary.config.js";
import isValidUrl from "../../helper/isValidUrl.js";
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

export const getMarketAnalysis = async (req, res) => {
  try {
    const data = await prisma.marketAnalysis.findFirst({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get market analysis error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch market analysis" });
  }
};

export const updateMarketAnalysis = async (req, res) => {
  const { content, id } = req.body;

  try {
    const existing = await prisma.marketAnalysis.findUnique({ where: { id } });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Market analysis not found" });
    }

    const updated = await prisma.marketAnalysis.update({
      where: { id },
      data: { content },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Update market analysis error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update market analysis",
      error: error.message,
    });
  }
};

export const getPress = async (req, res) => {
  try {
    const data = await prisma.press.findFirst({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get press error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch press" });
  }
};

export const updatePress = async (req, res) => {
  const { content, id } = req.body;

  try {
    const existing = await prisma.press.findUnique({ where: { id } });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Press not found" });
    }

    const updated = await prisma.press.update({
      where: { id },
      data: { content },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Update press error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update press",
      error: error.message,
    });
  }
};

export const getContactInformation = async (req, res) => {
  try {
    const data = await prisma.contactInformation.findFirst({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get contact information error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch contact information" });
  }
};

export const updateContactInformation = async (req, res) => {
  const { email, email2, phone, phone2, address, address2, id } = req.body;

  try {
    const existing = await prisma.contactInformation.findUnique({
      where: { id },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Contact information not found" });
    }

    const updated = await prisma.contactInformation.update({
      where: { id },
      data: { email, email2, phone, phone2, address, address2 },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Update contact information error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update contact information",
      error: error.message,
    });
  }
};

export const getSocialNetwork = async (req, res) => {
  try {
    const data = await prisma.socialNetwork.findFirst({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get social network error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch social network" });
  }
};

export const updateSocialNetwork = async (req, res) => {
  const {
    id,
    facebookLink,
    twitterLink,
    linkedinLink,
    instagramLink,
    youtubeLink,
    dribbleLink,
    whatsappNumber,
    telegramLink,
    snapchatLink,
    tiktokLink,
    threadsLink,
    pinterestLink,
    redditLink,
    githubLink,
    websiteLink,
  } = req.body;

  const links = {
    facebookLink,
    twitterLink,
    linkedinLink,
    instagramLink,
    youtubeLink,
    dribbleLink,
    telegramLink,
    snapchatLink,
    tiktokLink,
    threadsLink,
    pinterestLink,
    redditLink,
    githubLink,
    websiteLink,
  };

  // Validate all provided URLs
  for (const [key, value] of Object.entries(links)) {
    if (!isValidUrl(value)) {
      return res.status(400).json({
        success: false,
        message: `Invalid URL format for: ${key}`,
      });
    }
  }

  try {
    const existing = await prisma.socialNetwork.findUnique({
      where: { id },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Social network not found" });
    }

    const updated = await prisma.socialNetwork.update({
      where: { id },
      data: {
        ...links,
        whatsappNumber,
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Update social network error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update social network",
      error: error.message,
    });
  }
};

export const getSiteConfiguration = async (req, res) => {
  try {
    const data = await prisma.siteConfiguration.findFirst({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get site configuration error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch site configuration" });
  }
};

export const updateSiteConfiguration = async (req, res) => {
  const { name, shortDescription, longDescription, id } = req.body;

  try {
    const existing = await prisma.siteConfiguration.findUnique({
      where: { id },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Site configuration not found" });
    }

    const updatedFields = {
      name,
      shortDescription,
      longDescription,
    };

    // ✅ Update logo if provided
    if (req.files?.logo?.[0]) {
      if (existing.logoPublicId) {
        await cloudinary.uploader.destroy(existing.logoPublicId);
      }

      updatedFields.logo = req.files.logo[0].path;
      updatedFields.logoPublicId = req.files.logo[0].filename;
    }

    // ✅ Update author favicon if provided
    if (req.files?.favicon?.[0]) {
      if (existing.faviconPublicId) {
        await cloudinary.uploader.destroy(existing.faviconPublicId);
      }

      updatedFields.favicon = req.files.favicon[0].path;
      updatedFields.faviconPublicId = req.files.favicon[0].filename;
    }

    const updated = await prisma.siteConfiguration.update({
      where: { id },
      data: updatedFields,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Update site configuration error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update site configuration",
      error: error.message,
    });
  }
};
