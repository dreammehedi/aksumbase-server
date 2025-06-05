import { createError } from '../utils/error.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


// Get Post by status
export const getPosts = async (req, res, next) => {

  try {
    console.log('Received query params:', req.query);
    const where = {};

    // Basic filters
    if (req.query.status && req.query.status !== 'all') where.status = req.query.status;
    if (req.query.type) where.type = req.query.type;
    if (req.query.property) where.property = req.query.property;
    if (req.query.city) where.city = req.query.city;
    if (req.query.zip) where.zip = req.query.zip;
    if (req.query.state) where.state = req.query.state;
    if (req.query.neighborhood) where.neighborhood = req.query.neighborhood;
    if (req.query.address) where.address = { contains: req.query.address, mode: 'insensitive' };

    // Price
    if (req.query.minPrice) where.price = { ...where.price, gte: parseFloat(req.query.minPrice) };
    if (req.query.maxPrice) where.price = { ...where.price, lte: parseFloat(req.query.maxPrice) };

    // Bedrooms/Bathrooms
    if (req.query.bedrooms) where.bedrooms = { gte: parseInt(req.query.bedrooms) };
    if (req.query.bathrooms) where.bathrooms = { gte: parseInt(req.query.bathrooms) };

    // Home Type
    if (req.query.homeType) where.property = Array.isArray(req.query.homeType) ? { in: req.query.homeType } : req.query.homeType;

    // Listing Type
    if (req.query.listingType) where.listingType = req.query.listingType;

    // Square Footage
    if (req.query.minSqft) where.size = { ...where.size, gte: Number(req.query.minSqft) };
    if (req.query.maxSqft) where.size = { ...where.size, lte: Number(req.query.maxSqft) };

    // Lot Size
    if (req.query.minLotSize) where.lotSize = { ...where.lotSize, gte: Number(req.query.minLotSize) };
    if (req.query.maxLotSize) where.lotSize = { ...where.lotSize, lte: Number(req.query.maxLotSize) };

    // Year Built
    if (req.query.minYearBuilt) where.yearBuilt = { ...where.yearBuilt, gte: Number(req.query.minYearBuilt) };
    if (req.query.maxYearBuilt) where.yearBuilt = { ...where.yearBuilt, lte: Number(req.query.maxYearBuilt) };

    // HOA Fees
    if (req.query.maxHoaFees) where.hoaFees = { lte: Number(req.query.maxHoaFees) };

    // Listing Status
    if (req.query.listingStatus) where.listingStatus = req.query.listingStatus;

    // Garage, Basement, Fireplace, Pool
    if (req.query.garage) where.garage = req.query.garage === 'true';
    if (req.query.basement) where.basement = req.query.basement === 'true';
    if (req.query.fireplace) where.fireplace = req.query.fireplace === 'true';
    if (req.query.pool) where.pool = req.query.pool === 'true';

    // Pets
    if (req.query.pet) where.pet = req.query.pet;

    // Lease Length, Furnished, Deposit
    if (req.query.leaseLength) where.leaseLength = req.query.leaseLength;
    if (req.query.furnished) where.furnished = req.query.furnished === 'true';
    if (req.query.deposit) where.deposit = { lte: Number(req.query.deposit) };

    // Move-in Date
    if (req.query.moveInDate) where.moveInDate = { gte: new Date(req.query.moveInDate) };

    // Amenities
    if (req.query.amenities) {
      where.amenities = {
        hasEvery: Array.isArray(req.query.amenities) ? req.query.amenities : [req.query.amenities]
      };
    }

    // Listing Age
    if (req.query.listingAge) {
      const days = Number(req.query.listingAge.match(/\d+/)?.[0]);
      if (days) {
        where.createdAt = { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
      }
    }

    // Keyword Search (search bar)
    if (req.query.keywords) {
      where.OR = [
        { title: { contains: req.query.keywords, mode: 'insensitive' } },
        { address: { contains: req.query.keywords, mode: 'insensitive' } },
        { city: { contains: req.query.keywords, mode: 'insensitive' } },
        { zip: { contains: req.query.keywords, mode: 'insensitive' } },
        { description: { contains: req.query.keywords, mode: 'insensitive' } },
        { neighborhood: { contains: req.query.keywords, mode: 'insensitive' } }
      ];
    }

    console.log('Search query where clause:', where);

    const posts = await prisma.post.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Found posts:', posts.length);
    console.log('Post types:', posts.map(p => p.type));

    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Search error:', error);
    next(error);
  }
};

// Add Post
export const addPost = async (req, res, next) => {
  try {
    const {
      title, price, address, city, state, zip, latitude, longitude, neighborhood, type, property,
      bedrooms, bathrooms, size, lotSize, yearBuilt, hoaFees, listingStatus,
      listingType, leaseLength, furnished, deposit, moveInDate, amenities,
      garage, basement, fireplace, pool, pet, utilities, income, school, bus, restaurant,
      images, description
    } = req.body;

    // Get user info from token
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Fetch user snapshot
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, avatar: true, email: true }
    });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const post = await prisma.post.create({
      data: {
        title,
        price: Number(price),
        address,
        city,
        state,
        zip,
        latitude: latitude ? String(latitude) : null,
        longitude: longitude ? String(longitude) : null,
        neighborhood,
        type,
        property,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        size: Number(size),
        lotSize: lotSize ? Number(lotSize) : null,
        yearBuilt: yearBuilt ? Number(yearBuilt) : null,
        hoaFees: hoaFees ? Number(hoaFees) : null,
        listingStatus,
        listingType,
        leaseLength,
        furnished: furnished === true || furnished === 'true',
        deposit: deposit ? Number(deposit) : null,
        moveInDate: moveInDate ? new Date(moveInDate) : null,
        amenities: Array.isArray(amenities) ? amenities : amenities ? [amenities] : [],
        garage: garage === true || garage === 'true',
        basement: basement === true || basement === 'true',
        fireplace: fireplace === true || fireplace === 'true',
        pool: pool === true || pool === 'true',
        pet,
        utilities,
        income,
        school,
        bus,
        restaurant,
        images: Array.isArray(images) ? images : [],
        description,
        userId,
        userName: user.username,
        userAvatar: user.avatar,
        userEmail: user.email,
      }
    });

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};


