import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Cancel,
  Check,
  Clear,
  Group,
  HourglassTop,
  PersonAdd,
  Search,
} from "@mui/icons-material";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import UserAvatar from "../components/UserAvatar";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  getFriends,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  rejectFriendRequest,
  searchUsers,
  sendFriendRequest,
} from "../api/friendApi";
import { itemVariants, listVariants } from "../motion/variants";

const statusLabel = {
  none: "Add friend",
  friends: "Friends",
  outgoing_pending: "Pending",
  incoming_pending: "Respond",
  rejected: "Add friend",
  cancelled: "Add friend",
};

const PersonRow = ({ user, action, actionLabel, actionIcon, disabled, loading }) => {
  const theme = useTheme();
  return (
    <motion.div variants={itemVariants}>
      <Paper elevation={0} sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <UserAvatar
            username={user.username}
            avatar={user.avatar}
            profileImageUrl={user.profileImageUrl}
            sx={{ width: 40, height: 40, fontSize: 14, fontWeight: 700, bgcolor: theme.palette.primary.main }}
          />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={800} noWrap>{user.username || "Unknown user"}</Typography>
            {user.email && <Typography variant="caption" color="text.secondary" noWrap>{user.email}</Typography>}
          </Box>
          <Button
            size="small"
            variant={disabled ? "outlined" : "contained"}
            startIcon={loading ? <CircularProgress size={13} /> : actionIcon}
            disabled={disabled || loading}
            onClick={action}
          >
            {actionLabel}
          </Button>
        </Box>
      </Paper>
    </motion.div>
  );
};

const RequestRow = ({ request, type, onCancel, loadingId }) => {
  const otherUser = type === "incoming" ? request.sender : request.receiver;
  const loading = loadingId === request.id;

  return (
    <PersonRow
      user={otherUser || { username: "User", id: request.senderUserId || request.receiverUserId }}
      action={
        type === "incoming"
          ? undefined
          : () => onCancel(request.id)
      }
      actionLabel={type === "incoming" ? "Review" : "Cancel"}
      actionIcon={type === "incoming" ? <HourglassTop fontSize="small" /> : <Cancel fontSize="small" />}
      disabled={type === "incoming"}
      loading={loading}
    />
  );
};

