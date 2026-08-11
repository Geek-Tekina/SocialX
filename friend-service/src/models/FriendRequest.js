const mongoose = require("mongoose");

const friendRequestSchema = new mongoose.Schema(
  {
    senderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiverUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 280,
      default: "",
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

friendRequestSchema.index(
  { senderUserId: 1, receiverUserId: 1 },
  { unique: true }
);
friendRequestSchema.index({ receiverUserId: 1, status: 1, createdAt: -1 });
friendRequestSchema.index({ senderUserId: 1, status: 1, createdAt: -1 });

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);

module.exports = FriendRequest;