// Get Post by ID
export const getPostById = async (req, res) => {
  const id = req.params.id;
  try {
    const post = await prisma.post.findUnique({
      where: {
        id: id
      },
      include: {
        user: {
          select: {
            username: true,
            email: true,
            avatar: true
          }
        },
        Review: true
      }
    });
    res.status(200).json(post);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Update Post
export const updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // First check if the post exists
    const existingPost = await prisma.post.findUnique({
      where: { id }
    });

    if (!existingPost) {
      return next(createError(404, "Post not found"));
    }

    // Check if user is admin or the post owner
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return next(createError(403, "User not found"));
    }

    // Allow update if user is admin OR the post owner
    if (user.role !== 'admin' && existingPost.userId !== userId) {
      return next(createError(403, "You are not authorized to update this post"));
    }

    // Update the post
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        ...req.body,
        updatedAt: new Date()
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'update_post',
        reason: user.role === 'admin' ? 'Post updated by admin' : 'Post updated by owner',
        userId: userId
      }
    });

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: updatedPost
    });
  } catch (error) {
    console.error('Error updating post:', error);
    next(error);
  }
};


// Delete Post
export const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    // First check if the post exists
    const existingPost = await prisma.post.findUnique({
      where: { id },
      include: {
        Review: true // Include related reviews
      }
    });

    if (!existingPost) {
      return next(createError(404, "Post not found"));
    }

    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Delete related reviews first
      if (existingPost.Review && existingPost.Review.length > 0) {
        await tx.review.deleteMany({
          where: { postId: id }
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: 'delete_post',
          reason: 'Post deleted by user',
          userId: req.userId
        }
      });

      // Finally delete the post
      await tx.post.delete({
        where: { id }
      });
    });

    res.status(200).json({
      success: true,
      message: "Post and related data deleted successfully"
    });

  } catch (error) {
    console.error('Error deleting post:', error);
    if (error.code === 'P2025') {
      return next(createError(404, "Post not found"));
    }
    next(createError(500, "Failed to delete post"));
  }
};


