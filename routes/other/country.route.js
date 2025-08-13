import express from "express";
import { upload } from "../../config/upload.js";
import {
  country,
  createCountry,
  deleteCountry,
  getCountry,
  updateCountry,
} from "../../controllers/other/country.controller.js";
import { paginationMiddleware } from "../../middleware/pagination.middleware.js";
import { verifyAdminOld } from "../../middleware/verifyAdmin.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const CountryRouter = express.Router();

CountryRouter.get("/get-country", getCountry);
CountryRouter.get("/country", paginationMiddleware, country);
CountryRouter.post(
  "/country",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  createCountry
);
CountryRouter.put(
  "/country",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  updateCountry
);
CountryRouter.delete(
  "/country/delete",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  deleteCountry
);

export default CountryRouter;
