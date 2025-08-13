import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
import nodemailer from "nodemailer";
import decrypt from "../../helper/decrypt.js";

const prisma = new PrismaClient();

// Send tour email template
const sendTourEmail = async ({
  transporter,
  to,
  name,
  parseTourTimes,
  propertyId,
  property,
  isUser,
}) => {
  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
    <h2 style="color: #4C924D;">${
      isUser ? "Tour Request Confirmation" : "New Tour Request Received"
    }</h2>
    
    <p><strong>Name:</strong> ${name}</p>

    <h3 style="margin-top: 20px; color: #333;">Property Details:</h3>
    <ul style="list-style: none; padding: 0;">
      <li><strong>Title:</strong> ${property.title}</li>
      <li><strong>Price:</strong> $${property.price}</li>
      <li><strong>Address:</strong> ${property.address}</li>
      <li><strong>Location:</strong> ${property.city}, ${property.state} - ${
    property.zip
  }</li>
      <li><strong>Coordinates:</strong> Lat: ${property.latitude}, Lng: ${
    property.longitude
  }</li>
      <li><strong>Type:</strong> ${property.type}</li>
      <li><strong>Bedrooms:</strong> ${property.bedrooms}</li>
      <li><strong>Bathrooms:</strong> ${property.bathrooms}</li>
      <li><strong>Size:</strong> ${property.size} sqft</li>
    </ul>

    ${
      property.images?.length
        ? `<div style="margin-top: 20px;">
            <p><strong>Images:</strong></p>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
              ${property.images
                .slice(0, 3)
                .map(
                  (img) =>
                    `<img src="${img.url}" alt="Property Image" style="width: 150px; height: auto; border-radius: 4px; border: 1px solid #ccc;" />`
                )
                .join("")}
            </div>
          </div>`
        : ""
    }

    <h3 style="margin-top: 20px; color: #333;">Tour Times:</h3>
    <ul style="padding-left: 20px;">
      ${parseTourTimes
        .map((slot) => `<li>${slot.date} at ${slot.time}</li>`)
        .join("")}
    </ul>

    <p style="margin-top: 20px;">
      ${
        isUser
          ? "We’ll confirm your request soon."
          : "Please contact the user to schedule the tour."
      }
    </p>

    <p style="margin-top: 20px;">Thanks,<br/>The AksumBase Team</p>
  </div>
`;

  await transporter.sendMail({
    from: `Tour Request <${process.env.EMAIL_FROM}>`,
    to,
    subject: isUser
      ? "Your Tour Request Received"
      : "New Tour Request on Your Property",
    html,
  });
};

// export const requestTour = async (req, res) => {
//   try {
//     const userId = req.userId;
//     const userEmail = req.email;

//     if (!userId || !userEmail) {
//       return res
//         .status(400)
//         .json({ message: "User ID or Email not found in token." });
//     }

//     const { propertyId, name, phone, message, tourTimes } = req.body;

//     if (
//       !propertyId ||
//       !name ||
//       !phone ||
//       !tourTimes ||
//       tourTimes.length === 0
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required including at least one tour time.",
//       });
//     }

//     // const parseTourTimes = JSON.parse(tourTimes);

//     const parseTourTimes =
//       typeof tourTimes === "string" ? JSON.parse(tourTimes) : tourTimes;

//     if (parseTourTimes.length > 3) {
//       return res.status(400).json({
//         success: false,
//         message: "Maximum 3 time slots allowed.",
//       });
//     }

//     const now = dayjs();
//     const allowedTimes = [
//       "09:00 AM",
//       "09:30 AM",
//       "10:00 AM",
//       "10:30 AM",
//       "11:00 AM",
//       "11:30 AM",
//       "12:00 PM",
//       "12:30 PM",
//       "01:00 PM",
//       "01:30 PM",
//       "02:00 PM",
//       "02:30 PM",
//       "03:00 PM",
//       "03:30 PM",
//       "04:00 PM",
//       "04:30 PM",
//       "05:00 PM",
//       "05:30 PM",
//       "06:00 PM",
//       "06:30 PM",
//       "07:00 PM",
//     ];

//     const seenSlots = new Set();

//     for (const slot of parseTourTimes) {
//       const key = `${slot.date}_${slot.time}`;

//       if (seenSlots.has(key)) {
//         return res.status(400).json({
//           success: false,
//           message: `Duplicate time slot: ${slot.date} ${slot.time}`,
//         });
//       }
//       seenSlots.add(key);

//       const slotDate = dayjs(slot.date);
//       if (!slotDate.isValid() || slotDate.isBefore(now, "day")) {
//         return res.status(400).json({
//           success: false,
//           message: "Each selected date must be in the future.",
//         });
//       }

//       if (!allowedTimes.includes(slot.time)) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid time slot selected: ${slot.time}`,
//         });
//       }
//     }

//     const existingUser = await prisma.user.findUnique({
//       where: { id: userId },
//     });
//     if (!existingUser) {
//       return res
//         .status(400)
//         .json({ success: false, message: "User not found." });
//     }
//     const existingRequests = await prisma.propertyTourRequest.findMany({
//       where: {
//         userId,
//         propertyId,
//       },
//       select: {
//         tourTimes: true,
//       },
//     });

//     let isDuplicate = false;

//     for (const request of existingRequests) {
//       for (const existingSlot of request.tourTimes || []) {
//         for (const newSlot of parseTourTimes) {
//           if (
//             existingSlot.date === newSlot.date &&
//             existingSlot.time === newSlot.time
//           ) {
//             isDuplicate = true;
//             break;
//           }
//         }
//         if (isDuplicate) break;
//       }
//     }

//     if (isDuplicate) {
//       return res.status(400).json({
//         success: false,
//         message: "You have already requested one or more of these tour slots.",
//       });
//     }

//     const emailConfig = await prisma.emailConfiguration.findFirst();
//     if (!emailConfig) {
//       return res
//         .status(500)
//         .json({ success: false, message: "Email configuration missing." });
//     }

//     const decryptedPassword = decrypt(emailConfig.emailPassword);
//     if (!decryptedPassword) {
//       return res
//         .status(500)
//         .json({ success: false, message: "Failed to decrypt email password." });
//     }

//     const transporter = nodemailer.createTransport({
//       service: "Gmail",
//       auth: {
//         user: emailConfig.emailAddress,
//         pass: decryptedPassword,
//       },
//     });

//     await prisma.propertyTourRequest.create({
//       data: {
//         userId,
//         propertyId,
//         name,
//         email: userEmail,
//         phone,
//         message,
//         tourTimes: parseTourTimes,
//       },
//     });
//     const property = await prisma.property.findUnique({
//       where: { id: propertyId },
//       include: { user: true },
//     });

//     await sendTourEmail({
//       transporter,
//       to: userEmail,
//       name,
//       parseTourTimes,
//       propertyId,
//       property,
//       isUser: true,
//     });

//     if (property?.user?.email) {
//       await sendTourEmail({
//         transporter,
//         to: userEmail,
//         name,
//         parseTourTimes,
//         propertyId,
//         property,
//         isUser: true,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Tour request submitted successfully.",
//     });
//   } catch (error) {
//     console.error("Tour Request Error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong while submitting the tour request.",
//     });
//   }
// };

export const requestTour = async (req, res) => {
  try {
    const userId = req.userId;
    const userEmail = req.email;

    if (!userId || !userEmail) {
      return res
        .status(400)
        .json({ message: "User ID or Email not found in token." });
    }

    const { propertyId, name, phone, message, tourTimes } = req.body;

    if (
      !propertyId ||
      !name ||
      !phone ||
      !tourTimes ||
      tourTimes.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required including at least one tour time.",
      });
    }

    // Parse tour times safely
    const parseTourTimes =
      typeof tourTimes === "string" ? JSON.parse(tourTimes) : tourTimes;

    if (parseTourTimes.length > 3) {
      return res.status(400).json({
        success: false,
        message: "Maximum 3 time slots allowed.",
      });
    }

    const now = dayjs();
    const allowedTimes = [
      "09:00 AM",
      "09:30 AM",
      "10:00 AM",
      "10:30 AM",
      "11:00 AM",
      "11:30 AM",
      "12:00 PM",
      "12:30 PM",
      "01:00 PM",
      "01:30 PM",
      "02:00 PM",
      "02:30 PM",
      "03:00 PM",
      "03:30 PM",
      "04:00 PM",
      "04:30 PM",
      "05:00 PM",
      "05:30 PM",
      "06:00 PM",
      "06:30 PM",
      "07:00 PM",
    ];

    const seenSlots = new Set();

    for (const slot of parseTourTimes) {
      const key = `${slot.date}_${slot.time}`;

      if (seenSlots.has(key)) {
        return res.status(400).json({
          success: false,
          message: `Duplicate time slot: ${slot.date} ${slot.time}`,
        });
      }
      seenSlots.add(key);

      const slotDate = dayjs(slot.date);
      if (!slotDate.isValid() || slotDate.isBefore(now, "day")) {
        return res.status(400).json({
          success: false,
          message: "Each selected date must be in the future.",
        });
      }

      if (!allowedTimes.includes(slot.time)) {
        return res.status(400).json({
          success: false,
          message: `Invalid time slot selected: ${slot.time}`,
        });
      }
    }

    // ✅ Validate user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User not found." });
    }

    // ✅ Validate property exists and is available
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { user: true },
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "The selected property does not exist.",
      });
    }

    if (property.isSold || property.isRent) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot request a tour for a property that is already sold or rented.",
      });
    }

    // ✅ Check for duplicate time slots
    const existingRequests = await prisma.propertyTourRequest.findMany({
      where: {
        userId,
        propertyId,
      },
      select: {
        tourTimes: true,
      },
    });

    let isDuplicate = false;
    for (const request of existingRequests) {
      for (const existingSlot of request.tourTimes || []) {
        for (const newSlot of parseTourTimes) {
          if (
            existingSlot.date === newSlot.date &&
            existingSlot.time === newSlot.time
          ) {
            isDuplicate = true;
            break;
          }
        }
        if (isDuplicate) break;
      }
    }

    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: "You have already requested one or more of these tour slots.",
      });
    }

    // ✅ Email config and transporter
    const emailConfig = await prisma.emailConfiguration.findFirst();
    if (!emailConfig) {
      return res.status(500).json({
        success: false,
        message: "Email configuration missing.",
      });
    }

    const decryptedPassword = decrypt(emailConfig.emailPassword);
    if (!decryptedPassword) {
      return res.status(500).json({
        success: false,
        message: "Failed to decrypt email password.",
      });
    }

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: emailConfig.emailAddress,
        pass: decryptedPassword,
      },
    });

    // ✅ Save request
    await prisma.propertyTourRequest.create({
      data: {
        userId,
        propertyId,
        name,
        email: userEmail,
        phone,
        message,
        tourTimes: parseTourTimes,
      },
    });

    // ✅ Send confirmation to user
    await sendTourEmail({
      transporter,
      to: userEmail,
      name,
      parseTourTimes,
      propertyId,
      property,
      isUser: true,
    });

    // ✅ Notify property owner
    if (property?.user?.email) {
      await sendTourEmail({
        transporter,
        to: property.user.email,
        name,
        parseTourTimes,
        propertyId,
        property,
        isUser: false,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Tour request submitted successfully.",
    });
  } catch (error) {
    console.error("Tour Request Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while submitting the tour request.",
    });
  }
};