// Add this new function to handle contact requests
export const handleContact = async (req, res, next) => {
  try {
    const { postId, name, email } = req.body;
    const userId = req.userId;

    // Create contact request
    const contact = await prisma.contact.create({
      data: {
        postId,
        userId,
        name,
        email,        
        status: 'pending'
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CONTACT_REQUEST',
        details: `Contact request sent for post ${postId}`,
        ipAddress: req.ip
      }
    });

    res.status(200).json({
      success: true,
      message: "Contact request sent successfully",
      data: contact
    });
  } catch (error) {
    console.error('Error creating contact request:', error);
    next(error);
  }
}; 


// Add search functionality home page
export const searchPosts = async (req, res, next) => {
  try {
    console.log('Search request query:', req.query);

    const where = {};
    if (req.query.status && req.query.status !== 'all') {
      where.status = req.query.status;
    }

    // Add type filter if provided
    if (req.query.type) {
      // Ensure type is a single string value
      where.type = Array.isArray(req.query.type) ? req.query.type[0] : req.query.type;
      console.log('Filtering by type:', where.type);
    }

    // Add other filters
    if (req.query.query) {
      where.OR = [
        { title: { contains: req.query.query, mode: 'insensitive' } },
        { address: { contains: req.query.query, mode: 'insensitive' } },
        { city: { contains: req.query.query, mode: 'insensitive' } },
        { zip: { contains: req.query.query, mode: 'insensitive' } },
      ];
    }

    if (req.query.property) where.property = req.query.property;
    if (req.query.city) where.city = req.query.city;
    if (req.query.minPrice) where.price = { gte: parseFloat(req.query.minPrice) };
    if (req.query.maxPrice) where.price = { ...where.price, lte: parseFloat(req.query.maxPrice) };
    if (req.query.bedrooms) where.bedrooms = parseInt(req.query.bedrooms);
    if (req.query.bathrooms) where.bathrooms = parseInt(req.query.bathrooms);

    console.log('Search query where clause:', where);

    const posts = await prisma.post.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true
          }
        },
        Review: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Found posts:', posts.length);
    console.log('Post types:', posts.map(p => p.type));

    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Search error:', error);
    next(error);
  }
};


// 
export const locationSuggestions = async (req, res, next) => {
  try {
    const { query } = req.query;
    const suggestions = await prisma.post.findMany({
      where: {
        address: { contains: query, mode: 'insensitive' }
      },
      select: { address: true },
      take: 5
    });
    res.json({ success: true, data: suggestions.map(s => s.address) });
  } catch (error) {
    next(error);
  }
};

// Get flagged posts
export const getFlaggedPosts = async (req, res, next) => {
  try {
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { flagStatus: 'pending' },
          { aiFlagged: true }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true
          }
        },
        Review: true  // Changed from post to Review
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    next(error);
  }
};

// Flag a post (system)
export const flagPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { flagReason, flagStatus } = req.body;
    const post = await prisma.post.update({
      where: { id },
      data: {
        aiFlagged: true,
        flagReason,
        flagStatus: flagStatus || 'pending'
      }
    });
    res.json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};
// Flag a post approve
export const flagPostApprove = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Update the post to remove flags
    const post = await prisma.post.update({
      where: { id },
      data: {
        aiFlagged: false,
        flagStatus: 'approved',
        flagReason: null,
        flaggedAt: null
      }
    });

    // Create audit log for approval
    await prisma.auditLog.create({
      data: {
        action: 'approved_flagged_listing',
        reason: 'Flagged listing approved by moderator',
        userId: req.userId
      }
    });

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// Report a post (user)
export const reportPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, reportReason } = req.body;
    const post = await prisma.post.update({
      where: { id },
      data: {
        reportedBy: { push: userId },
        flagReason: reportReason,
        flagStatus: 'pending'
      }
    });
    res.json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};

// AI-flag a post
export const aiFlagPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { aiFlagReason } = req.body;
    const post = await prisma.post.update({
      where: { id },
      data: { aiFlagged: true, aiFlagReason }
    });
    res.json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};

