import prisma from "../lib/prisma.js";

export const createNotification = async ({
  userId,
  title,
  message,
  type = "info",
  link = null,
}) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
};
