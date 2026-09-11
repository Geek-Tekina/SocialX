require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const searchRoutes = require("./routes/search-routes");
const Search = require("./models/Search");
const { requestLogger } = require("./utils/safeLog");
const {
  handlePostCreated,
  handlePostDeleted,
} = require("./eventHandlers/search-event-handlers");
const { initializeRedisClient } = require("./config/redisConfig");

const app = express();
const PORT = process.env.PORT || 3004;

//connect to mongodb
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    logger.info("Connected to mongodb");

    try {
      await Search.createIndexes();
      logger.info("Ensured MongoDB search text index exists");
    } catch (e) {
      logger.error("Failed to ensure search text index", e);
    }
  })
  .catch((e) => logger.error("Mongo connection error", e));

// Initialize Redis client (supports both local and Upstash)
const redisClient = initializeRedisClient();

//middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(requestLogger(logger));
app.use("/api/search", searchRoutes);

app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ();

    //consume the events / subscribe to the events
    await consumeEvent("post.created", handlePostCreated);
    await consumeEvent("post.deleted", handlePostDeleted);

    app.listen(PORT, () => {
      logger.info(`Search service is running on port: ${PORT}`);
    });
  } catch (e) {
    logger.error(e, "Failed to start search service");
    process.exit(1);
  }
}

startServer();
