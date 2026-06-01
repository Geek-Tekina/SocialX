import {
  Box, Typography, Button, Alert, Pagination, Chip,
  Divider, CircularProgress, useTheme,
} from "@mui/material";
import { Article, Refresh, Add } from "@mui/icons-material";
import { useState, useEffect, useCallback } from "react";
import { getAllPosts, deletePost } from "../api/postApi";
import { getAllMedia } from "../api/mediaApi";
import PostCard from "../components/PostCard";
import CreatePostModal from "../components/CreatePostModal";
import { useAuth } from "../context/AuthContext";
import { normalizeMediaMap } from "../utils/mediaUtils";
import toast from "react-hot-toast";

const POSTS_PER_PAGE = 10;

const MyPostsPage = () => {
  const { auth } = useAuth();
  const [allPosts, setAllPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mediaMap, setMediaMap] = useState({});

  const fetchMediaMap = useCallback(async () => {
    try {
      const { data } = await getAllMedia();
      setMediaMap(normalizeMediaMap(
        (data.result || []).reduce((map, item) => ({ ...map, [item._id]: item.url }), {})
      ));
    } catch { /* no media */ }
  }, []);

  const fetchMyPosts = useCallback(async (pageNum = 1, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const { data } = await getAllPosts(1, 100);
      const all = data.posts || [];
      const mine = all.filter((p) => p.user?._id === auth?.userId || p.user === auth?.userId);
      setAllPosts(mine);
      const start = (pageNum - 1) * POSTS_PER_PAGE;
      setMyPosts(mine.slice(start, start + POSTS_PER_PAGE));
      setTotalPages(Math.max(1, Math.ceil(mine.length / POSTS_PER_PAGE)));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load posts");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [auth?.userId]);

  useEffect(() => { fetchMediaMap(); fetchMyPosts(1); }, []); // eslint-disable-line
  useEffect(() => {
    const start = (page - 1) * POSTS_PER_PAGE;
    setMyPosts(allPosts.slice(start, start + POSTS_PER_PAGE));
  }, [page, allPosts]);

  const handleDelete = async (postId) => {
    try {
      await deletePost(postId);
      toast.success("Post deleted");
      const updated = allPosts.filter((p) => p._id !== postId);
      setAllPosts(updated);
      const newTotalPages = Math.max(1, Math.ceil(updated.length / POSTS_PER_PAGE));
      const targetPage = page > newTotalPages ? newTotalPages : page;
      setPage(targetPage);
      setMyPosts(updated.slice((targetPage - 1) * POSTS_PER_PAGE, targetPage * POSTS_PER_PAGE));
      setTotalPages(newTotalPages);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete post");
      throw err;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Article sx={{ color: "text.secondary", fontSize: 22 }} />
          <Box>
            <Typography variant="h6" fontWeight={700}>My Posts</Typography>
            {!loading && (
              <Typography variant="caption" color="text.secondary">
                {allPosts.length} post{allPosts.length !== 1 ? "s" : ""} by you
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" size="small"
            startIcon={refreshing ? <CircularProgress size={13} /> : <Refresh />}
            onClick={() => { fetchMediaMap(); fetchMyPosts(page, true); }}
            disabled={refreshing || loading}>
            Refresh
          </Button>
          <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setModalOpen(true)}>
            New Post
          </Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button size="small" onClick={() => fetchMyPosts(page)}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {loading && Array.from({ length: 3 }).map((_, i) => <PostCard key={i} loading />)}

      {!loading && !error && allPosts.length === 0 && (
        <Box sx={{ textAlign: "center", py: 10 }}>
          <Article sx={{ fontSize: 48, color: "text.disabled", mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>No posts yet</Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 2.5 }}>
            You haven&apos;t created any posts yet
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setModalOpen(true)}>
            Create Your First Post
          </Button>
        </Box>
      )}

      {!loading && myPosts.length > 0 && (
        <>
          <Box sx={{ mb: 2 }}>
            <Chip label={`${allPosts.length} post${allPosts.length !== 1 ? "s" : ""}`} size="small" />
          </Box>
          {myPosts.map((post) => (
            <PostCard key={post._id} post={post} onDelete={handleDelete} mediaMap={mediaMap} />
          ))}
          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3, mb: 1 }}>
              <Pagination count={totalPages} page={page}
                onChange={(_, v) => { setPage(v); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                color="primary" shape="rounded" showFirstButton showLastButton />
            </Box>
          )}
        </>
      )}

      <CreatePostModal open={modalOpen} onClose={() => setModalOpen(false)}
        onPostCreated={() => { fetchMediaMap(); fetchMyPosts(1, true); setPage(1); }} />
    </Box>
  );
};

export default MyPostsPage;
