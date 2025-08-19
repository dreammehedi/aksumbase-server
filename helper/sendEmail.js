import nodemailer from "nodemailer";
import prisma from "../lib/prisma.js";
import decrypt from "./decrypt.js";

export const sendEmail = async ({ to, subject, html }) => {
  const emailConfig = await prisma.emailConfiguration.findFirst();

  if (!emailConfig) {
    throw new Error("Email configuration not found.");
  }

  const decryptedPassword = decrypt(emailConfig.emailPassword);
  if (!decryptedPassword) {
    throw new Error("Failed to decrypt email password");
  }

  const transporter = nodemailer.createTransport({
    service: emailConfig?.emailHost || "smtp.gmail.com",
    auth: {
      user: emailConfig.emailAddress,
      pass: decryptedPassword,
    },
     tls: {
    rejectUnauthorized: false, // 👉 SSL মিসম্যাচ ইগনোর করবে
  },
  });

  const mailOptions = {
    from: `"AksumBase" <${emailConfig.emailUserName}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

// import nodemailer from "nodemailer";
// import prisma from "../lib/prisma.js";
// import decrypt from "./decrypt.js";

// export const sendEmail = async ({ to, subject, html }) => {
//   const emailConfig = await prisma.emailConfiguration.findFirst();

//   if (!emailConfig) {
//     throw new Error("Email configuration not found.");
//   }

//   const decryptedPassword = decrypt(emailConfig.emailPassword);
//   if (!decryptedPassword) {
//     throw new Error("Failed to decrypt email password");
//   }

//   const transporter = nodemailer.createTransport({
//     host: emailConfig.emailHost,
//     port: emailConfig.emailPort,
//     secure: emailConfig.emailEncryption === "ssl",
//     auth: {
//       user: emailConfig.emailAddress,
//       pass: decryptedPassword,
//     },
//   });

//   const mailOptions = {
//     from: `"${emailConfig.emailFromName}" <${emailConfig.emailAddress}>`,
//     to,
//     subject,
//     html,
//   };

//   await transporter.sendMail(mailOptions);
// };
