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
      from: `"AksumBase" <${
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

// export const requestPropertyContactUser = async (req, res) => {
//   try {
//     const email = req.email;
//     const userId = req.userId;
//     const { name, phone, message, propertyId, isUser = true } = req.body;

//     if (!name || !phone || !email || !message || !propertyId || !userId) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required.",
//       });
//     }

//     // Save contact request to database
//     const contactRequest = await prisma.propertyContactUserRequest.create({
//       data: {
//         name,
//         phone,
//         email,
//         message,
//         propertyId,
//         userId,
//       },
//       include: {
//         property: true,
//         user: true,
//       },
//     });

//     const {
//       property: {
//         title,
//         price,
//         address,
//         city,
//         state,
//         zip,
//         latitude,
//         longitude,
//         type,
//         bedrooms,
//         bathrooms,
//         size,
//         images,
//       },
//       user,
//     } = contactRequest;

//     const html = `
//   <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
//     <h2 style="color: #4C924D;">${
//       isUser ? "Contact Confirmation" : "New Contact Request"
//     }</h2>

//     <h3 style="color: #4C924D;">Agent Information</h3>
//      ${
//        user?.avatar
//          ? `<img src="${user.avatar}" alt="Agent Avatar" style="width: 80px; height: 80px; border-radius: 50%; margin-top: 10px;" />`
//          : ""
//      }
//     <p><strong>Username:</strong> ${user?.username || "N/A"}</p>
//     <p><strong>Email:</strong> ${user?.email || "N/A"}</p>
//     <p><strong>Phone:</strong> ${user?.phone || "N/A"}</p>
//     <p><strong>Bio:</strong> ${user?.bio || "N/A"}</p>
//     <hr/>
//     ${
//       isUser
//         ? ``
//         : `<p><strong>Name:</strong> ${name}</p>
//     <p><strong>Email:</strong> ${email}</p>
//     <p><strong>Phone:</strong> ${phone}</p>
//     <p><strong>Message:</strong> ${message}</p>
//     <hr/>`
//     }

//     <h3 style="color: #4C924D;">Property Information</h3>
//     <p><strong>Title:</strong> ${title}</p>
//     <p><strong>Price:</strong> $${price}</p>
//     <p><strong>Address:</strong> ${address}, ${city}, ${state} ${zip}</p>
//     <p><strong>Type:</strong> ${type}</p>
//     <p><strong>Size:</strong> ${size} sqft</p>
//     <p><strong>Bedrooms:</strong> ${bedrooms} | <strong>Bathrooms:</strong> ${bathrooms}</p>
//     <p><strong>Location:</strong> ${latitude}, ${longitude}</p>
//     ${
//       images?.length
//         ? `<div style="margin-top: 10px;">
//             ${images
//               .map(
//                 (img) =>
//                   `<img src="${img.url}" alt="property image" style="width: 100px; margin-right: 10px;" />`
//               )
//               .join("")}
//           </div>`
//         : ""
//     }
//     <p style="margin-top: 20px;">Thanks,<br/>The AksumBase Team</p>
//   </div>
// `;

//     // Send Email
//     await sendEmail({
//       to: isUser ? email : "admin@aksumbase.com",
//       subject: isUser
//         ? "Thanks for contacting us!"
//         : "New Property Contact Request",
//       html,
//     });

//     // Respond to client
//     res.status(200).json({
//       success: true,
//       message: "Contact request submitted successfully.",
//     });
//   } catch (error) {
//     console.error("Contact agent error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to send contact request.",
//     });
//   }
// };

export const requestPropertyContactUser = async (req, res) => {
  try {
    const email = req.email;
    const userId = req.userId; // May be undefined
    const { name, phone, message, propertyId, isUser = true } = req.body;

    // Basic validation
    if (!name || !phone || !email || !message || !propertyId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // Fetch property
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    let user = null;

    // If userId exists, fetch user
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }

    // Only save contact request if user exists
    if (user) {
      await prisma.propertyContactUserRequest.create({
        data: {
          name,
          phone,
          email,
          message,
          propertyId,
          userId,
        },
      });
    }

    // Prepare email HTML
    const {
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
    } = property;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4C924D;">${
          user ? "Contact Confirmation" : "New Contact Request"
        }</h2>

        ${
          user
            ? `
          <h3 style="color: #4C924D;">Agent Information</h3>
          ${
            user.avatar
              ? `<img src="${user.avatar}" alt="Agent Avatar" style="width: 80px; height: 80px; border-radius: 50%; margin-top: 10px;" />`
              : ""
          }
          <p><strong>Username:</strong> ${user.username || "N/A"}</p>
          <p><strong>Email:</strong> ${user.email || "N/A"}</p>
          <p><strong>Phone:</strong> ${user.phone || "N/A"}</p>
          <p><strong>Bio:</strong> ${user.bio || "N/A"}</p>
          <hr/>
          `
            : ""
        }

        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong> ${message}</p>
        <hr/>

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
      to: user ? email : "admin@aksumbase.com",
      subject: user
        ? "Thanks for contacting us!"
        : "New Property Contact Request",
      html,
    });

    return res.status(200).json({
      success: true,
      message: user
        ? "Contact request submitted successfully."
        : "Guest message sent successfully.",
    });
  } catch (error) {
    console.error("Contact agent error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send contact request.",
    });
  }
};
