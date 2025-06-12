// import cron from "node-cron";
// import prisma from "../lib/prisma.js";

// const roleExpiryChecker = () => {
//   // Runs everyday at 12:00 AM
//   cron.schedule("0 0 * * *", async () => {
//     console.log("[CRON] Checking expired roles...");

//     try {
//       const now = new Date();

//       const expiredRoles = await prisma.userRole.findMany({
//         where: {
//           endDate: {
//             lt: now,
//           },
//           isExpired: false,
//         },
//       });

//       for (const role of expiredRoles) {
//         await prisma.userRole.update({
//           where: { id: role.id },
//           data: {
//             isExpired: true,
//             isActive: false,
//             isPaused: false,
//           },
//         });

//         console.log(`Marked expired: Role ID ${role.id}`);
//       }

//       console.log(
//         `[CRON] Role expiry check complete. Total expired: ${expiredRoles.length}`
//       );
//     } catch (error) {
//       console.error("[CRON] Error checking role expiry:", error);
//     }
//   });
// };

// export default roleExpiryChecker;

import cron from "node-cron";
import prisma from "../lib/prisma.js";

const roleExpiryChecker = () => {
  // Runs everyday at 12:00 AM
  cron.schedule("0 0 * * *", async () => {
    console.log("[CRON] Checking expired roles...");

    try {
      const now = new Date();

      const expiredRoles = await prisma.userRole.findMany({
        where: {
          endDate: {
            lt: now,
          },
          isExpired: false,
        },
      });

      for (const role of expiredRoles) {
        // Update the userRole
        await prisma.userRole.update({
          where: { id: role.id },
          data: {
            isExpired: true,
            isActive: false,
            isPaused: false,
          },
        });

        // Optionally update user's role field (assumed 'role' exists in User)
        await prisma.user.update({
          where: { id: role.userId },
          data: {
            role: "user", // or "" if your DB prefers empty string
          },
        });

        console.log(
          `Marked expired: Role ID ${role.id}, User ID ${role.userId}`
        );
      }

      console.log(
        `[CRON] Role expiry check complete. Total expired: ${expiredRoles.length}`
      );
    } catch (error) {
      console.error("[CRON] Error checking role expiry:", error);
    }
  });
};

export default roleExpiryChecker;
