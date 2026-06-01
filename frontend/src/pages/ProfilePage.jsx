import {
  Box, Typography, Paper, Divider, Chip, Button, Alert,
  CircularProgress, Skeleton,
} from "@mui/material";
import { Article, Favorite, PhotoLibrary, Refresh } from "@mui/icons-material";
import { useCallback, useEffect, useState } from "react";
import { getAllPosts, deletePost } from "../api/postApi";
import { getAllMedia } from "../api/mediaApi";
import { useAuth } from "../context/AuthContext";
import UserAvatar from "../components/UserAvatar";
import PostCard from "../components/PostCard";
import { normalizeMediaMap } from "../utils/mediaUtils";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { auth } = useAuth();
  const [posts, setPosts] = useState([]);
  const [mediaMap, setMediaMap] = useState({});
  const [mediaCount, setMediaCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [postsRes, mediaRes] = await Promise.allSettled([
        getAllPosts(1, 100),
        getAllMedia(),
      ]);

      if (postsRes.status === "fulfilled") {
        const mine = (postsRes.value.data.posts || []).filter(
          (post) => post.user?._id === auth?.userId || post.user === auth?.userId
        );
        setPosts(mine);
      }

      if (mediaRes.status === "fulfilled") {
        setMediaMap(normalizeMediaMap(
          (mediaRes.value.data.result || []).reduce((map, item) => ({ ...map, [item._id]: item.url }), {})
        ));
        setMediaCount(mediaRes.value.data.result?.length || 0);
      } else {
        setMediaMap({});
        setMediaCount(0);
      }
    } catch {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [auth?.userId]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleDelete = async (postId) => {
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((post) => post._id !== postId));
      toast.success("Post deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete post");
      throw err;
    }
  };

  const likesReceived = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);

  return (
    <Box>
      <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <UserAvatar avatar={auth?.avatar} username={auth?.username} pulse sx={{ width: 72, height: 72 }} />
          <Box sx={{ flex: 1, minWidth: 220 }}>
            <Typography variant="h5" fontWeight={800}>{auth?.username || "User"}</Typography>
            <Typography variant="body2" color="text.secondary">Your SocialX profile</Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={refreshing ? <CircularProgress size={13} /> : <Refresh />}
            onClick={() => loadProfile(true)}
            disabled={loading || refreshing}
          >
            Refresh
          </Button>
        </Box>

        <Divider sx={{ my: 2.5 }} />

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1.5 }}>
          {[
            { label: "Posts", value: posts.length, icon: <Article sx={{ fontSize: 18 }} /> },
            { label: "Media", value: mediaCount, icon: <PhotoLibrary sx={{ fontSize: 18 }} /> },
            { label: "Likes", value: likesReceived, icon: <Favorite sx={{ fontSize: 18 }} /> },
          ].map((item) => (
            <Box key={item.label} sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary", mb: 0.5 }}>
                {item.icon}
                <Typography variant="caption">{item.label}</Typography>
              </Box>
              {loading ? <Skeleton width={32} /> : <Typography variant="h6" fontWeight={800}>{item.value}</Typography>}
            </Box>
          ))}
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700}>Your Posts</Typography>
        {!loading && <Chip label={posts.length} size="small" />}
      </Box>

      {loading && Array.from({ length: 3 }).map((_, index) => <PostCard key={index} loading />)}

      {!loading && posts.length === 0 && (
        <Paper elevation={0} sx={{ p: 4, textAlign: "center", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">No posts yet.</Typography>
        </Paper>
      )}

      {!loading && posts.map((post) => (
        <PostCard key={post._id} post={post} onDelete={handleDelete} mediaMap={mediaMap} />
      ))}
    </Box>
  );
};

export default ProfilePage;
