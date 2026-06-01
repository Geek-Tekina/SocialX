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

    for (const media of mediaToDelete) {
      try {
        await deleteMediaFromCloudinary(media.publicId);
        await Media.findByIdAndDelete(media._id);

        logger.info(
          `Deleted media ${media._id} associated with this deleted post ${postId}`
        );
      } catch (e) {
        logger.error(e, `Error deleting media ${media._id} for post ${postId}`);
      }
    }

    logger.info(`Processed deletion of media for post id ${postId}`);
  } catch (e) {
    logger.error(e, "Error occurred while media deletion");
  }
};

module.exports = { handlePostDeleted };
