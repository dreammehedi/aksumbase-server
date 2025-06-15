import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import nodemailer from "nodemailer";
import decrypt from "../../helper/decrypt.js";

let transporter; // cache transporter

const sendEmail = async ({ to, subject, html }) => {
  try {
    // Fetch email configuration from DB
    const emailConfig = await prisma.emailConfiguration.findFirst();

    if (!emailConfig) {
      throw new Error("Email configuration not found.");
    }

    // Decrypt password
    const decryptedPassword = decrypt(emailConfig.emailPassword);
    if (!decryptedPassword) {
      throw new Error("Failed to decrypt email password");
    }

    // Initialize transporter once, reuse for subsequent calls
    if (!transporter) {
      transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: emailConfig.emailAddress,
          pass: decryptedPassword,
        },
      });
    }

    const mailOptions = {
      from: `"FreshRole" <${
        process.env.EMAIL_FROM || emailConfig.emailAddress
      }>`,
      to,
      subject,
      html,
    };

    // Send mail
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // rethrow so caller can handle it
  }
};

export const requestPropertyContactUser = async (req, res) => {
  try {
    const email = req.email;
    const userId = req.userId;
    const { name, phone, message, propertyId, isUser = true } = req.body;

    if (!name || !phone || !email || !message || !propertyId || !userId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // Save contact request to database
    const contactRequest = await prisma.propertyContactUserRequest.create({
      data: {
        name,
        phone,
        email,
        message,
        propertyId,
        userId,
      },
      include: {
        property: true,
        user: true,
      },
    });

    const {
      property: {
        title,
        price,
        address,
        city,
        state,
        zip,
        latitude,
        longitude,
        type,
        bedrooms,
        bathrooms,
        size,
        images,
      },
      user,
    } = contactRequest;
    console.log(user, "user contact request");
    // Compose HTML Email
    // const html = `
    //   <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
    //     <h2 style="color: #4C924D;">${
    //       isUser ? "Contact Confirmation" : "New Contact Request"
    //     }</h2>
    //     <p><strong>Name:</strong> ${name}</p>
    //     <p><strong>Email:</strong> ${email}</p>
    //     <p><strong>Phone:</strong> ${phone}</p>
    //     <p><strong>Message:</strong> ${message}</p>

    //     <hr/>

    //     <h3 style="color: #4C924D;">Property Information</h3>
    //     <p><strong>Title:</strong> ${title}</p>
    //     <p><strong>Price:</strong> $${price}</p>
    //     <p><strong>Address:</strong> ${address}, ${city}, ${state} ${zip}</p>
    //     <p><strong>Type:</strong> ${type}</p>
    //     <p><strong>Size:</strong> ${size} sqft</p>
    //     <p><strong>Bedrooms:</strong> ${bedrooms}</p>
    //     <p><strong>Bathrooms:</strong> ${bathrooms}</p>
    //     <p><strong>Coordinates:</strong> ${latitude}, ${longitude}</p>

    //     ${
    //       images.length
    //         ? `<div style="margin-top: 10px;">
    //             <p><strong>Images:</strong></p>
    //             <div style="display: flex; flex-wrap: wrap; gap: 10px;">
    //               ${images
    //                 .slice(0, 3)
    //                 .map(
    //                   (img) =>
    //                     `<img src="${img.url}" alt="Property Image" style="width: 120px; border-radius: 4px; border: 1px solid #ccc;" />`
    //                 )
    //                 .join("")}
    //             </div>
    //           </div>`
    //         : ""
    //     }

    //     <p style="margin-top: 20px;">Thanks,<br/>The AksumBase Team</p>
    //   </div>
    // `;

    const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
    <h2 style="color: #4C924D;">${
      isUser ? "Contact Confirmation" : "New Contact Request"
    }</h2>
     
    <h3 style="color: #4C924D;">Agent Information</h3>
     ${
       user?.avatar
         ? `<img src="${user.avatar}" alt="Agent Avatar" style="width: 80px; height: 80px; border-radius: 50%; margin-top: 10px;" />`
         : ""
     }
    <p><strong>Username:</strong> ${user?.username || "N/A"}</p>
    <p><strong>Email:</strong> ${user?.email || "N/A"}</p>
    <p><strong>Phone:</strong> ${user?.phone || "N/A"}</p>
    <p><strong>Bio:</strong> ${user?.bio || "N/A"}</p>
    <hr/>
    ${
      isUser
        ? ``
        : `<p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p><strong>Message:</strong> ${message}</p>
    <hr/>`
    }
    
    <h3 style="color: #4C924D;">Property Information</h3>
    <p><strong>Title:</strong> ${title}</p>
    <p><strong>Price:</strong> $${price}</p>
    <p><strong>Address:</strong> ${address}, ${city}, ${state} ${zip}</p>
    <p><strong>Type:</strong> ${type}</p>
    <p><strong>Size:</strong> ${size} sqft</p>
    <p><strong>Bedrooms:</strong> ${bedrooms} | <strong>Bathrooms:</strong> ${bathrooms}</p>
    <p><strong>Location:</strong> ${latitude}, ${longitude}</p>
    ${
      images?.length
        ? `<div style="margin-top: 10px;">
            ${images
              .map(
                (img) =>
                  `<img src="${img.url}" alt="property image" style="width: 100px; margin-right: 10px;" />`
              )
              .join("")}
          </div>`
        : ""
    }
    <p style="margin-top: 20px;">Thanks,<br/>The AksumBase Team</p>
  </div>
`;

    // Send Email
    await sendEmail({
      to: isUser ? email : "admin@aksumbase.com",
      subject: isUser
        ? "Thanks for contacting us!"
        : "New Property Contact Request",
      html,
    });

    // Respond to client
    res.status(200).json({
      success: true,
      message: "Contact request submitted successfully.",
    });
  } catch (error) {
    console.error("Contact agent error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send contact request.",
    });
  }
};

export const userRequestPropertyContactUser = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID not found from token." });
    }

    const { skip = 0, limit = 10 } = req.pagination || {};

    const requests = await prisma.propertyContactUserRequest.findMany({
      where: {
        userId, // Only match requests created by this user
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        message: true,
        createdAt: true,
        property: {
          select: {
            title: true,
            price: true,
            address: true,
            city: true,
            state: true,
            zip: true,
            latitude: true,
            longitude: true,
            type: true,
            bedrooms: true,
            bathrooms: true,
            size: true,
            images: true,
          },
        },
      },
      skip: Number(skip),
      take: Number(limit),
    });

    const total = await prisma.propertyContactUserRequest.count({
      where: {
        userId,
      },
    });

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        total,
        skip: Number(skip),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("Fetch user property contact requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch property contact requests.",
    });
  }
};
