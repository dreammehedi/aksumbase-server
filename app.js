import { v2 as cloudinary } from "cloudinary";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// Import routes
import auditlogRoutes from "./routes/auditlog.route.js";
import authRoutes from "./routes/auth.route.js";
import emailRoutes from "./routes/email.route.js";
import HeroBannerRouter from "./routes/home/heroBanner.route.js";
import MarketTrendsRouter from "./routes/home/marketTrends.route.js";
import MortageToolsRouter from "./routes/home/mortageTools.route.js";
import postRoutes from "./routes/post.route.js";
import reviewRoutes from "./routes/review.route.js";
import testRoutes from "./routes/test.route.js";
import userRoutes from "./routes/user.route.js";

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

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/auditlog", auditlogRoutes);
app.use("/api/test", testRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/reviews", reviewRoutes);

// home routes
app.use("/api", HeroBannerRouter);
app.use("/api", MarketTrendsRouter);
app.use("/api", MortageToolsRouter);
export default app;
