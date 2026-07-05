const RefreshToken = require("../models/RefreshToken");
const User = require("../models/User");
const generateTokens = require("../utils/generateToken");
const logger = require("../utils/logger");
const { OAuth2Client } = require("google-auth-library");
const {
  validateRegistration,
  validatelogin,
  validateGoogleAuth,
} = require("../utils/validation");

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

const sanitizeUsername = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

const buildGoogleUsername = async (name, email) => {
  const fallback = email?.split("@")[0] || "google_user";
  const base = sanitizeUsername(name || fallback).slice(0, 24) || "google_user";
  let candidate = base;
  let suffix = 0;

  while (await User.findOne({ username: candidate })) {
    suffix += 1;
    candidate = `${base.slice(0, Math.max(1, 24 - String(suffix).length - 1))}_${suffix}`;
  }

  return candidate;
};

const buildAuthResponse = async (user, message) => {
  const { accessToken, refreshToken } = await generateTokens(user);
  return {
    success: true,
    message,
    accessToken,
    refreshToken,
    userId: user._id,
    username: user.username,
    avatar: user.avatar || "nova",
    profileImageUrl: user.profileImageUrl || null,
  };
};

//user registration
const resgiterUser = async (req, res) => {
  logger.info("Registration endpoint hit...");
  try {
    //validate the schema
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, password, username, avatar } = req.body;

    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      logger.warn("User already exists");
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    user = new User({ username, email, password, avatar });
    user.lastLoginAt = new Date();
    await user.save();
    logger.warn("User saved successfully", user._id);

    const response = await buildAuthResponse(user, "User registered successfully!");
    res.status(201).json(response);
  } catch (e) {
    logger.error("Registration error occured", e);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//user login
const loginUser = async (req, res) => {
  logger.info("Login endpoint hit...");
  try {
    const { error } = validatelogin(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      logger.warn("Invalid user");
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.password) {
      logger.warn("Password login attempted for Google-only account");
      return res.status(400).json({
        success: false,
        message: "This account uses Google Sign-In. Please continue with Google.",
      });
    }

    // user valid password or not
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      logger.warn("Invalid password");
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const response = await buildAuthResponse(user, "Login successful");
    res.json(response);
  } catch (e) {
    logger.error("Login error occured", e);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const googleAuthUser = async (req, res) => {
  logger.info("Google auth endpoint hit...");
  try {
    const { error } = validateGoogleAuth(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    if (!googleClient) {
      logger.error("GOOGLE_CLIENT_ID is not configured");
      return res.status(500).json({
        success: false,
        message: "Google sign-in is not configured",
      });
    }

    const { credential } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleId = payload?.sub;
    const email = payload?.email?.toLowerCase();
    const emailVerified = payload?.email_verified;
    const usernameFromGoogle = payload?.name;
    const profileImageUrl = payload?.picture || null;

    if (!googleId || !email) {
      return res.status(400).json({
        success: false,
        message: "Invalid Google account data",
      });
    }

    if (!emailVerified) {
      return res.status(403).json({
        success: false,
        message: "Google email must be verified",
      });
    }

    let user = await User.findOne({ googleId });
    let createdNewUser = false;

    if (!user) {
      user = await User.findOne({ email });
    }

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (profileImageUrl) {
        user.profileImageUrl = profileImageUrl;
      }
      user.emailVerified = true;
      user.lastLoginAt = new Date();
      await user.save({ validateBeforeSave: false });
    } else {
      const username = await buildGoogleUsername(usernameFromGoogle, email);
      user = await User.create({
        username,
        email,
        googleId,
        profileImageUrl,
        emailVerified: true,
        avatar: "nova",
        lastLoginAt: new Date(),
      });
      createdNewUser = true;
    }

    const response = await buildAuthResponse(user, "Google sign-in successful");
    res.status(createdNewUser ? 201 : 200).json(response);
  } catch (e) {
    logger.error("Google auth error occured", e);
    res.status(500).json({
      success: false,
      message: "Google authentication failed",
    });
  }
};

//refresh token
const refreshTokenUser = async (req, res) => {
  logger.info("Refresh token endpoint hit...");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token missing");
      return res.status(400).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const storedToken = await RefreshToken.findOne({ token: refreshToken });

    if (!storedToken) {
      logger.warn("Invalid refresh token provided");
      return res.status(400).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn("Invalid or expired refresh token");

      return res.status(401).json({
        success: false,
        message: `Invalid or expired refresh token`,
      });
    }

    const user = await User.findById(storedToken.user);

    if (!user) {
      logger.warn("User not found");

      return res.status(401).json({
        success: false,
        message: `User not found`,
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateTokens(user);

    //delete the old refresh token
    await RefreshToken.deleteOne({ _id: storedToken._id });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (e) {
    logger.error("Refresh token error occured", e);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//logout

const logoutUser = async (req, res) => {
  logger.info("Logout endpoint hit...");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token missing");
      return res.status(400).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const storedToken = await RefreshToken.findOneAndDelete({
      token: refreshToken,
    });
    if (!storedToken) {
      logger.warn("Invalid refresh token provided");
      return res.status(400).json({
        success: false,
        message: "Invalid refresh token",
      });
    }
    logger.info("Refresh token deleted for logout");

    res.json({
      success: true,
      message: "Logged out successfully!",
    });
  } catch (e) {
    logger.error("Error while logging out", e);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = { resgiterUser, loginUser, googleAuthUser, refreshTokenUser, logoutUser };
