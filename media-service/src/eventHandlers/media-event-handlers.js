const Media = require("../models/Media");
const { deleteMediaFromCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");

const handlePostDeleted = async (event) => {
  const { postId, mediaIds = [] } = event;
  try {
    if (!mediaIds.length) {
      logger.info(`No media found for deleted post ${postId}`);
      return;
    }

    const mediaToDelete = await Media.find({ _id: { $in: mediaIds } });
    const failedMediaIds = [];

    for (const media of mediaToDelete) {
      try {
        await deleteMediaFromCloudinary(media.publicId);
        await Media.findByIdAndDelete(media._id);

        logger.info(
          `Deleted media ${media._id} associated with this deleted post ${postId}`
        );
      } catch (e) {
        logger.error(e, `Error deleting media ${media._id} for post ${postId}`);
        failedMediaIds.push(media._id.toString());
      }
    }

    if (failedMediaIds.length) {
      throw new Error(
        `Failed to delete ${failedMediaIds.length} media item(s) for post ${postId}`
      );
    }

    logger.info(`Processed deletion of media for post id ${postId}`);
  } catch (e) {
    logger.error(e, "Error occurred while media deletion");
    throw e;
  }
};

module.exports = { handlePostDeleted };
