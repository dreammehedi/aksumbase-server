import express from "express";
import { upload } from "../../config/upload.js";
import {
  createMarketTrend,
  deleteMarketTrend,
  getMarketTrends,
  marketTrends,
  updateMarketTrend,
} from "../../controllers/home/marketTrends.controller.js";
import { paginationMiddleware } from "../../middleware/pagination.middleware.js";
import { verifyAdminOld } from "../../middleware/verifyAdmin.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const MarketTrendsRouter = express.Router();

MarketTrendsRouter.get("/get-market-trends", getMarketTrends);
MarketTrendsRouter.get("/market-trends", paginationMiddleware, marketTrends);
MarketTrendsRouter.post(
  "/market-trends",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  createMarketTrend
);
MarketTrendsRouter.put(
  "/market-trends",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  updateMarketTrend
);
MarketTrendsRouter.delete(
  "/market-trends/:id",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  deleteMarketTrend
);

export default MarketTrendsRouter;
