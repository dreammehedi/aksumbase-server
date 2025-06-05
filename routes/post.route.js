import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";
import { addPost, getPosts, getPostById, updatePost, deletePost, searchPosts, locationSuggestions, getFlaggedPosts, flagPost, reportPost, aiFlagPost, approvePost, suspendPost, archivePost, flagPostApprove, debugPosts, handleContact } from "../controllers/post.controller.js";

const router = express.Router();

// Debug route
router.get('/test', (req, res) => {
  res.json({ message: 'Post route is working' });
  console.log("Post route is working");
});

// Static routes first
router.get("/search", searchPosts);
router.get('/suggestions', locationSuggestions);
router.get('/flagged', getFlaggedPosts);
router.post('/contact', handleContact);


// Dynamic routes with actions
router.put('/:id/approve', verifyToken, approvePost);
router.put('/:id/suspend', verifyToken, suspendPost);
router.put('/:id/archive', verifyToken, archivePost);
router.put('/:id/flag', verifyToken, flagPost);
router.put('/:id/flag/approve', verifyToken, flagPostApprove);
router.put('/:id/report', verifyToken, reportPost);
router.put('/:id/aiflag', verifyToken, aiFlagPost);

// Basic CRUD routes last
router.get("/", verifyToken, getPosts);
router.get("/:id", verifyToken, getPostById);
router.post("/", verifyToken, addPost);
router.put("/:id", verifyToken, updatePost);
router.delete("/:id", verifyToken, deletePost);

router.get('/debug', debugPosts);

export default router;