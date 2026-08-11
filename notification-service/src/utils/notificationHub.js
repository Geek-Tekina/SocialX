let ioInstance = null;

const setSocketServer = (io) => {
  ioInstance = io;
};

const emitNotification = (recipientUserId, notification) => {
  if (!ioInstance) return false;
  ioInstance.to(`user:${recipientUserId}`).emit("notification:new", notification);
  return true;
};

module.exports = { setSocketServer, emitNotification };
