const express = require("express");
const {
  sendFriendRequest,
  getIncomingRequests,
  getOutgoingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  getFriends,
  searchUsers,
} = require("../controllers/friend-controller");
const { authenticateRequest } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateRequest);

router.get("/users", searchUsers);
router.post("/requests", sendFriendRequest);
router.get("/requests/incoming", getIncomingRequests);
router.get("/requests/outgoing", getOutgoingRequests);
router.patch("/requests/:id/accept", acceptFriendRequest);
router.patch("/requests/:id/reject", rejectFriendRequest);
router.delete("/requests/:id/cancel", cancelFriendRequest);
router.get("/", getFriends);

module.exports = router;
