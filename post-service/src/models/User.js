const mongoose = require("mongoose");

// Read-only reference model — mirrors the User schema from identity-service.
// Used only for .populate() calls; post-service never writes to this collection.
const userSchema = new mongoose.Schema(
  {
    username: { type: String },
    email: { type: String },
    avatar: { type: String },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
