const mongoose = require("mongoose");

// Read-only reference — mirrors identity-service User for populate()
const userSchema = new mongoose.Schema(
  { username: { type: String }, email: { type: String }, avatar: { type: String } },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
