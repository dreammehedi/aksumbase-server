import { createError } from "../utils/error.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all agents with optional filters (type, status, city)
export const getAgents = async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.type) filters.type = req.query.type;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.city) filters.city = req.query.city;

    const agents = await prisma.agent.findMany({
      where: filters,
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
        reviews: true, // optionally include reviews count or details
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, data: agents });
  } catch (error) {
    next(error);
  }
};

// Get single agent by ID
export const getAgentById = async (req, res, next) => {
  try {
    const id = req.params.id;

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        reviews: true,
      },
    });

    if (!agent) return next(createError(404, "Agent not found"));

    res.status(200).json({ success: true, data: agent });
  } catch (error) {
    next(error);
  }
};

// Add new agent
export const addAgent = async (req, res, next) => {
  try {
    const {
      fullName,
      type,
      licenseNumber,
      company,
      experience,
      bio,
      phone,
      email,
      website,
      photo,
      photoPublicId,
      specialties,
      languages,
      address,
      city,
      state,
      zip,
    } = req.body;

    const userId = req.userId;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const newAgent = await prisma.agent.create({
      data: {
        fullName,
        type,
        licenseNumber,
        company,
        experience,
        bio,
        phone,
        email,
        website,
        photo,
        photoPublicId,
        specialties: specialties || [],
        languages: languages || [],
        address,
        city,
        state,
        zip,
        userId,
      },
    });

    res.status(201).json({ success: true, data: newAgent });
  } catch (error) {
    next(error);
  }
};

// Update agent
export const updateAgent = async (req, res, next) => {
  try {
    const id = req.params.id;
    const userId = req.userId;

    const existingAgent = await prisma.agent.findUnique({ where: { id } });
    if (!existingAgent) return next(createError(404, "Agent not found"));

    // Authorization: Only admin or owner can update
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return next(createError(403, "User not found"));
    if (user.role !== "admin" && existingAgent.userId !== userId) {
      return next(createError(403, "Not authorized to update this agent"));
    }

    const updatedAgent = await prisma.agent.update({
      where: { id },
      data: {
        ...req.body,
        updatedAt: new Date(),
      },
    });

    res
      .status(200)
      .json({ success: true, message: "Agent updated", data: updatedAgent });
  } catch (error) {
    next(error);
  }
};

// Delete agent
export const deleteAgent = async (req, res, next) => {
  try {
    const id = req.params.id;
    const userId = req.userId;

    const existingAgent = await prisma.agent.findUnique({ where: { id } });
    if (!existingAgent) return next(createError(404, "Agent not found"));

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return next(createError(403, "User not found"));
    if (user.role !== "admin" && existingAgent.userId !== userId) {
      return next(createError(403, "Not authorized to delete this agent"));
    }

    await prisma.agent.delete({ where: { id } });

    res
      .status(200)
      .json({ success: true, message: "Agent deleted successfully" });
  } catch (error) {
    next(error);
  }
};
