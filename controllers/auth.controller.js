import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { createError } from "../utils/error.js";

const createToken = (id, role = "user") => {
  return jwt.sign(
    {
      id: id,
      isAdmin: role === "admin",
      role: role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export const register = async (req, res, next) => {
  try {
    let { username, email, password, role, phone } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return next(createError(400, "All fields are required"));
    }

    // Default role fallback
    if (!role) {
      role = "user";
    }

    // Override role for a specific email (admin)
    if (email === "sam@gmail.com") {
      role = "admin";
    }

    if (!role) role = "user";
    let status = role === "admin" || role === "seller" ? "pending" : "active";

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return next(createError(400, "Username or email already exists"));
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Prepare user data
    const userData = {
      username,
      email,
      password: hashedPassword,
      role,
      phone: phone || "",
      status: status,
    };

    // Create new user
    const newUser = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
        status: true,
      },
    });

    // Create token
    const token = createToken(newUser.id, newUser.role);

    // Set cookie and respond
    res
      .cookie("token", token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      })
      .status(201)
      .json({
        success: true,
        message: "User created successfully",
        token,
        data: newUser,
      });
  } catch (error) {
    console.error("Registration error:", error);
    next(createError(500, "User registration failed"));
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return next(createError(400, "All fields are required"));
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toString() },
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
        avatar: true,
        status: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return next(createError(404, "User not found"));
    }

    // Check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return next(createError(400, "Wrong password"));
    }

    // Create token
    const token = createToken(user.id, user.role);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Set cookie and send response
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .status(200)
      .json({
        success: true,
        message: "Login successful",
        token,
        data: userWithoutPassword,
      });
  } catch (error) {
    console.error("Login error:", error);
    next(createError(500, "Login failed: " + error.message));
  }
};

export const logout = (req, res) => {
  res.clearCookie("token").status(200).json({
    success: true,
    message: "User logged out successfully",
  });
};

export const loginWithGoogle = async (req, res) => {
  try {
    const { email, displayName, avatar, role } = req.body;

    const userRole = role || "user";
    const status =
      userRole === "admin" || userRole === "seller" ? "pending" : "active";

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // If user doesn't exist, create one
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          username: displayName,
          avatar,
          role: userRole,
          password: "",
          status: status,
        },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });
    }


    // Create token
    const token = createToken(user.id, user.role);

    res
      .cookie("token", token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      })
      .status(200)
      .json({
        success: true,
        message: "Google login successful",
        token,
        data: user,
      });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to login with Google",
      error: error.message,
    });
  }
};
