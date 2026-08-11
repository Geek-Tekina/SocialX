const mongoose = require("mongoose");
const FriendRequest = require("../models/FriendRequest");
const User = require("../models/User");
const logger = require("../utils/logger");
const { publishEvent } = require("../utils/rabbitmq");
const { validateCreateFriendRequest } = require("../utils/validation");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const toFriendRequestResponse = (doc) => {
  if (!doc) return null;
  return {
    id: doc._id,
    senderUserId: doc.senderUserId,
    receiverUserId: doc.receiverUserId,
    sender: doc.senderUserId?.username ? {
      id: doc.senderUserId._id,
      username: doc.senderUserId.username,
      avatar: doc.senderUserId.avatar,
      profileImageUrl: doc.senderUserId.profileImageUrl,
    } : null,
    receiver: doc.receiverUserId?.username ? {
      id: doc.receiverUserId._id,
      username: doc.receiverUserId.username,
      avatar: doc.receiverUserId.avatar,
      profileImageUrl: doc.receiverUserId.profileImageUrl,
    } : null,
    status: doc.status,
    message: doc.message,
    respondedAt: doc.respondedAt,
    acceptedAt: doc.acceptedAt,
    cancelledAt: doc.cancelledAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const buildEventPayload = (friendRequest, eventType) => ({
  eventId: `${friendRequest._id}:${eventType}:${friendRequest.updatedAt.getTime()}`,
  friendRequestId: friendRequest._id.toString(),
  senderUserId: friendRequest.senderUserId.toString(),
  receiverUserId: friendRequest.receiverUserId.toString(),
  status: friendRequest.status,
  message: friendRequest.message,
  eventType,
  occurredAt: new Date().toISOString(),
});

const sendFriendRequest = async (req, res) => {
  try {
    const { error } = validateCreateFriendRequest(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const senderUserId = req.user.userId;
    const { receiverUserId, message } = req.body;

    if (!isValidObjectId(receiverUserId) || !isValidObjectId(senderUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    if (senderUserId === receiverUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a friend request to yourself",
      });
    }

    const existingOutgoing = await FriendRequest.findOne({
      senderUserId,
      receiverUserId,
    });

    if (existingOutgoing?.status === "pending") {
      return res.status(409).json({
        success: false,
        message: "Friend request already pending",
      });
    }

    const existingIncoming = await FriendRequest.findOne({
      senderUserId: receiverUserId,
      receiverUserId: senderUserId,
    });

    if (existingIncoming?.status === "pending") {
      return res.status(409).json({
        success: false,
        message: "This user already sent you a pending request",
      });
    }

    if (existingIncoming?.status === "accepted") {
      return res.status(409).json({
        success: false,
        message: "You are already friends",
      });
    }

    if (existingOutgoing?.status === "accepted") {
      return res.status(409).json({
        success: false,
        message: "You are already friends",
      });
    }

    let friendRequest;

    if (existingOutgoing) {
      existingOutgoing.status = "pending";
      existingOutgoing.message = message || "";
      existingOutgoing.respondedAt = null;
      existingOutgoing.acceptedAt = null;
      existingOutgoing.cancelledAt = null;
      friendRequest = await existingOutgoing.save();
    } else {
      friendRequest = await FriendRequest.create({
        senderUserId,
        receiverUserId,
        message: message || "",
      });
    }

    await publishEvent("friend.request.created", buildEventPayload(friendRequest, "created"));

    return res.status(201).json({
      success: true,
      message: "Friend request sent successfully",
      request: toFriendRequestResponse(friendRequest),
    });
  } catch (error) {
    logger.error("Error sending friend request", error);
    return res.status(500).json({
      success: false,
      message: "Error sending friend request",
    });
  }
};

const getIncomingRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiverUserId: req.user.userId,
      status: "pending",
    })
      .populate("senderUserId", "username avatar profileImageUrl")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      requests: requests.map(toFriendRequestResponse),
    });
  } catch (error) {
    logger.error("Error fetching incoming requests", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching incoming requests",
    });
  }
};

const getOutgoingRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      senderUserId: req.user.userId,
      status: "pending",
    })
      .populate("receiverUserId", "username avatar profileImageUrl")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      requests: requests.map(toFriendRequestResponse),
    });
  } catch (error) {
    logger.error("Error fetching outgoing requests", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching outgoing requests",
    });
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid request id" });
    }

    const request = await FriendRequest.findOne({
      _id: req.params.id,
      receiverUserId: req.user.userId,
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
    }

    request.status = "accepted";
    request.respondedAt = new Date();
    request.acceptedAt = new Date();
    const updatedRequest = await request.save();

    await publishEvent("friend.request.accepted", buildEventPayload(updatedRequest, "accepted"));

    return res.json({
      success: true,
      message: "Friend request accepted",
      request: toFriendRequestResponse(updatedRequest),
    });
  } catch (error) {
    logger.error("Error accepting friend request", error);
    return res.status(500).json({
      success: false,
      message: "Error accepting friend request",
    });
  }
};

