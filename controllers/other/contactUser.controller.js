import { sendEmail } from "../../helper/sendEmail.js";
import prisma from "../../lib/prisma.js";

// Create contact

export const createContactUser = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Save to DB
    const contact = await prisma.contactUser.create({
      data: { name, email, subject, message },
    });

    // Prepare email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4C924D;">Thank you for contacting us</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>We’ve received your message and will get back to you soon.</p>
        <hr style="margin: 20px 0;">
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Your Message:</strong></p>
        <p style="background-color: #f9f9f9; padding: 10px; border-radius: 4px;">${message}</p>
        <p>Best regards,<br/>AksumBase Team</p>
      </div>
    `;

    // Send confirmation email to the user
    await sendEmail({
      to: email,
      subject: "We received your contact message",
      html: emailHtml,
    });

    res.status(201).json({
      success: true,
      message: "Contact submitted and email sent",
      data: contact,
    });
  } catch (error) {
    console.error("Error creating contact:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all contacts

export const getAllContacts = async (req, res) => {
  try {
    const { skip = 0, limit = 10 } = req.pagination || {};
    const search = req.query.search || "";

    const where = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
      ],
    };

    const data = await prisma.contactUser.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.contactUser.count({ where });

    res.status(200).json({
      success: true,
      data,
      pagination: { total, skip: Number(skip), limit: Number(limit) },
    });
  } catch (error) {
    console.error("Get contact user error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch contact user" });
  }
};
// Delete contact by ID
export const deleteContactById = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.contactUser.delete({ where: { id } });
    res.status(200).json({ success: true, message: "Contact deleted" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({ error: "Server error" });
  }
};
