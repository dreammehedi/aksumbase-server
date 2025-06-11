import nodemailer from "nodemailer";

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
    service: "Gmail",
    auth: {
      user: emailConfig.emailAddress,
      pass: decryptedPassword,
    },
  });

  const mailOptions = {
    from: `"FreshRole" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};
