import express from "express";
import {
  addPost,
  aiFlagPost,
  approvePost,
  archivePost,
  debugPosts,
  deletePost,
  flagPost,
  flagPostApprove,
  getFlaggedPosts,
  getPostById,
  getPosts,
  handleContact,
  locationSuggestions,
  reportPost,
  searchPosts,
  suspendPost,
  updatePost,
} from "../controllers/post.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Debug route
router.get("/test", (req, res) => {
  res.json({ message: "Post route is working" });
  console.log("Post route is working");
});

// Static routes first
router.get("/search", searchPosts);
router.get("/suggestions", locationSuggestions);
router.get("/flagged", getFlaggedPosts);
router.post("/contact", handleContact);

// Dynamic routes with actions
router.put("/:id/approve", verifyToken, approvePost);
router.put("/:id/suspend", verifyToken, suspendPost);
router.put("/:id/archive", verifyToken, archivePost);
router.put("/:id/flag", verifyToken, flagPost);
router.put("/:id/flag/approve", verifyToken, flagPostApprove);
router.put("/:id/report", verifyToken, reportPost);
router.put("/:id/aiflag", verifyToken, aiFlagPost);

// Basic CRUD routes last
router.get("/", getPosts);
router.get("/:id", getPostById);
router.post("/", verifyToken, addPost);
router.put("/:id", verifyToken, updatePost);
router.delete("/:id", verifyToken, deletePost);

router.get("/debug", debugPosts);

export default router;
