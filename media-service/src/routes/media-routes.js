const express = require("express");
const multer = require("multer");

const {
  uploadMedia,
  getAllMedias,
  deleteMedia,
  getMediaByIds,
} = require("../controllers/media-controller");
const { authenticateRequest } = require("../middleware/authMiddleware");
const logger = require("../utils/logger");

const router = express.Router();

//configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single("file");

router.post(
  "/upload",
  authenticateRequest,
  (req, res, next) => {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        logger.error("Multer error while uploading:", err);
        const statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
        return res.status(statusCode).json({
          success: false,
          message: err.code === "LIMIT_FILE_SIZE" ? "File size exceeds 5MB limit" : "Multer error while uploading",
          error: err.message,
        });
      } else if (err) {
        logger.error("Unknown error occured while uploading:", err);
        return res.status(500).json({
          success: false,
          message: "Unknown error occured while uploading",
          error: err.message,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file found!",
        });
      }

      next();
    });
  },
  uploadMedia
);

router.get("/get", authenticateRequest, getAllMedias);
router.get("/resolve", authenticateRequest, getMediaByIds);
router.delete("/:id", authenticateRequest, deleteMedia);

module.exports = router;