export const userRequestTour = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId)
      return res.status(400).json({ message: "User ID not found from token." });

    const { skip = 0, limit = 10 } = req.pagination || {};
    const search = req.query.search || "";
    const filterDate = req.query.date;
    const filterTime = req.query.time;

    // Base Prisma filter (excluding tourTimes)
    const where = {
      AND: [
        { userId },
        {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
      ],
    };

    // Fetch all matching data (before tourTimes filtering)
    const allRequests = await prisma.propertyTourRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        message: true,
        tourTimes: true,
        propertyId: true,
        status: true,
        createdAt: true,
        property: {
          select: {
            title: true,
            price: true,
            address: true,
            city: true,
            state: true,
            zip: true,
            latitude: true,
            longitude: true,
            type: true,
            bedrooms: true,
            bathrooms: true,
            size: true,
            images: true,
          },
        },
      },
    });

    // Filter by tourTimes.date and/or tourTimes.time
    const filteredRequests = allRequests.filter((request) =>
      request.tourTimes?.some((slot) => {
        const matchDate = filterDate ? slot.date === filterDate : true;
        const matchTime = filterTime ? slot.time === filterTime : true;
        return matchDate && matchTime;
      })
    );

    // Paginate filtered data
    const paginated = filteredRequests.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: paginated,
      pagination: {
        total: filteredRequests.length,
        skip: Number(skip),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("User tour request fetch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user tour requests",
    });
  }
};
