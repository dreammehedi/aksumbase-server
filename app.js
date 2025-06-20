import { v2 as cloudinary } from "cloudinary";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
// Import routes
import passport from "./config/passport.config.js";
import reminderEmailJob from "./helper/reminderEmailJob.js";
import roleExpiryChecker from "./helper/roleExpiryChecker.js";
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
import BlogRouter from "./routes/other/blog.route.js";
import EmailConfigurationRouter from "./routes/other/emailConfiguration.route.js";
import OtherRouter from "./routes/other/other.route.js";
import SellerResourcesRouter from "./routes/other/sellerResources.route.js";
import StripeConfigurationRouter from "./routes/other/stripeConfiguration.route.js";
import { default as PropertyRouter } from "./routes/property/property.route.js";
import PropertyBookmarkRouter from "./routes/property/propertyBookmark.route.js";
import PropertyContactUserRequestRouter from "./routes/property/propertyContactUserRequest.route.js";
import PropertyTourRequestRouter from "./routes/property/propertyTourRequest.route.js";

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
// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Adjust the path if necessary

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173", // Development
  "https://aksumbase.com", // Production
  "https://www.aksumbase.com", // Production with www
  "https://aksumbase-frontend.vercel.app",
  "https://aksumbase-frontend-qsfw.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Set-Cookie"],
    maxAge: 86400, // 24 hours
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

// routes
app.use("/api", HeroBannerRouter);
app.use("/api", MarketTrendsRouter);
app.use("/api", MortageToolsRouter);
app.use("/api", OtherRouter);
app.use("/api", BlogRouter);
app.use("/api/authentication", AuthenticationRouter);
app.use("/api/auth", AuthRouter);
app.use("/api", EmailConfigurationRouter);
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

// Start cron job
roleExpiryChecker();
reminderEmailJob();
export default app;
