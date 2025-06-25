import { sendEmail } from "../../helper/sendEmail.js";
import prisma from "../../lib/prisma.js";

// Create estimate
export const createGetEstimate = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Save to DB
    const contact = await prisma.getEstimate.create({
      data: { email },
    });

    // Prepare email HTML
    const emailHtml = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
    <h2 style="color: #4C924D;">Home Value Estimate Request</h2>
    <p>Hello,</p>
    <p>We've received your request to get an estimated value for your property using our <strong>AKSUMBASE™</strong> tool.</p>
    <p><strong>Email:</strong> ${email}</p>
    <p>One of our team members will reach out to you shortly with more details.</p>
    <hr style="margin: 20px 0;">
    <p>Thank you for using AksumBase!</p>
    <p>Best regards,<br/>The AksumBase Team</p>
  </div>
`;

    // Send confirmation email to the user
    await sendEmail({
      to: email,
      subject: "We received your estimate email",
      html: emailHtml,
    });

    res
      .status(201)
      .json({
        success: true,
        message: "Estimate submitted and email sent",
        data: contact,
      });
  } catch (error) {
    console.error("Error creating estimate:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all estimates
export const getAllGetEstimates = async (req, res) => {
  try {
    const { skip = 0, limit = 10 } = req.pagination || {};
    const search = req.query.search || "";

    const where = {
      OR: [{ email: { contains: search, mode: "insensitive" } }],
    };

    const data = await prisma.getEstimate.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.getEstimate.count({ where });

    res.status(200).json({
      success: true,
      data,
      pagination: { total, skip: Number(skip), limit: Number(limit) },
    });
  } catch (error) {
    console.error("Get estimate user error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch estimate user" });
  }
};

// Delete estimate by ID
export const deleteGetEstimateById = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.getEstimate.delete({ where: { id } });
    res.status(200).json({ success: true, message: "Estimate deleted" });
  } catch (error) {
    console.error("Error deleting estimate:", error);
    res.status(500).json({ error: "Server error" });
  }
};
