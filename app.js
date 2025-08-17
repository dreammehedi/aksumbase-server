import { v2 as cloudinary } from "cloudinary";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
// Import routes
import Stripe from "stripe";
import passport from "./config/passport.config.js";
import {
  handleRenewStripeWebhook,
  handleStripeWebhook,
} from "./controllers/auth/userRole.controller.js";
import reminderEmailJob from "./helper/reminderEmailJob.js";
import roleExpiryChecker from "./helper/roleExpiryChecker.js";
import relevantPropertiesEmailSend from "./helper/sendRelevantPropertiesEmail.js";
import prisma from "./lib/prisma.js";
import {
  AuthenticationRouter,
  AuthRouter,
} from "./routes/auth/authentication.route.js";
import RolePackageRouter from "./routes/auth/rolePackage.route.js";
import UserRoleRouter from "./routes/auth/userRole.route.js";
import DashboardRouter from "./routes/dashboard/dashboard.route.js";
import DevelopmentPlatformRouter from "./routes/home/developmentPlatform.route.js";
import HeroBannerRouter from "./routes/home/heroBanner.route.js";
import MarketTrendsRouter from "./routes/home/marketTrends.route.js";
import MortageToolsRouter from "./routes/home/mortageTools.route.js";
import MortgageRateRouter from "./routes/loan-officer/mortgageRate.route.js";
import BlogRouter from "./routes/other/blog.route.js";
import ContactUserRouter from "./routes/other/contactUser.route.js";
import CountryRouter from "./routes/other/country.route.js";
import EmailConfigurationRouter from "./routes/other/emailConfiguration.route.js";
import FaqsRouter from "./routes/other/faqs.route.js";
import GetEstimateRouter from "./routes/other/getEstimate.route.js";
import NewsletterRouter from "./routes/other/newsletter.routes.js";
import OtherRouter from "./routes/other/other.route.js";
import SellBannerRouter from "./routes/other/sellerPageBanner.route.js";
import SellerResourcesRouter from "./routes/other/sellerResources.route.js";
import SellTypesRouter from "./routes/other/sellTypes.route.js";
import StripeConfigurationRouter from "./routes/other/stripeConfiguration.route.js";
import { default as PropertyRouter } from "./routes/property/property.route.js";
import PropertyBookmarkRouter from "./routes/property/propertyBookmark.route.js";
import PropertyContactUserRequestRouter from "./routes/property/propertyContactUserRequest.route.js";
import PropertyTourRequestRouter from "./routes/property/propertyTourRequest.route.js";
import UserReviewRouter from "./routes/property/userReview.route.js";

// Configure environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "JWT_SECRET",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ Stripe webhook: must use raw BEFORE JSON parser
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// ✅ Stripe webhook: must use raw BEFORE JSON parser
app.post(
  "/api/role-renew/stripe/webhook",
  express.raw({ type: "application/json" }),
  handleRenewStripeWebhook
);
// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Adjust the path if necessary

// ✅ JSON/body parsers (after webhook)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// CORS configuration
// const allowedOrigins = [
//   "http://localhost:5173",
//   "https://aksumbase.com",
//   "http://aksumbase.com",
//   "https://www.aksumbase.com",
//   "http://www.aksumbase.com",
//   "https://aksumbase-frontend.vercel.app",
//   "https://aksumbase-frontend-qsfw.vercel.app",
//   "http://144.91.123.60",
//   "https://144.91.123.60",
//   "144.91.123.60",
//   "http://144.91.123.60:8800",
//   "https://api.aksumbase.com",
//   "http://api.aksumbase.com",
//   "https://www.api.aksumbase.com",
//   "http://www.api.aksumbase.com",
// ];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // Allow requests with no origin (like mobile apps or curl requests)
//       if (!origin) return callback(null, true);

//       if (allowedOrigins.indexOf(origin) === -1) {
//         const msg =
//           "The CORS policy for this site does not allow access from the specified Origin.";
//         return callback(new Error(msg), false);
//       }
//       return callback(null, true);
//     },
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
//     exposedHeaders: ["Set-Cookie"],
//     maxAge: 86400, // 24 hours
//   })
// );

app.use(
  cors({
    origin: (origin, callback) => callback(null, true), // allow any origin dynamically
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Set-Cookie"],
    maxAge: 86400,
  })
);

// Passport middleware
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Home route
app.get("/", (req, res) => {
  res.render("index", {
    title: "Home",
    message: "Aksumbase Real Estate Server Running...",
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// In your express app or router file
app.get("/api/stripe/session", async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: "Session ID required" });

  const config = await prisma.stripeConfiguration.findFirst();
  if (!config?.stripeSecret)
    throw new Error("Stripe secret key not found in DB");

  try {
    const stripe = new Stripe(config.stripeSecret);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.json(session);
  } catch (error) {
    console.error("Failed to fetch session:", error);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

app.get("/api/role-renew/stripe/session", async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: "Session ID required" });

  const config = await prisma.stripeConfiguration.findFirst();
  if (!config?.stripeSecret)
    throw new Error("Stripe secret key not found in DB");

  try {
    const stripe = new Stripe(config.stripeSecret);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.json(session);
  } catch (error) {
    console.error("Failed to fetch session:", error);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// routes
app.use("/api", HeroBannerRouter);
app.use("/api", MarketTrendsRouter);
app.use("/api", MortageToolsRouter);
app.use("/api", OtherRouter);
app.use("/api", BlogRouter);
app.use("/api/authentication", AuthenticationRouter);
app.use("/api/auth", AuthRouter);
app.use("/api", EmailConfigurationRouter);
app.use("/api", SellBannerRouter);
app.use("/api", SellTypesRouter);
app.use("/api", SellerResourcesRouter);
app.use("/api", DevelopmentPlatformRouter);
app.use("/api", PropertyRouter);
app.use("/api", RolePackageRouter);
app.use("/api", UserRoleRouter);
app.use("/api", DashboardRouter);
app.use("/api", PropertyBookmarkRouter);
app.use("/api", PropertyTourRequestRouter);
app.use("/api", PropertyContactUserRequestRouter);
app.use("/api", StripeConfigurationRouter);
app.use("/api", UserReviewRouter);
app.use("/api", ContactUserRouter);
app.use("/api", GetEstimateRouter);
app.use("/api", FaqsRouter);
app.use("/api", NewsletterRouter);
app.use("/api", CountryRouter);

// loan officer routes
app.use("/api", MortgageRateRouter);

// Start cron job
roleExpiryChecker();
reminderEmailJob();
relevantPropertiesEmailSend();
export default app;
