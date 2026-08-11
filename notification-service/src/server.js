require("dotenv").config();
const http = require("http");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const { Server } = require("socket.io");
const logger = require("./utils/logger");
const { requestLogger } = require("./utils/safeLog");
const notificationRoutes = require("./routes/notification-routes");
const errorHandler = require("./middleware/errorHandler");
const { connectToRabbitMQ, consumeEvents } = require("./utils/rabbitmq");
const {
  handleFriendRequestCreated,
  handleFriendRequestAccepted,
  handleFriendRequestRejected,
  handleFriendRequestCancelled,
  setSocketServer,
  authenticateSocket,
} = require("./eventHandlers/notification-event-handlers");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

const PORT = process.env.PORT || 3006;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => logger.info("Connected to mongodb"))
  .catch((error) => logger.error("Mongo connection error", error));

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger(logger));

app.use("/api/notifications", notificationRoutes);
app.use(errorHandler);

setSocketServer(io);
io.use(authenticateSocket);

io.on("connection", (socket) => {
  const room = `user:${socket.userId}`;
  socket.join(room);
  logger.info(`Socket connected for ${room}`);

  socket.emit("notification:connected", {
    success: true,
    userId: socket.userId,
  });

  socket.on("disconnect", () => {
    logger.info(`Socket disconnected for ${room}`);
  });
});

async function startServer() {
  try {
    await connectToRabbitMQ();
    await consumeEvents("friend.request.created", handleFriendRequestCreated);
    await consumeEvents("friend.request.accepted", handleFriendRequestAccepted);
    await consumeEvents("friend.request.rejected", handleFriendRequestRejected);
    await consumeEvents("friend.request.cancelled", handleFriendRequestCancelled);

    server.listen(PORT, () => {
      logger.info(`Notification service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start notification service", error);
    process.exit(1);
  }
}

startServer();

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "reason:", reason);
});
