import express from "express";
import { upload } from "../../config/upload.js";
import {
  blog,
  createBlog,
  deleteBlog,
  getBlog,
  getBlogBySlug,
  updateBlog,
} from "../../controllers/other/blog.controller.js";
import { paginationMiddleware } from "../../middleware/pagination.middleware.js";
import { verifyAdminOld } from "../../middleware/verifyAdmin.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const BlogRouter = express.Router();

BlogRouter.get("/get-blog", getBlog);
BlogRouter.get("/blog", paginationMiddleware, blog);
BlogRouter.post(
  "/blog",
  verifyToken,
  verifyAdminOld,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "authorImage", maxCount: 1 },
  ]),
  createBlog
);
BlogRouter.put(
  "/blog",
  verifyToken,
  verifyAdminOld,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "authorImage", maxCount: 1 },
  ]),
  updateBlog
);
BlogRouter.delete(
  "/blog/delete",
  verifyToken,
  verifyAdminOld,
  upload.none(),
  deleteBlog
);

BlogRouter.get("/blog-details/:slug", getBlogBySlug);
export default BlogRouter;
