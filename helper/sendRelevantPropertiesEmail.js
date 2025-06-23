// import dayjs from "dayjs";
// import utc from "dayjs/plugin/utc.js";
// dayjs.extend(utc);

// import cron from "node-cron";
// import prisma from "../lib/prisma.js";
// import { sendEmail } from "./sendEmail.js";

// const relevantPropertiesEmailSend = () => {
//   // Run once a day at 9:45 AM server time
//   cron.schedule("48 9 * * *", async () => {
//     console.log(
//       "🔔 Cron job started: Send relevant properties from recent 7 days"
//     );

//     // Get UTC start of day 7 days ago and UTC end of today
//     const from = dayjs().utc().subtract(7, "day").startOf("day").toDate();
//     const to = dayjs().utc().endOf("day").toDate();

//     console.log(
//       `Querying property views with viewedAt between ${from.toISOString()} and ${to.toISOString()}`
//     );

//     try {
//       const views = await prisma.propertyView.findMany({
//         where: {
//           viewedAt: {
//             gte: from,
//             lte: to,
//           },
//         },
//         include: {
//           user: {
//             select: {
//               email: true,
//               username: true,
//             },
//           },
//           property: {
//             select: {
//               id: true,
//               title: true,
//               city: true,
//               state: true,
//               property: true,
//               price: true,
//               zip: true,
//               latitude: true,
//               longitude: true,
//             },
//           },
//         },
//       });

//       console.log(
//         `📊 Found ${views.length} property views from recent 7 days.`
//       );

//       if (!views.length) {
//         console.log("ℹ️ No property views found in the recent 7 days.");
//         return;
//       }

//       for (const view of views) {
//         const { user, property } = view;
//         if (!user?.email || !property) continue;

//         const recommended = await prisma.property.findMany({
//           where: {
//             status: "approved",
//             id: { not: property.id },
//             city: property.city,
//             state: property.state,
//             property: property.property,
//             price: {
//               gte: property.price * 0.8,
//               lte: property.price * 1.2,
//             },
//           },
//           orderBy: {
//             createdAt: "desc",
//           },
//           take: 10,
//         });

//         if (!recommended.length) continue;

//         const html = `
//           <h3>Hello ${user.username || "there"},</h3>
//           <p>You viewed <strong>${property.title}</strong> recently.</p>
//           <p>Here are 10 similar properties you might like:</p>
//           <ul>
//             ${recommended
//               .map(
//                 (p) => `
//               <li>
//                 <strong>${p.title}</strong><br />
//                 ${p.city}, ${p.state} - $${p.price.toLocaleString()}
//               </li>`
//               )
//               .join("")}
//           </ul>
//           <p>Happy house hunting! 🏠</p>
//         `;

//         await sendEmail({
//           to: user.email,
//           subject: "Top 10 Properties You May Like",
//           html,
//         });

//         console.log(`✅ Email sent to ${user.email}`);
//       }

//       console.log("🎉 Cron job completed.");
//     } catch (err) {
//       console.error("❌ Error in cron job:", err.message);
//     }
//   });
// };

// export default relevantPropertiesEmailSend;

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
dayjs.extend(utc);

import cron from "node-cron";
import prisma from "../lib/prisma.js";
import { sendEmail } from "./sendEmail.js";

const relevantPropertiesEmailSend = () => {
  // Run once a day at 9:48 AM server time
  cron.schedule("0 6 * * *", async () => {
    console.log(
      "🔔 Cron job started: Send relevant properties from recent 7 days"
    );

    // Get UTC start of day 7 days ago and UTC end of today
    const from = dayjs().utc().subtract(7, "day").startOf("day").toDate();
    const to = dayjs().utc().endOf("day").toDate();

    console.log(
      `Querying property views with viewedAt between ${from.toISOString()} and ${to.toISOString()}`
    );

    try {
      const views = await prisma.propertyView.findMany({
        where: {
          viewedAt: {
            gte: from,
            lte: to,
          },
        },
        include: {
          user: {
            select: {
              email: true,
              username: true,
              isNotificationEnabled: true,
            },
          },
          property: {
            select: {
              id: true,
              title: true,
              city: true,
              state: true,
              property: true, // assuming this is the category/type field
              price: true,
              zip: true,
              latitude: true,
              longitude: true,
              bedrooms: true,
              bathrooms: true,
              size: true,
              status: true,
              userName: true,
            },
          },
        },
      });

      console.log(
        `📊 Found ${views.length} property views from recent 7 days.`
      );

      if (!views.length) {
        console.log("ℹ️ No property views found in the recent 7 days.");
        return;
      }

      for (const view of views) {
        const { user, property } = view;

        // Only send email if user notifications are enabled
        if (!user?.email || !user.isNotificationEnabled || !property) continue;

        const recommended = await prisma.property.findMany({
          where: {
            status: "approved",
            id: { not: property.id },
            city: property.city,
            state: property.state,
            property: property.property,
            price: {
              gte: property.price * 0.8,
              lte: property.price * 1.2,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        });

        if (!recommended.length) continue;

        // Generate property cards HTML
        const propertyCardsHtml = recommended
          .map((p) => {
            return `
            <div style="border:1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px; font-family: Arial, sans-serif;">
              <h4 style="margin: 0 0 5px 0; color: #4C924D;">${p.title}</h4>
              
             
              <p style="margin: 2px 0; font-size: 18px; font-weight: bold;">$${p.price.toLocaleString()}</p>
              <p style="margin: 2px 0;">
                ${p.bedrooms || "N/A"} bd | ${p.bathrooms || "N/A"} ba | ${
              p.size || "N/A"
            } size
              </p>
              <p style="margin: 2px 0; color: #777;">${p.city}, ${p.state} ${
              p.zip || ""
            }</p>
              <p style="margin: 2px 0; font-size: 12px; color: #999;">
                ${p.userName || "Unknown Agent"}
              </p>
             
            </div>
          `;
          })
          .join("");

        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #4C924D;">We found 10 homes you might like!</h2>
            <p>These homes are similar to other listings you've viewed.</p>
            ${propertyCardsHtml}
            <p style="text-align:center; margin-top: 20px;">
              <a href="https://aksumbase-frontend-qsfw.vercel.app" style="background-color: #4C924D; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Find more homes</a>
            </p>
            <p>Happy house hunting! 🏠</p>
          </div>
        `;

        await sendEmail({
          to: user.email,
          subject: "Top 10 Properties You May Like",
          html,
        });

        console.log(`✅ Email sent to ${user.email}`);
      }

      console.log("🎉 Cron job completed.");
    } catch (err) {
      console.error("❌ Error in cron job:", err.message);
    }
  });
};

export default relevantPropertiesEmailSend;
