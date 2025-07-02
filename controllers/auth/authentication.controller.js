dotenv.config();
import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import speakeasy from "speakeasy";
import decrypt from "../../helper/decrypt.js";
import { sendEmail } from "../../helper/sendEmail.js";
import prisma from "../../lib/prisma.js";
import cloudinary from "../../utils/cloudinary.js";
import { createError } from "../../utils/error.js";

export const registerUser = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    const missingFields = [];
    if (!email) missingFields.push("Email");
    if (!username) missingFields.push("Username");
    if (!password) missingFields.push("Password");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${missingFields.join(", ")} field(s) are required.`,
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    // Check for existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already registered with this email or username.",
      });
    }

    const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));

    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: "user",
        status: "active",
        avatar: "",
        avatarPublicId: "",
        resetCode: "",
        resetCodeExpiration: new Date(),
      },
    });

    const deviceInfo = `${req.headers["user-agent"]} | IP: ${req.ip}`;
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    // Step 1: Create session
    const session = await prisma.session.create({
      data: {
        userId: newUser.id,
        token: "temp",
        deviceInfo,
        expiresAt,
      },
    });

    // Step 2: Generate JWT with session ID
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        sessionId: session.id,
        token: newUser.token,
      },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

    // Step 3: Update session with token
    await prisma.session.update({
      where: { id: session.id },
      data: { token },
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      payload: {
        _id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        status: newUser.status,
        token,
        createdAt: newUser.createdAt,
        isTwoFactorEnabled: newUser.isTwoFactorEnabled,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred during registration.",
    });
  }
};

export const registerAdmin = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    const missingFields = [];
    if (!email) missingFields.push("Email");
    if (!username) missingFields.push("Username");
    if (!password) missingFields.push("Password");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${missingFields.join(", ")} field(s) are required.`,
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    // Check for existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already registered with this email or username.",
      });
    }

    const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));

    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: "admin",
        isAdmin: true,
        status: "active",
        avatar: "",
        avatarPublicId: "",
        resetCode: "",
        resetCodeExpiration: new Date(),
      },
    });

    const deviceInfo = `${req.headers["user-agent"]} | IP: ${req.ip}`;
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    // Step 1: Create session
    const session = await prisma.session.create({
      data: {
        userId: newUser.id,
        token: "temp",
        deviceInfo,
        expiresAt,
      },
    });

    // Step 2: Generate JWT with session ID
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        sessionId: session.id,
        token: newUser.token,
      },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

    // Step 3: Update session with token
    await prisma.session.update({
      where: { id: session.id },
      data: { token },
    });
    await sendEmail({
      to: newUser.email,
      subject: "Your Admin Account Has Been Created",
      html: `
    <h2>Welcome to AksumBase!</h2>
    <p>Your admin account has been successfully created.</p>
    <p><strong>Email:</strong> ${newUser.email}</p>
    <p><strong>Password:</strong> ${password}</p>
    <p>Please keep this information secure and consider changing your password after first login.</p>
  `,
    });

    res.status(201).json({
      success: true,
      message: "Admin registered successfully.",
      payload: {
        _id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        status: newUser.status,
        token,
        createdAt: newUser.createdAt,
        isTwoFactorEnabled: newUser.isTwoFactorEnabled,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred during registration.",
    });
  }
};
export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Check super_admin permission
    if (req.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Only super admins can delete admin accounts.",
      });
    }

    if (req.user?.id === id) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete your own super admin account.",
      });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Admin not found.",
      });
    }

    if (!targetUser.isAdmin || targetUser.role === "super_admin") {
      return res.status(400).json({
        success: false,
        message: "You can only delete admin accounts, not super admins.",
      });
    }

    // ✅ Delete all related records
    await prisma.notification.deleteMany({ where: { userId: id } });
    await prisma.userRole.deleteMany({ where: { userId: id } });
    await prisma.session.deleteMany({ where: { userId: id } });
    await prisma.bookmark.deleteMany({ where: { userId: id } });
    await prisma.propertyView.deleteMany({ where: { userId: id } });
    await prisma.propertyTourRequest.deleteMany({ where: { userId: id } });
    await prisma.mortageTools.deleteMany({ where: { userId: id } });
    await prisma.propertyContactUserRequest.deleteMany({
      where: { userId: id },
    });
    await prisma.transaction.deleteMany({ where: { userId: id } });

    // ✅ Delete properties listed by this user
    await prisma.property.deleteMany({ where: { userId: id } });

    // ✅ Delete reviews by and for this user
    await prisma.review.deleteMany({
      where: {
        OR: [{ reviewerId: id }, { reviewedUserId: id }],
      },
    });

    // ✅ Finally, delete the user
    await prisma.user.delete({ where: { id } });

    // ✅ Notify by email
    await sendEmail({
      to: targetUser.email,
      subject: "Your Admin Account Has Been Deleted",
      html: `
        <h2>Account Deleted</h2>
        <p>Dear ${targetUser.username || "Admin"},</p>
        <p>Your admin account for <strong>AksumBase</strong> has been deleted by a super admin.</p>
        <p>If you believe this was a mistake, please contact system support.</p>
        <br />
        <p>Regards,<br/>AksumBase Team</p>
      `,
    });

    res.status(200).json({
      success: true,
      message: "Admin account and related data deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Admin Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred while deleting admin.",
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required." });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found." });

    if (user.status !== "active")
      return res.status(403).json({ message: `Account is ${user.status}.` });

    // const isAdmin = email === "admin@gmail.com";
    // const passwordMatch = isAdmin
    //   ? password === user.password
    //   : await bcrypt.compare(password, user.password);

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch)
      return res.status(401).json({ message: "Invalid email or password." });

    // 2FA
    if (user.isTwoFactorEnabled) {
      const otp = crypto.randomInt(100000, 999999).toString();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorTempToken: otp,
          twoFactorTempExp: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      await sendOtpEmail(user.email, otp);

      return res.status(200).json({
        success: true,
        step: "2fa",
        message: "OTP sent to your email. Please verify.",
        email: user.email,
      });
    }

    const deviceInfo = `${req.headers["user-agent"]} | IP: ${req.ip}`;
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    // Step 1: Create session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: "temp",
        deviceInfo,
        expiresAt,
      },
    });

    // Step 2: Generate token with sessionId
    const jwtToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        sessionId: session.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

    // Step 3: Update session with real token
    await prisma.session.update({
      where: { id: session.id },
      data: { token: jwtToken },
    });

    const { id, username, role, status, createdAt, isTwoFactorEnabled } = user;

    res.status(200).json({
      success: true,
      message: "Login successful.",
      payload: {
        _id: id,
        name: username,
        email,
        role,
        status,
        createdAt,
        isTwoFactorEnabled,
        token: jwtToken,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res
      .status(500)
      .json({ message: error.message || "Server error during login." });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const session = await prisma.session.findUnique({
      where: { id: decoded.sessionId },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found.",
      });
    }

    // ✅ Delete session from DB
    await prisma.session.delete({
      where: { id: session.id },
    });

    res.clearCookie("token"); // optional for cookie-based auth
    res.status(200).json({
      success: true,
      message: "Logged out successfully and session deleted.",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Logout failed.",
    });
  }
};

