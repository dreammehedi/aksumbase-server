import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import decrypt from "../../helper/decrypt.js";

const prisma = new PrismaClient();

export const registerUser = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!email) missingFields.push("Email");
    if (!username) missingFields.push("User name");
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

    // Check if user already exists by email or username
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

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Create new user
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

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

    // You can either return the token directly or store it if you have a token field
    // But since your schema doesn't have a `token` field, just return it in the response

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      payload: {
        _id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        status: newUser.status,
        role: newUser.role,
        token,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred during registration.",
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!email) missingFields.push("Email");
    if (!password) missingFields.push("Password");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${missingFields.join(", ")} field(s) are required.`,
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please register first.",
      });
    }

    // Check if user is active
    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status}. Please contact support.`,
      });
    }

    // Password check (admin email gets plain check)
    let isMatch;
    if (user.email === "admin@gmail.com") {
      isMatch = password === user.password;
    } else {
      isMatch = bcrypt.compareSync(password, user.password);
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "3d",
    });

    // Send response excluding sensitive info
    const { id, username, createdAt, role, status } = user;
    res.status(200).json({
      success: true,
      message: "Login successful.",
      payload: {
        _id: id,
        name: username,
        email: user.email,
        token,
        role,
        status,
        createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred during login.",
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
    throw new Error("Could not send reset code email.");
  }
};

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

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
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
export const logout = async (req, res) => {
  try {
    const userEmail = req.body?.email; // Assumes middleware adds `req.user`
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. No user found in request.",
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please register first.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Logout failed.",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { email, ...otherFields } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email!",
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    const updatedFields = { ...otherFields };

    // Handle image upload
    if (req.file) {
      try {
        // Delete previous image from Cloudinary
        if (user.avatarPublicId) {
          await cloudinary.uploader.destroy(user.avatarPublicId);
        }

        // Upload new image to Cloudinary
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

    // Update user in DB
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

export const getUserProfile = async (req, res) => {
  const { email } = req.params;

  try {
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email parameter is required.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Remove password before sending
    const { password, resetCode, resetCodeExpiration, ...otherData } = user;

    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully.",
      payload: otherData,
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

export const googleLogin = async (req, res) => {
  try {
    const token = jwt.sign({ email: newUser.email }, process.env.JWT_SECRET, {
      expiresIn: "3d",
    });

    const role = req.user.role || "user";

    // Redirect to the frontend with token and role in the query string
    const frontendURL = `https://aksumbase-frontend-qsfw.vercel.app/auth/google/callback?token=${token}&role=${role}`;
    res.redirect(frontendURL);
  } catch (error) {
    console.error("Google login error:", error);
    res.redirect(
      "https://aksumbase-frontend-qsfw.vercel.app/login?error=login_failed"
    );
  }
};
