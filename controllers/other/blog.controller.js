import { PrismaClient } from "@prisma/client";
import slugify from "slugify";
import { cloudinary } from "../../config/cloudinary.config.js";

const prisma = new PrismaClient();

export const getBlog = async (req, res) => {
  try {
    const data = await prisma.blog.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get blog error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch blogs" });
  }
};

export const blog = async (req, res) => {
  try {
    const { skip = 0, limit = 10 } = req.pagination || {};
    const search = req.query.search || "";

    const where = {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { authorName: { contains: search, mode: "insensitive" } },
      ],
    };

    const data = await prisma.blog.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.blog.count({ where });

    res.status(200).json({
      success: true,
      data,
      pagination: { total, skip: Number(skip), limit: Number(limit) },
    });
  } catch (error) {
    console.error("Get blogs error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch blogs" });
  }
};

export const createBlog = async (req, res) => {
  const {
    title,
    shortDescription,
    longDescription,
    category,
    tags,
    location,
    isFeatured,
    authorName,
  } = req.body;

  try {
    // Validate required fields
    if (
      !title ||
      !shortDescription ||
      !longDescription ||
      !category ||
      !authorName
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Prepare slug
    const slug = slugify(title, { lower: true, strict: true });

    // Upload images
    const image = req.files?.image?.[0];
    const authorImage = req.files?.authorImage?.[0];

    if (!image || !authorImage) {
      return res.status(400).json({
        success: false,
        message: "Image and authorImage are required",
      });
    }

    const newBlog = await prisma.blog.create({
      data: {
        title,
        slug,
        shortDescription,
        longDescription,
        image: image.path,
        imagePublicId: image.filename,
        category,
        tags: Array.isArray(tags) ? tags : JSON.parse(tags || "[]"),
        location,
        isFeatured: isFeatured === "true" || isFeatured === true,
        authorName,
        authorImage: authorImage.path,
        authorImagePublicId: authorImage.filename,
      },
    });

    res.status(201).json({ success: true, data: newBlog });
  } catch (error) {
    console.error("Create blog error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create blog",
      error: error.message,
    });
  }
};
export const updateBlog = async (req, res) => {
  const {
    id,
    title,
    shortDescription,
    longDescription,
    category,
    tags,
    location,
    isFeatured,
    authorName,
  } = req.body;

  try {
    const existingBlog = await prisma.blog.findUnique({ where: { id } });

    if (!existingBlog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    const updatedFields = {
      title,
      slug: slugify(title, { lower: true, strict: true }),
      shortDescription,
      longDescription,
      category,
      tags: Array.isArray(tags) ? tags : JSON.parse(tags || "[]"),
      location,
      isFeatured: isFeatured === "true" || isFeatured === true,
      authorName,
    };

    // ✅ Update image if provided
    if (req.files?.image?.[0]) {
      if (existingBlog.imagePublicId) {
        await cloudinary.uploader.destroy(existingBlog.imagePublicId);
      }

      updatedFields.image = req.files.image[0].path;
      updatedFields.imagePublicId = req.files.image[0].filename;
    }

    // ✅ Update author image if provided
    if (req.files?.authorImage?.[0]) {
      if (existingBlog.authorImagePublicId) {
        await cloudinary.uploader.destroy(existingBlog.authorImagePublicId);
      }

      updatedFields.authorImage = req.files.authorImage[0].path;
      updatedFields.authorImagePublicId = req.files.authorImage[0].filename;
    }

    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: updatedFields,
    });

    return res.status(200).json({ success: true, data: updatedBlog });
  } catch (error) {
    console.error("Update blog error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update blog",
      error: error.message,
    });
  }
};

export const deleteBlog = async (req, res) => {
  const blogIds = req.body;

  if (!Array.isArray(blogIds) || blogIds.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No blog IDs provided" });
  }

  try {
    for (const id of blogIds) {
      const blog = await prisma.blog.findUnique({ where: { id } });

      if (!blog) {
        continue; // Skip if blog not found
      }

      // Delete blog image from Cloudinary
      if (blog.imagePublicId) {
        await cloudinary.uploader.destroy(blog.imagePublicId);
      }

      // Delete author image from Cloudinary
      if (blog.authorImagePublicId) {
        await cloudinary.uploader.destroy(blog.authorImagePublicId);
      }

      // Delete blog from DB
      await prisma.blog.delete({ where: { id } });
    }

    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete blog error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete blog(s)" });
  }
};

export const getBlogBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const blog = await prisma.blog.findUnique({
      where: { slug },
    });

    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    // Update the visit count
    await prisma.blog.update({
      where: { slug },
      data: {
        views: {
          increment: 1, // increment visitCount by 1
        },
      },
    });

    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    console.error("Get blog by slug error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch blog" });
  }
};