export const sendResetCode = async (email, code) => {
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
    from: emailConfig.emailUserName,
    to: email,
    subject: "Your Password Reset Code",
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #4C924D;">Reset Your Password</h2>
      <p>Hello,</p>
      <p>We received a request to reset your password. Use the code below to proceed:</p>
      <div style="font-size: 24px; font-weight: bold; margin: 20px 0; color: #333; text-align: center;">
        ${code}
      </div>
      <p>This code will expire in 10 minutes. If you didn't request a password reset, please ignore this email.</p>
      <p>Thanks,<br>The AksumBase Team</p>
    </div>
  `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error(`Could not send reset code email.`);
  }
};

async function sendOtpEmail(email, otp) {
  const emailConfig = await prisma.emailConfiguration.findFirst();

  if (!emailConfig) {
    throw new Error("Email configuration not found.");
  }

  const decryptedPassword = decrypt(emailConfig.emailPassword);
  if (!decryptedPassword) {
    throw new Error("Failed to decrypt email password");
  }

  const mailOptions = {
    from: emailConfig.emailUserName,
    to: email,
    subject: "Your Login OTP Code",
    text: `Your one-time login code is: ${otp}. It will expire in 5 minutes.`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #4C924D;">Your Login Verification Code</h2>
      <p>Hello,</p>
      <p>Your one-time login code is:</p>
      <div style="font-size: 24px; font-weight: bold; margin: 20px 0; color: #333; text-align: center;">
        ${otp}
      </div>
      <p>This code will expire in 5 minutes. If you didn’t request this, please ignore this email.</p>
      <p>Thanks,<br>The AksumBase Team</p>
    </div>
  `,
  };

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: emailConfig.emailAddress,
      pass: decryptedPassword,
    },
  });
  await transporter.sendMail(mailOptions);
}

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Generate a 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with reset code and expiration
    await prisma.user.update({
      where: { email },
      data: {
        resetCode,
        resetCodeExpiration,
      },
    });

    // Send reset code via email
    await sendResetCode(email, resetCode);

    return res.status(200).json({
      success: true,
      message: "Reset code sent to your email.",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({
      success: false,
      message:
        error.message || "An error occurred while requesting password reset.",
    });
  }
};
export const resetPassword = async (req, res) => {
  const { email, resetCode, newPassword, confirmPassword } = req.body;

  try {
    // Validate required fields
    const missingFields = [];
    if (!email) missingFields.push("Email");
    if (!resetCode) missingFields.push("Code");
    if (!newPassword) missingFields.push("New password");
    if (!confirmPassword) missingFields.push("Confirm password");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${missingFields.join(", ")} field(s) are required.`,
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password not match. Please try again.",
      });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Check reset code and expiration
    if (user.resetCode !== resetCode) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset code.",
      });
    }

    if (user.resetCodeExpiration && user.resetCodeExpiration < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Reset code has expired.",
      });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetCode: null,
        resetCodeExpiration: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred during password reset.",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { email, isNotificationEnabled, ...otherFields } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email!",
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    const updatedFields = {
      ...otherFields,
      ...(typeof isNotificationEnabled !== "undefined" && {
        isNotificationEnabled:
          isNotificationEnabled === true || isNotificationEnabled === "true",
      }),
    };

    // Handle image upload
    if (req.file) {
      try {
        if (user.avatarPublicId) {
          await cloudinary.uploader.destroy(user.avatarPublicId);
        }

        const cloudinaryResult = req.file;
        updatedFields.avatar = cloudinaryResult.path;
        updatedFields.avatarPublicId = cloudinaryResult.filename;
      } catch (imageError) {
        return res.status(500).json({
          success: false,
          message: "Image update failed.",
          error: imageError.message,
        });
      }
    }

    await prisma.user.update({
      where: { email },
      data: updatedFields,
    });

    res.status(200).json({
      success: true,
      message: "User profile updated successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error updating profile.",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, passwordConfirmation, email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email!",
      });
    }

    if (!oldPassword || !newPassword || !passwordConfirmation) {
      return res.status(400).json({
        success: false,
        message: "All fields are required!",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long!",
      });
    }

    if (newPassword !== passwordConfirmation) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation do not match!",
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    // Check old password
    const isMatch = bcrypt.compareSync(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect!",
      });
    }

    // Hash and update new password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Error changing password.",
    });
  }
};

export const googleLogin = async (req, res) => {
  try {
    // Email and role are available on req.user from passport
    const { email, role = "user", id, username, status } = req.user;

    if (!email) {
      return res.redirect(
        `${process.env.FRONTEND_LINK}/login?error=no_email_found`
      );
    }

    const deviceInfo = `${req.headers["user-agent"]} | IP: ${req.ip}`;
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    // Step 1: Create session
    const session = await prisma.session.create({
      data: {
        userId: id,
        token: "temp",
        deviceInfo,
        expiresAt,
      },
    });

    const token = jwt.sign(
      {
        userId: id,
        email: email,
        sessionId: session.id,
        role: role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "3d",
      }
    );

    // Step 3: Update session with real token
    await prisma.session.update({
      where: { id: session.id },
      data: { token },
    });

    const frontendURL = `${process.env.FRONTEND_LINK}/auth/google/callback?token=${token}&role=${role}&id=${id}&username=${username}&status=${status}&email=${email}`;
    res.redirect(frontendURL);
  } catch (error) {
    console.error("Google login error:", error);
    res.redirect(`${process.env.FRONTEND_LINK}/login?error=login_failed`);
  }
};

export const verify2FA = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user)
      return res
        .status(404)
        .json({ message: "User not found. Please register first." });

    if (user.status !== "active")
      return res.status(403).json({ message: `Account is ${user.status}.` });

    if (!user.twoFactorTempToken || !user.twoFactorTempExp)
      return res.status(400).json({ message: "Invalid OTP request." });

    const isOtpExpired = new Date() > new Date(user.twoFactorTempExp);
    const isOtpInvalid = user.twoFactorTempToken !== otp;

    if (isOtpInvalid || isOtpExpired) {
      return res.status(401).json({ message: "Invalid or expired OTP." });
    }

    // Clear OTP fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorTempToken: null,
        twoFactorTempExp: null,
      },
    });

    // Create session and JWT (same as loginUser)
    const deviceInfo = `${req.headers["user-agent"]} | IP: ${req.ip}`;
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: "temp",
        deviceInfo,
        expiresAt,
      },
    });

    const jwtToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        sessionId: session.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

    await prisma.session.update({
      where: { id: session.id },
      data: { token: jwtToken },
    });

    const { id, username, role, status, createdAt, isTwoFactorEnabled } = user;

    res.status(200).json({
      success: true,
      message: "Login successful.",
      payload: {
        _id: id,
        name: username,
        email,
        token: jwtToken,
        role,
        status,
        createdAt,
        isTwoFactorEnabled,
      },
      session: {
        id: session.id,
        deviceInfo: session.deviceInfo,
        isActive: session.isActive,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error("2FA Verify Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error during 2FA verification.",
    });
  }
};

export const setup2FA = async (req, res) => {
  const userId = req.userId;

  if (!userId)
    return res.status(400).json({ message: "User ID not found from token." });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ message: "User not found." });

  await prisma.user.update({
    where: { id: userId },
    data: {
      isTwoFactorEnabled: true,
    },
  });

  res.json({ success: true, message: "Setup 2FA successful" });
};

export const remove2FA = async (req, res) => {
  const userId = req.userId;

  if (!userId)
    return res.status(400).json({ message: "User ID not found from token." });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ message: "User not found." });

  const secret = speakeasy.generateSecret({
    name: `Aksumbase (${user.email})`,
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      isTwoFactorEnabled: false,
      twoFactorTempToken: null,
      twoFactorTempExp: null,
    },
  });

  res.json({ success: true, message: "Remove 2FA successful" });
};

export const getUserProfile = async (req, res, next) => {
  const { email } = req.params; // ✅ destructure email properly
  const token = req.token;

  console.log(token, "token");

  if (!email) {
    return res.status(400).json({ message: "Email not found." });
  }

  if (!token) {
    return res.status(400).json({ message: "Token not found in token." });
  }

  try {
    // ✅ Correct query format
    const user = await prisma.user.findFirst({
      where: { email: email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const session = await prisma.session.findFirst({
      where: { token },
    });

    if (!session || !session.isActive) {
      return next(createError(403, "Session is expired!"));
    }

    const {
      password,
      resetCode,
      resetCodeExpiration,
      twoFactorTempToken,
      twoFactorTempExp,
      ...userData
    } = user;

    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully.",
      payload: userData,
      session: {
        id: session.id,
        deviceInfo: session.deviceInfo,
        isActive: session.isActive,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      success: false,
      message:
        error.message || "An error occurred while fetching the user profile.",
    });
  }
};
