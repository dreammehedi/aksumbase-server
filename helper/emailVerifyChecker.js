import dayjs from "dayjs";
import cron from "node-cron";
import prisma from "../lib/prisma.js";

const unverifiedUserCleaner = () => {
  // Runs every hour
  cron.schedule("0 * * * *", async () => {
    console.log("[CRON] Checking unverified users older than 24h...");

    const now = dayjs();
    const cutoff = now.subtract(24, "hour").toDate(); // 24h ago

    // Find all users with status 'pending' and emailVerificationExpires < now
    const unverifiedUsers = await prisma.user.findMany({
      where: {
        status: "pending",
        createdAt: { lt: cutoff },
      },
    });

    if (unverifiedUsers.length === 0) {
      console.log("[CRON] No unverified users to delete.");
      return;
    }

    for (const user of unverifiedUsers) {
      await prisma.user.delete({
        where: { id: user.id },
      });
      console.log(`[CRON] Deleted unverified user: ${user.email}`);
    }

    console.log("[CRON] Unverified user cleanup completed.");
  });
};

export default unverifiedUserCleaner;
