const Search = require("../models/Search");
const User = require("../models/User");
const logger = require("../utils/logger");

//implement caching here for 2 to 5 min
const searchPostController = async (req, res) => {
  logger.info("Search endpoint hit!");
  try {
    const query = (req.query.query || "").trim();

    if (!query || query.length < 2 || query.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Search query must be between 2 and 100 characters",
      });
    }

    const results = await Search.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10);

    // Resolve userIds to usernames in one batch query
    const userIds = [...new Set(results.map((r) => r.userId))];
    const users = await User.find({ _id: { $in: userIds } }, "username avatar profileImageUrl");
    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = {
        username: u.username,
        avatar: u.avatar,
        profileImageUrl: u.profileImageUrl || null,
      };
    });

    const enriched = results.map((r) => ({
      ...r.toObject(),
      username: userMap[r.userId]?.username || null,
      avatar: userMap[r.userId]?.avatar || "nova",
      profileImageUrl: userMap[r.userId]?.profileImageUrl || null,
    }));

    res.json(enriched);
  } catch (e) {
    logger.error("Error while searching post", e);
    res.status(500).json({
      success: false,
      message: "Error while searching post",
    });
  }
};

module.exports = { searchPostController };
