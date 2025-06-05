import { PrismaClient } from "@prisma/client";
import { createError } from "../utils/error.js";
import cloudinary from "../utils/cloudinary.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Get all users
export const getUser = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const where = {};

    if (role && role !== "all") {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error in getUser:", error);
    next(createError(500, "Failed to fetch users"));
  }
};

// Get user by ID
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(createError(400, "User ID is required"));
    }

    // Add debug logging
    console.log("Attempting to fetch user with ID:", id);

    // Validate MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return next(createError(400, "Invalid user ID format"));
    }

    // First check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!userExists) {
      return next(createError(404, "User not found"));
    }

    // If user exists, get full details
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    // Log the full error for debugging
    console.error("Error in getUserById:", {
      error: error,
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });

    // Handle specific Prisma errors
    if (error.code === "P2025") {
      return next(createError(404, "User not found"));
    }

    if (error.code === "P2002") {
      return next(createError(400, "Invalid user ID format"));
    }

    next(createError(500, `Failed to fetch user: ${error.message}`));
  }
};

// Update user
export const updateUser = async (req, res, next) => {
  try {
    const { username, email, password, phone, bio } = req.body;
    const userId = req.params.id;

    // Debug logging
    console.log("Update request:", {
      userId,
      username,
      email,
      password,
      phone,
      bio,
      file: req.file,
    });

    if (!userId) {
      return next(createError(400, "User ID is required"));
    }

    // Validate MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      return next(createError(400, "Invalid user ID format"));
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return next(createError(400, "Invalid email format"));
    }

    // Validate password if provided
    if (password && password.length < 6) {
      return next(
        createError(400, "Password must be at least 6 characters long")
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return next(createError(404, "User not found"));
    }

    // Check if username is already taken
    if (username) {
      const usernameExists = await prisma.user.findFirst({
        where: {
          username,
          id: { not: userId },
        },
      });
      if (usernameExists) {
        return next(createError(400, "Username is already taken"));
      }
    }

    // Hash password if provided
    let hashedPassword;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // Handle avatar upload if present
    let avatarUrl = existingUser.avatar;
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "avatars",
          width: 300,
          crop: "scale",
        });
        avatarUrl = result.secure_url;
      } catch (uploadError) {
        console.error("Error uploading avatar:", uploadError);
        return next(createError(500, "Failed to upload avatar"));
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username }),
        ...(email && { email }),
        ...(hashedPassword && { password: hashedPassword }),
        ...(phone && { phone }),
        ...(bio && { bio }),
        ...(avatarUrl && { avatar: avatarUrl }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        phone: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    // Log the full error for debugging
    console.error("Error in updateUser:", {
      error: error,
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });

    // Handle specific Prisma errors
    if (error.code === "P2025") {
      return next(createError(404, "User not found"));
    }

    if (error.code === "P2002") {
      return next(createError(400, "Username or email already exists"));
    }

    next(createError(500, `Failed to update user: ${error.message}`));
  }
};

// Delete user
export const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return next(createError(404, "User not found"));
    }

    // First delete all Post records associated with the user's posts
    await prisma.post.deleteMany({
      where: {
        post: {
          userId: userId,
        },
      },
    });

    // Then delete all posts associated with the user
    await prisma.post.deleteMany({
      where: { userId: userId },
    });

    // Now delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    res.status(200).json({
      success: true,
      message: "User has been deleted",
    });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    next(createError(500, "Failed to delete user"));
  }
};

// Add this new function to update user roles
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!["user", "admin", "agent"].includes(role)) {
      return next(
        createError(400, "Invalid role. Must be user, admin, or agent")
      );
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role,
        isAdmin: role === "admin", // Update isAdmin based on role
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error in updateUserRole:", error);
    next(createError(500, "Failed to update user role"));
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    // Get total users
    const totalUsers = await prisma.user.count();

    // Get total posts
    const totalPosts = await prisma.post.count();

    // Get recent posts
    const recentPosts = await prisma.post.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
    });

    // Get recent users
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalPosts,
        recentPosts,
        recentUsers,
      },
    });
  } catch (error) {
    next(createError(500, "Failed to fetch dashboard stats"));
  }
};

// Add this new function
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        status: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return next(createError(404, "User not found"));
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(createError(500, "Failed to fetch user"));
  }
};
