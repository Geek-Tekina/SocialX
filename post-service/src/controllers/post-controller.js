const Post = require("../models/Post");
require("../models/User"); // register User model so populate() works
const mongoose = require("mongoose");
const logger = require("../utils/logger");
const { publishEvent } = require("../utils/rabbitmq");
const { validateCreatePost } = require("../utils/validation");
const { safeJson } = require("../utils/safeLog");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const sendInvalidPostId = (res) =>
  res.status(400).json({
    success: false,
    message: "Invalid post id",
  });

async function invalidatePostCache(req, input) {
  const cachedKey = `post:${input}`;
  await req.redisClient.del(cachedKey);

  const keys = await req.redisClient.keys("posts:*");
  if (keys.length > 0) {
    await req.redisClient.del(keys);
  }
}

const createPost = async (req, res) => {
  logger.info("Create post endpoint hit");
  try {
    //validate the schema
    const { error } = validateCreatePost(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { content, mediaIds } = req.body;
    const newlyCreatedPost = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });

    await newlyCreatedPost.save();

    await publishEvent("post.created", {
      postId: newlyCreatedPost._id.toString(),
      userId: newlyCreatedPost.user.toString(),
      content: newlyCreatedPost.content,
      createdAt: newlyCreatedPost.createdAt,
    });

    await invalidatePostCache(req, newlyCreatedPost._id.toString());
    logger.info(
      `Post created successfully ${safeJson({
        postId: newlyCreatedPost._id,
        userId: newlyCreatedPost.user,
        mediaIds: newlyCreatedPost.mediaIds,
      })}`
    );
    res.status(201).json({
      success: true,
      message: "Post created successfully",
    });
  } catch (e) {
    logger.error("Error creating post", e);
    res.status(500).json({
      success: false,
      message: "Error creating post",
    });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    if (page < 1 || limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        message: "Page must be at least 1 and limit must be between 1 and 50",
      });
    }

    const startIndex = (page - 1) * limit;

    const cacheKey = `posts:${page}:${limit}`;
    const cachedPosts = await req.redisClient.get(cacheKey);

    if (cachedPosts) {
      return res.json(JSON.parse(cachedPosts));
    }

    const posts = await Post.find({})
      .populate("user", "username avatar profileImageUrl")
      .populate("comments.user", "username avatar profileImageUrl")
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const totalNoOfPosts = await Post.countDocuments();

    const result = {
      posts,
      currentpage: page,
      totalPages: Math.ceil(totalNoOfPosts / limit),
      totalPosts: totalNoOfPosts,
    };

    //save your posts in redis cache
    await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));

    res.json(result);
  } catch (e) {
    logger.error("Error fetching posts", e);
    res.status(500).json({
      success: false,
      message: "Error fetching posts",
    });
  }
};

const getPost = async (req, res) => {
  try {
    const postId = req.params.id;
    if (!isValidObjectId(postId)) {
      return sendInvalidPostId(res);
    }

    const cacheKey = `post:${postId}`;
    const cachedPost = await req.redisClient.get(cacheKey);

    if (cachedPost) {
      return res.json(JSON.parse(cachedPost));
    }

    const singlePostDetailsbyId = await Post.findById(postId)
      .populate("user", "username avatar profileImageUrl")
      .populate("comments.user", "username avatar profileImageUrl");

    if (!singlePostDetailsbyId) {
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });
    }

    await req.redisClient.setex(
      cacheKey,
      3600,
      JSON.stringify(singlePostDetailsbyId)
    );

    res.json(singlePostDetailsbyId);
  } catch (e) {
    logger.error("Error fetching post", e);
    res.status(500).json({
      success: false,
      message: "Error fetching post by ID",
    });
  }
};

const toggleLikePost = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return sendInvalidPostId(res);
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });
    }

    const userId = req.user.userId;
    const alreadyLiked = post.likes.some(
      (likedUserId) => likedUserId.toString() === userId
    );

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (likedUserId) => likedUserId.toString() !== userId
      );
    } else {
      post.likes.push(userId);
    }

    await post.save();
    await invalidatePostCache(req, req.params.id);

    res.json({
      success: true,
      liked: !alreadyLiked,
      likesCount: post.likes.length,
      likes: post.likes,
    });
  } catch (e) {
    logger.error("Error toggling post like", e);
    res.status(500).json({
      success: false,
      message: "Error toggling post like",
    });
  }
};

const addComment = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return sendInvalidPostId(res);
    }

    const content = (req.body.content || "").trim();
    if (content.length < 1 || content.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Comment must be between 1 and 500 characters",
      });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    post.comments.push({ user: req.user.userId, content });
    await post.save();
    await invalidatePostCache(req, req.params.id);

    const updatedPost = await Post.findById(req.params.id)
      .populate("user", "username avatar profileImageUrl")
      .populate("comments.user", "username avatar profileImageUrl");

    res.status(201).json({
      success: true,
      comments: updatedPost.comments,
    });
  } catch (e) {
    logger.error("Error adding comment", e);
    res.status(500).json({
      success: false,
      message: "Error adding comment",
    });
  }
};

const deletePost = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return sendInvalidPostId(res);
    }

    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });
    }

    await publishEvent("post.deleted", {
      postId: post._id.toString(),
      userId: req.user.userId,
      mediaIds: post.mediaIds,
    });

    await invalidatePostCache(req, req.params.id);
    res.json({
      message: "Post deleted successfully",
    });
  } catch (e) {
    logger.error("Error deleting post", e);
    res.status(500).json({
      success: false,
      message: "Error deleting post",
    });
  }
};

module.exports = { createPost, getAllPosts, getPost, deletePost, toggleLikePost, addComment };