const rejectFriendRequest = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid request id" });
    }

    const request = await FriendRequest.findOne({
      _id: req.params.id,
      receiverUserId: req.user.userId,
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
    }

    request.status = "rejected";
    request.respondedAt = new Date();
    const updatedRequest = await request.save();

    await publishEvent("friend.request.rejected", buildEventPayload(updatedRequest, "rejected"));

    return res.json({
      success: true,
      message: "Friend request rejected",
      request: toFriendRequestResponse(updatedRequest),
    });
  } catch (error) {
    logger.error("Error rejecting friend request", error);
    return res.status(500).json({
      success: false,
      message: "Error rejecting friend request",
    });
  }
};

const cancelFriendRequest = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid request id" });
    }

    const request = await FriendRequest.findOne({
      _id: req.params.id,
      senderUserId: req.user.userId,
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
      });
    }

    request.status = "cancelled";
    request.respondedAt = new Date();
    request.cancelledAt = new Date();
    const updatedRequest = await request.save();

    await publishEvent("friend.request.cancelled", buildEventPayload(updatedRequest, "cancelled"));

    return res.json({
      success: true,
      message: "Friend request cancelled",
      request: toFriendRequestResponse(updatedRequest),
    });
  } catch (error) {
    logger.error("Error cancelling friend request", error);
    return res.status(500).json({
      success: false,
      message: "Error cancelling friend request",
    });
  }
};

const getFriends = async (req, res) => {
  try {
    const myUserId = req.user.userId;
    const friendships = await FriendRequest.find({
      status: "accepted",
      $or: [{ senderUserId: myUserId }, { receiverUserId: myUserId }],
    })
      .populate("senderUserId", "username avatar profileImageUrl")
      .populate("receiverUserId", "username avatar profileImageUrl")
      .sort({ updatedAt: -1 });

    const friends = friendships.map((request) => {
      const senderId = request.senderUserId._id?.toString() || request.senderUserId.toString();
      const friendUserId =
        senderId === myUserId
          ? request.receiverUserId
          : request.senderUserId;

      return {
        friendUserId: friendUserId._id || friendUserId,
        username: friendUserId.username,
        avatar: friendUserId.avatar,
        profileImageUrl: friendUserId.profileImageUrl,
        friendRequestId: request._id,
        acceptedAt: request.acceptedAt || request.updatedAt,
      };
    });

    return res.json({
      success: true,
      friends,
    });
  } catch (error) {
    logger.error("Error fetching friends", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching friends",
    });
  }
};

const getRelationshipStatus = (request, myUserId, targetUserId) => {
  if (!request) return "none";
  if (request.status === "accepted") return "friends";
  if (request.status !== "pending") return request.status;

  return request.senderUserId.toString() === myUserId &&
    request.receiverUserId.toString() === targetUserId
    ? "outgoing_pending"
    : "incoming_pending";
};

const searchUsers = async (req, res) => {
  try {
    const myUserId = req.user.userId;
    const query = (req.query.query || "").trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 12, 25);

    const userFilter = {
      _id: { $ne: myUserId },
    };

    if (query) {
      const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      userFilter.$or = [
        { username: { $regex: safeQuery, $options: "i" } },
        { email: { $regex: safeQuery, $options: "i" } },
      ];
    }

    const users = await User.find(userFilter)
      .select("username email avatar profileImageUrl")
      .sort({ username: 1 })
      .limit(limit);

    const targetIds = users.map((user) => user._id);
    const requests = await FriendRequest.find({
      $or: [
        { senderUserId: myUserId, receiverUserId: { $in: targetIds } },
        { senderUserId: { $in: targetIds }, receiverUserId: myUserId },
      ],
    });

    const requestByUserId = requests.reduce((map, request) => {
      const otherUserId =
        request.senderUserId.toString() === myUserId
          ? request.receiverUserId.toString()
          : request.senderUserId.toString();
      map[otherUserId] = request;
      return map;
    }, {});

    return res.json({
      success: true,
      users: users.map((user) => ({
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        profileImageUrl: user.profileImageUrl,
        relationshipStatus: getRelationshipStatus(
          requestByUserId[user._id.toString()],
          myUserId,
          user._id.toString()
        ),
      })),
    });
  } catch (error) {
    logger.error("Error searching users", error);
    return res.status(500).json({
      success: false,
      message: "Error searching users",
    });
  }
};

module.exports = {
  sendFriendRequest,
  getIncomingRequests,
  getOutgoingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  getFriends,
  searchUsers,
};
