const Media = require("../models/Media");
const { uploadMediaToCloudinary, deleteMediaFromCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");

const uploadMedia = async (req, res) => {
  logger.info("Starting media upload");
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file found. Please add a file and try again!" });
    }
    const { originalname, mimetype } = req.file;
    const userId = req.user.userId;
    const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
    const newlyCreatedMedia = new Media({
      publicId: cloudinaryUploadResult.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: cloudinaryUploadResult.secure_url,
      userId,
    });
    await newlyCreatedMedia.save();
    res.status(201).json({
      success: true,
      mediaId: newlyCreatedMedia._id,
      url: newlyCreatedMedia.url,
      message: "Media upload is successfully",
    });
  } catch (error) {
    logger.error("Error creating media", error);
    res.status(500).json({ success: false, message: "Error creating media" });
  }
};

const getAllMedias = async (req, res) => {
  try {
    const result = await Media.find({ userId: req.user.userId });
    if (result.length === 0) {
      return res.status(404).json({ success: false, message: "Can't find any media for this user" });
    }
    return res.status(200).json({ success: true, result });
  } catch (e) {
    logger.error("Error fetching medias", e);
    res.status(500).json({ success: false, message: "Error fetching medias" });
  }
};

const deleteMedia = async (req, res) => {
  try {
    const media = await Media.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!media) {
      return res.status(404).json({ success: false, message: "Media not found" });
    }
    await deleteMediaFromCloudinary(media.publicId);
    await Media.findByIdAndDelete(media._id);
    res.json({ success: true, message: "Media deleted successfully" });
  } catch (error) {
    logger.error("Error deleting media", error);
    res.status(500).json({ success: false, message: "Error deleting media" });
  }
};

const getMediaByIds = async (req, res) => {
  try {
    const { ids } = req.query;
    if (!ids) return res.status(400).json({ success: false, message: "ids query param required" });
    const idList = ids.split(",").map((s) => s.trim()).filter(Boolean);
    const result = await Media.find({ _id: { $in: idList } }, "url mimeType originalName");
    const map = {};
    result.forEach((m) => { map[m._id.toString()] = { url: m.url, mimeType: m.mimeType, originalName: m.originalName }; });
    return res.status(200).json({ success: true, map });
  } catch (e) {
    logger.error("Error resolving media by ids", e);
    res.status(500).json({ success: false, message: "Error resolving media" });
  }
};

module.exports = { uploadMedia, getAllMedias, deleteMedia, getMediaByIds };
