import dayjs from "dayjs";
import cron from "node-cron";
import prisma from "../lib/prisma.js";
import { sendEmail } from "./sendEmail.js";

const reminderEmailJob = () => {
  // Runs every day at 9 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("[CRON] Checking roles for email reminders...");

    const today = dayjs();

    const allUserRoles = await prisma.userRole.findMany({
      where: {
        isExpired: false,
      },
      include: {
        user: true,
        rolePackage: true,
      },
    });

    for (const role of allUserRoles) {
      const end = dayjs(role.endDate);
      const daysLeft = end.diff(today, "day");

      const userEmail = role.user.email;
      const roleName = role.rolePackage.name;

      if (daysLeft === 3 || daysLeft === 2 || daysLeft === 1) {
        await sendEmail({
          to: userEmail,
          subject: `⏳ Your ${roleName} role will expire in ${daysLeft} day(s)`,
          html: `
            <h2>Hello ${role.user.username},</h2>
            <p>Your <strong>${roleName}</strong> role will expire in <strong>${daysLeft}</strong> day(s).</p>
            <p>Please renew to continue enjoying premium features.</p>
            <a href="https://your-app.com/renew-role">Renew Now</a>
          `,
        });
        console.log(`Reminder sent to ${userEmail} - ${daysLeft} days left`);
      }

      if (daysLeft < 0 && !role.isExpired) {
        await prisma.userRole.update({
          where: { id: role.id },
          data: {
            isExpired: true,
            isActive: false,
            isPaused: false,
          },
        });

        await sendEmail({
          to: userEmail,
          subject: `❌ Your ${roleName} role has expired`,
          html: `
            <h2>Hello ${role.user.username},</h2>
            <p>Your <strong>${roleName}</strong> role has expired.</p>
            <p>You can renew it anytime from your profile.</p>
            <a href="https://your-app.com/renew-role">Renew Role</a>
          `,
        });

        console.log(`Expired email sent to ${userEmail}`);
      }
    }

    console.log("[CRON] Email reminder job completed.");
  });
};

export default reminderEmailJob;