// Approve a post
export const approvePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('Approving post with ID:', id);
    const post = await prisma.post.update({
      where: { id },
      data: {
        status: 'approved',
        flagged: false,
        updatedAt: new Date()
      }
    });
    console.log('Post updated successfully:', post);

    // Create audit log entry
    const auditLog = await prisma.auditLog.create({
      data: {
        action: 'approved listing',
        reason: 'Listing approved by moderator',
        userId: req.userId || null
      }
    });
    console.log('Audit log created successfully', auditLog);

    res.json({ success: true, data: post });
  } catch (error) {
    console.error('Error in approvePost:', error);
    next(error);
  }
};

// Suspend a post
export const suspendPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.update({
      where: { id },
      data: {
        status: 'suspended',
        updatedAt: new Date()
      }
    });

    // Create audit log entry
    const auditLog = await prisma.auditLog.create({
      data: {
        action: 'suspended listing',
        reason: 'Listing suspended by moderator',
        userId: req.userId || null
      }
    });
    console.log('Audit log created successfully', auditLog);

    res.json({ success: true, data: post });
  } catch (error) {
    console.log('Error in suspendPost', error);
    next(error);
  }
};

// Archive a post
export const archivePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.update({
      where: { id },
      data: {
        status: 'archived',
        updatedAt: new Date()
      }
    });

    // Create audit log entry
    const auditLog = await prisma.auditLog.create({
      data: {
        action: 'archived listing',
        reason: 'Listing archived by moderator',
        userId: req.userId || null
      }
    });
    console.log('Audit log created successfully', auditLog);

    res.json({ success: true, data: post });
  } catch (error) {
    console.log('Error in archivePost', error);
    next(error);
  }
};



// Get all audit logs
export const getAuditLogs = async (req, res, next) => {
  console.log('Getting audit logs', getAuditLogs);
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    });
    res.json({ data: logs });
  } catch (error) {
    next(error);
  }
};

// Add this new function
export const checkForAutomatedFlags = async (post) => {
  const flags = [];

  // Check for duplicate content
  const duplicateCheck = await prisma.post.findFirst({
    where: {
      id: { not: post.id },
      OR: [
        { title: post.title },
        { address: post.address }
      ]
    }
  });
  if (duplicateCheck) {
    flags.push({
      type: 'duplicate',
      reason: 'Similar listing already exists'
    });
  }

  // Check for offensive content
  const offensiveWords = [
    'scam', 'fake', 'fraud', 'illegal', 'spam',
    // Add more offensive words as needed
  ];

  const hasOffensiveContent = offensiveWords.some(word =>
    post.title?.toLowerCase().includes(word) ||
    post.description?.toLowerCase().includes(word)
  );

  if (hasOffensiveContent) {
    flags.push({
      type: 'offensive',
      reason: 'Contains inappropriate content'
    });
  }

  // Check for inconsistent data
  if (post.price < 0 || post.bedrooms < 0 || post.bathrooms < 0) {
    flags.push({
      type: 'inconsistent',
      reason: 'Invalid property values'
    });
  }

  // Check for suspicious pricing
  const avgPricePerBedroom = post.price / post.bedrooms;
  if (avgPricePerBedroom < 1000 || avgPricePerBedroom > 1000000) {
    flags.push({
      type: 'suspicious',
      reason: 'Unusual price per bedroom'
    });
  }

  // Check for missing required images
  if (!post.images || post.images.length === 0) {
    flags.push({
      type: 'incomplete',
      reason: 'No images provided'
    });
  }

  return flags;
};

// Temporary debug endpoint
export const debugPosts = async (req, res, next) => {
  try {
    const allPosts = await prisma.post.findMany({
      where: {
        type: 'rent',
        status: 'approved'
      }
    });

    console.log('Debug - All approved rent posts:', allPosts);

    res.json({
      success: true,
      count: allPosts.length,
      posts: allPosts
    });
  } catch (error) {
    console.error('Debug error:', error);
    next(error);
  }
};

// (No code below this line!)
// The file should end here.