const FriendsPage = () => {
  const [tab, setTab] = useState("discover");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const debounceRef = useRef(null);

  const loadRelationships = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [incomingRes, outgoingRes, friendsRes] = await Promise.all([
        getIncomingFriendRequests(),
        getOutgoingFriendRequests(),
        getFriends(),
      ]);
      setIncoming(incomingRes.data.requests || []);
      setOutgoing(outgoingRes.data.requests || []);
      setFriends(friendsRes.data.friends || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load friends");
    } finally {
      setLoading(false);
    }
  }, []);

  const runSearch = useCallback(async (nextQuery = query) => {
    setSearching(true);
    setError("");
    try {
      const { data } = await searchUsers(nextQuery, 16);
      setUsers(data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not search users");
    } finally {
      setSearching(false);
    }
  }, [query]);

  useEffect(() => {
    loadRelationships();
    runSearch("");
  }, [loadRelationships, runSearch]);

  const handleQueryChange = (event) => {
    const value = event.target.value;
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), 350);
  };

  const refreshAll = async () => {
    await Promise.all([loadRelationships(), runSearch(query)]);
  };

  const handleSendRequest = async (user) => {
    setBusyId(user.id);
    try {
      await sendFriendRequest(user.id);
      toast.success("Friend request sent");
      await refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send request");
    } finally {
      setBusyId("");
    }
  };

  const handleAccept = async (requestId) => {
    setBusyId(requestId);
    try {
      await acceptFriendRequest(requestId);
      toast.success("Friend request accepted");
      await refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not accept request");
    } finally {
      setBusyId("");
    }
  };

  const handleReject = async (requestId) => {
    setBusyId(requestId);
    try {
      await rejectFriendRequest(requestId);
      toast.success("Friend request rejected");
      await refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not reject request");
    } finally {
      setBusyId("");
    }
  };

  const handleCancel = async (requestId) => {
    setBusyId(requestId);
    try {
      await cancelFriendRequest(requestId);
      toast.success("Friend request cancelled");
      await refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not cancel request");
    } finally {
      setBusyId("");
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <Group color="primary" sx={{ fontSize: 28 }} />
        <Box>
          <Typography variant="h5" fontWeight={800}>Friends</Typography>
          <Typography variant="caption" color="text.secondary">Find people and manage requests</Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          textColor="inherit"
          TabIndicatorProps={{ sx: { height: 2, borderRadius: 999 } }}
          sx={{
            px: 1,
            minHeight: 48,
            "& .MuiTab-root": {
              minHeight: 48,
              color: "text.secondary",
              fontWeight: 700,
            },
            "& .MuiTab-root.Mui-selected": {
              color: "text.primary",
            },
          }}
        >
          <Tab value="discover" label="Discover" icon={<Search fontSize="small" />} iconPosition="start" />
          <Tab value="incoming" label={`Incoming ${incoming.length || ""}`} icon={<PersonAdd fontSize="small" />} iconPosition="start" />
          <Tab value="outgoing" label={`Outgoing ${outgoing.length || ""}`} icon={<HourglassTop fontSize="small" />} iconPosition="start" />
          <Tab value="friends" label={`Friends ${friends.length || ""}`} icon={<Group fontSize="small" />} iconPosition="start" />
        </Tabs>
      </Paper>

      {tab === "discover" && (
        <Box>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 2 }}>
            <TextField
              value={query}
              onChange={handleQueryChange}
              placeholder="Search people..."
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {searching ? <CircularProgress size={18} /> : <Search color="action" />}
                  </InputAdornment>
                ),
                endAdornment: query && (
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      startIcon={<Clear fontSize="small" />}
                      onClick={() => {
                        setQuery("");
                        runSearch("");
                      }}
                    >
                      Clear
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          </Paper>
          <motion.div variants={listVariants} initial="hidden" animate="visible">
            <Box sx={{ display: "grid", gap: 1.25 }}>
              {users.map((user) => (
                <PersonRow
                  key={user.id}
                  user={user}
                  action={() => handleSendRequest(user)}
                  actionLabel={statusLabel[user.relationshipStatus] || "Add friend"}
                  actionIcon={<PersonAdd fontSize="small" />}
                  disabled={["friends", "outgoing_pending", "incoming_pending"].includes(user.relationshipStatus)}
                  loading={busyId === user.id}
                />
              ))}
            </Box>
          </motion.div>
        </Box>
      )}

      {tab === "incoming" && (
        <Box sx={{ display: "grid", gap: 1.25 }}>
          {incoming.length === 0 && !loading && <EmptyState label="No incoming requests" />}
          {incoming.map((request) => (
            <Paper key={request.id} elevation={0} sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <UserAvatar username={request.sender?.username} avatar={request.sender?.avatar} profileImageUrl={request.sender?.profileImageUrl} sx={{ width: 40, height: 40, fontWeight: 700 }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={800}>{request.sender?.username || "User"}</Typography>
                  <Typography variant="caption" color="text.secondary">Wants to connect with you</Typography>
                </Box>
                <Button size="small" startIcon={<Clear />} disabled={busyId === request.id} onClick={() => handleReject(request.id)}>Reject</Button>
                <Button size="small" variant="contained" startIcon={busyId === request.id ? <CircularProgress size={13} /> : <Check />} disabled={busyId === request.id} onClick={() => handleAccept(request.id)}>Accept</Button>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {tab === "outgoing" && (
        <Box sx={{ display: "grid", gap: 1.25 }}>
          {outgoing.length === 0 && !loading && <EmptyState label="No outgoing requests" />}
          {outgoing.map((request) => (
            <RequestRow key={request.id} request={request} type="outgoing" onCancel={handleCancel} loadingId={busyId} />
          ))}
        </Box>
      )}

      {tab === "friends" && (
        <Box sx={{ display: "grid", gap: 1.25 }}>
          {friends.length === 0 && !loading && <EmptyState label="No friends yet" />}
          {friends.map((friend) => (
            <PersonRow
              key={friend.friendUserId}
              user={{ username: friend.username, avatar: friend.avatar, profileImageUrl: friend.profileImageUrl }}
              action={() => {}}
              actionLabel="Friends"
              actionIcon={<Check fontSize="small" />}
              disabled
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

const EmptyState = ({ label }) => (
  <Paper elevation={0} sx={{ p: 5, textAlign: "center", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
    <Group sx={{ fontSize: 42, color: "text.disabled", mb: 1 }} />
    <Typography variant="subtitle1" fontWeight={800} color="text.secondary">{label}</Typography>
    <Divider sx={{ my: 1.5 }} />
    <Chip size="small" label="Keep exploring" />
  </Paper>
);

export default FriendsPage;
