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
//         // Update the userRole
//         await prisma.userRole.update({
//           where: { id: role.id },
//           data: {
//             isExpired: true,
//             isActive: false,
//             isPaused: false,
//           },
//         });

//         // Optionally update user's role field (assumed 'role' exists in User)
//         await prisma.user.update({
//           where: { id: role.userId },
//           data: {
//             role: "user", // or "" if your DB prefers empty string
//           },
//         });

//         console.log(
//           `Marked expired: Role ID ${role.id}, User ID ${role.userId}`
//         );
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
import { sendEmail } from "./sendEmail.js";

const roleExpiryChecker = () => {
  // Runs everyday at 12:00 AM (0 0 * * *)

  cron.schedule("0 0 * * *", async () => {
    console.log("[CRON] Checking expired roles...");

    try {
      const now = new Date();
      const today = new Date(now.toISOString().split("T")[0]); // normalize date to midnight

      // Find all active userRoles that are not expired and have an endDate in the near future or past (grace period)
      // const rolesToCheck = await prisma.userRole.findMany({
      //   where: {
      //     isExpired: false,
      //     isActive: true,
      //     endDate: {
      //       lte: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // roles expiring within 5 days or earlier
      //     },
      //   },
      // });

      // for (const role of rolesToCheck) {
      //   const endDate = new Date(role.endDate.toISOString().split("T")[0]); // normalize endDate to midnight
      //   const diffTime = endDate.getTime() - today.getTime();
      //   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // difference in days (0 means expires today)

      //   // Send warning emails for 5, 2, 1, 0 days before expiry
      //   if ([5, 2, 1, 0].includes(diffDays)) {
      //     const user = await prisma.user.findUnique({
      //       where: { id: role.userId },
      //     });

      //     console.log(user, "user data on user role");
      //     if (!user || !user.email) continue;

      //     const subject = `Your role expires in ${diffDays} day${
      //       diffDays !== 1 ? "s" : ""
      //     }`;
      //     const html = `
      //       <p>Dear ${user.username || "User"},</p>
      //       <p>Your role will expire in ${diffDays} day${
      //       diffDays !== 1 ? "s" : ""
      //     } on ${endDate.toDateString()}.</p>
      //       <p>Please renew your role to continue enjoying our services without interruption.</p>
      //       <p>Thank you,<br/>FreshRole Team</p>
      //     `;

      //     await sendEmail({ to: user.email, subject, html });
      //     console.log(
      //       `[CRON] Sent expiration warning email to User ID ${user.id} for Role ID ${role.id} (${diffDays} days left)`
      //     );
      //     console.log(
      //       `[CRON] Sent expiration warning email to User ID ${user.id} for Role ID ${role.id} (${diffDays} days left)`
      //     );
      //   }

      //   // Handle expiry grace period: wait 2 days after endDate before marking expired
      //   if (diffDays < 0 && diffDays >= -2) {
      //     // Within 2 days after expiration, do nothing (grace period)
      //     console.log(
      //       `[CRON] Role ID ${role.id} expired but still in 2-day grace period.`
      //     );
      //     continue;
      //   }

      //   if (diffDays < -2) {
      //     // More than 2 days after expiration -> mark as expired
      //     await prisma.userRole.update({
      //       where: { id: role.id },
      //       data: {
      //         isExpired: true,
      //         isActive: false,
      //         isPaused: false,
      //       },
      //     });

      //     await prisma.user.update({
      //       where: { id: role.userId },
      //       data: {
      //         role: "user",
      //       },
      //     });

      //     console.log(
      //       `[CRON] Marked expired after grace period: Role ID ${role.id}, User ID ${role.userId}`
      //     );
      //   }
      // }

      const rolesToCheck = await prisma.userRole.findMany({
        where: {
          isExpired: false,
          isActive: true,
          endDate: {
            lte: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // roles expiring within 5 days or earlier
          },
        },
        include: {
          user: true, // eager-load user to avoid separate query per role
        },
      });

      const notifiedUsers = new Set();

      for (const role of rolesToCheck) {
        const endDate = new Date(role.endDate.toISOString().split("T")[0]);
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (![5, 2, 1, 0].includes(diffDays)) continue;

        if (!role.user || !role.user.email) continue;

        // To avoid duplicate emails to the same user if multiple roles expire simultaneously
        if (notifiedUsers.has(role.user.id)) continue;
        notifiedUsers.add(role.user.id);

        const subject = `Your role expires in ${diffDays} day${
          diffDays !== 1 ? "s" : ""
        }`;
        const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
    <h2 style="color: #4C924D;">Your Role is Expiring Soon</h2>
    <p>Dear ${role.user.username || "User"},</p>
    <p>Your role will expire in <strong>${diffDays} day${
          diffDays !== 1 ? "s" : ""
        }</strong>, on <strong>${endDate.toDateString()}</strong>.</p>
    <p>Please renew your role to continue enjoying our services without interruption.</p>
    <p style="margin-top: 24px;">Thanks,<br><strong>The AksumBase Team</strong></p>
  </div>
`;

        await sendEmail({ to: role.user.email, subject, html });
        console.log(
          `[CRON] Sent expiration warning email to User ID ${role.user.id} (${diffDays} days left)`
        );
      }

      console.log("[CRON] Role expiry check complete.");
    } catch (error) {
      console.error("[CRON] Error checking role expiry:", error);
    }
  });
};

export default roleExpiryChecker;
