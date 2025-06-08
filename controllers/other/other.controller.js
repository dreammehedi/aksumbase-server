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
