require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const logger = require("./utils/logger");
const { requestLogger } = require("./utils/safeLog");
const { connectToRabbitMQ } = require("./utils/rabbitmq");
const friendRoutes = require("./routes/friend-routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3005;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => logger.info("Connected to mongodb"))
  .catch((error) => logger.error("Mongo connection error", error));

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger(logger));

app.use("/api/friends", friendRoutes);
app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ();
    app.listen(PORT, () => {
      logger.info(`Friend service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start friend service", error);
    process.exit(1);
  }
}

startServer();

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "reason:", reason);
});
