const Search = require("../models/Search");
const logger = require("../utils/logger");

async function handlePostCreated(event) {
  try {
    const newSearchPost = await Search.findOneAndUpdate(
      { postId: event.postId },
      {
        $set: {
          userId: event.userId,
          content: event.content,
          createdAt: event.createdAt,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    logger.info(
      `Search post created: ${event.postId}, ${newSearchPost._id.toString()}`
    );
  } catch (e) {
    logger.error(e, "Error handling post creation event");
    throw e;
  }
}

async function handlePostDeleted(event) {
  try {
    await Search.findOneAndDelete({ postId: event.postId });
    logger.info(`Search post deleted: ${event.postId}`);
  } catch (error) {
    logger.error(error, "Error handling post deletion event");
    throw error;
  }
}

module.exports = { handlePostCreated, handlePostDeleted };
