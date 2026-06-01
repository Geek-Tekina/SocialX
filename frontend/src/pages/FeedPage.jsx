import {
  Box, Typography, Button, CircularProgress, Alert,
  Fab, Chip, Divider, Paper, useTheme, useMediaQuery, Skeleton,
} from "@mui/material";
import { Add, Refresh, EditNote, TrendingUp, Article, PhotoLibrary, Search as SearchIcon } from "@mui/icons-material";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getAllPosts, deletePost } from "../api/postApi";
import { getAllMedia } from "../api/mediaApi";
import PostCard from "../components/PostCard";
import CreatePostModal from "../components/CreatePostModal";
import UserAvatar from "../components/UserAvatar";
import NewsInlineCard from "../components/NewsInlineCard";
import { useAuth } from "../context/AuthContext";
import { getRelevantNews } from "../api/newsApi";
import { listVariants, itemVariants, fadeIn, scalePop, springs } from "../motion/variants";
import { normalizeMediaMap } from "../utils/mediaUtils";
import toast from "react-hot-toast";

const POSTS_PER_PAGE = 10;

// ── Stat row for sidebar ──────────────────────────────────────────────────────
const StatRow = ({ icon, label, value, loading }) => (
  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.875 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, color: "text.secondary" }}>
      {icon}
      <Typography variant="body2" color="text.secondary">{label}</Typography>
    </Box>
    {loading
      ? <Skeleton width={24} height={16} />
      : (
        <motion.div variants={scalePop} initial="hidden" animate="visible">
          <Typography variant="body2" fontWeight={700}>{value}</Typography>
        </motion.div>
      )
    }
  </Box>
);

// ── Quick compose ─────────────────────────────────────────────────────────────
// WHY: Reducing friction to post is the #1 engagement driver in social apps.
//      Twitter/Threads put compose at the top of every feed for this reason.
//      The expansion animation signals "this is interactive" before the user clicks.
const QuickCompose = ({ username, avatar, onOpen }) => {
  const theme = useTheme();

  return (
    <motion.div variants={itemVariants}>
      <Paper
        elevation={0}
        sx={{ p: 2, mb: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <UserAvatar
            avatar={avatar}
            username={username}
            sx={{ width: 36, height: 36, fontSize: 14, fontWeight: 700, bgcolor: theme.palette.primary.main }}
          />

          <Box sx={{ flex: 1 }}>
            <Box
              onClick={onOpen}
              sx={{
                px: 2, py: 1, borderRadius: "20px",
                border: "1px solid",
                borderColor: "divider",
                cursor: "text", color: "text.disabled",
                fontSize: "0.875rem",
                bgcolor: "background.default",
                userSelect: "none",
              }}
            >
              What&apos;s on your mind, {username || "there"}?
            </Box>
          </Box>

          <motion.div whileTap={{ scale: 0.96 }} transition={springs.snappy}>
            <Button
              variant="contained"
              size="small"
              startIcon={<EditNote />}
              onClick={onOpen}
              sx={{ flexShrink: 0, borderRadius: "20px", px: 2 }}
            >
              Post
            </Button>
          </motion.div>
        </Box>
      </Paper>
    </motion.div>
  );
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = ({ totalPosts, mediaCount, loading, onNavigate }) => (
  <motion.div variants={fadeIn} initial="hidden" animate="visible">
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Paper elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary"
          sx={{ textTransform: "uppercase", letterSpacing: "0.06em", fontSize: 10, display: "block", mb: 1.5 }}>
          Community
        </Typography>
        <StatRow icon={<Article sx={{ fontSize: 15 }} />} label="Total posts" value={totalPosts} loading={loading} />
        <Divider sx={{ my: 0.5 }} />
        <StatRow icon={<PhotoLibrary sx={{ fontSize: 15 }} />} label="Your media" value={mediaCount} loading={loading} />
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Typography variant="caption" fontWeight={700} color="text.secondary"
          sx={{ textTransform: "uppercase", letterSpacing: "0.06em", fontSize: 10, display: "block", mb: 1 }}>
          Navigate
        </Typography>
        {[
          { label: "My Posts",  icon: <Article sx={{ fontSize: 15 }} />,     path: "/my-posts" },
          { label: "My Media",  icon: <PhotoLibrary sx={{ fontSize: 15 }} />, path: "/media" },
          { label: "Search",    icon: <SearchIcon sx={{ fontSize: 15 }} />,   path: "/search" },
        ].map((item) => (
          <Box key={item.path}>
            <Box
              onClick={() => onNavigate(item.path)}
              sx={{
                display: "flex", alignItems: "center", gap: 1.25,
                py: 0.875, px: 1, borderRadius: 1.5, cursor: "pointer",
                color: "text.secondary", transition: "all 0.15s",
                "&:hover": { bgcolor: "action.hover", color: "text.primary" },
              }}
            >
              {item.icon}
              <Typography variant="body2">{item.label}</Typography>
            </Box>
          </Box>
        ))}
      </Paper>

    </Box>
  </motion.div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
const FeedPage = () => {
  const { auth } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const isWide = useMediaQuery(theme.breakpoints.up("lg"));

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mediaMap, setMediaMap] = useState({});
  const [mediaCount, setMediaCount] = useState(0);
  const [newsItems, setNewsItems] = useState([]);
  const loadMoreRef = useRef(null);

  const fetchMediaMap = useCallback(async () => {
    try {
      const { data } = await getAllMedia();
      const map = normalizeMediaMap(
        (data.result || []).reduce((acc, item) => ({ ...acc, [item._id]: item.url }), {})
      );
      setMediaMap(map);
      setMediaCount(data.result?.length || 0);
    } catch { /* no media yet */ }
  }, []);

  const fetchPosts = useCallback(async (pageNum = 1, options = {}) => {
    const { silent = false, append = false } = typeof options === "boolean" ? { silent: options } : options;
    if (append) setLoadingMore(true);
    else if (!silent) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const { data } = await getAllPosts(pageNum, POSTS_PER_PAGE);
      const nextPosts = data.posts || [];
      setPosts((currentPosts) => {
        if (!append) return nextPosts;
        const currentIds = new Set(currentPosts.map((post) => post._id));
        return [...currentPosts, ...nextPosts.filter((post) => !currentIds.has(post._id))];
      });
      setTotalPages(data.totalPages || 1);
      setTotalPosts(data.totalPosts || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load posts");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  const fetchNews = useCallback(async () => {
    try {
      const data = await getRelevantNews();
      setNewsItems(data.slice(0, 3));
    } catch {
      setNewsItems([]);
    }
  }, []);

  useEffect(() => { fetchMediaMap(); fetchNews(); }, [fetchMediaMap, fetchNews]);
  useEffect(() => { fetchPosts(page, { append: page > 1 }); }, [page, fetchPosts]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || loading || loadingMore || refreshing || page >= totalPages) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPage((currentPage) => (currentPage < totalPages ? currentPage + 1 : currentPage));
        }
      },
      { rootMargin: "360px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loading, loadingMore, refreshing, page, totalPages]);

  const handleDelete = async (postId) => {
    try {
      await deletePost(postId);
      toast.success("Post deleted");
      setPosts((currentPosts) => currentPosts.filter((post) => post._id !== postId));
      setTotalPosts((currentTotal) => Math.max(0, currentTotal - 1));
      setTotalPages((currentTotalPages) => Math.max(1, Math.ceil(Math.max(0, totalPosts - 1) / POSTS_PER_PAGE) || currentTotalPages));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete post");
      throw err;
    }
  };

  return (
    <Box sx={{ display: "flex", gap: { xs: 0, lg: 3 }, alignItems: "flex-start" }}>
      {/* ── Main column ── */}
      <Box sx={{ flex: 1, minWidth: 0 }}>

        {/* Welcome header — stagger entrance */}
        <motion.div variants={listVariants} initial="hidden" animate="visible">

          {/* Greeting row */}
          <motion.div variants={itemVariants}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5, flexWrap: "wrap", gap: 1.25 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <UserAvatar
                  avatar={auth?.avatar}
                  username={auth?.username}
                  pulse
                  ringColor={theme.palette.primary.main}
                  sx={{ width: 42, height: 42, fontSize: 16, fontWeight: 700, bgcolor: theme.palette.primary.main }}
                />
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                    {auth?.username ? `Hey, ${auth.username}` : "Welcome back"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </Typography>
                </Box>
              </Box>
              <motion.div whileTap={{ scale: 0.97 }} transition={springs.snappy}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={refreshing ? <CircularProgress size={13} /> : <Refresh />}
                  onClick={() => {
                    fetchMediaMap();
                    if (page === 1) fetchPosts(1, { silent: true });
                    else setPage(1);
                  }}
                  disabled={refreshing || loading || loadingMore}
                >
                  Refresh
                </Button>
              </motion.div>
            </Box>
          </motion.div>

          {/* Quick compose */}
          <QuickCompose username={auth?.username} avatar={auth?.avatar} onOpen={() => setModalOpen(true)} />

          {/* Feed header */}
          <motion.div variants={itemVariants}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TrendingUp sx={{ fontSize: 17, color: "text.secondary" }} />
                <Typography variant="subtitle1" fontWeight={700}>Latest</Typography>
                <AnimatePresence mode="wait">
                  {!loading && (
                    <motion.div key={totalPosts} variants={scalePop} initial="hidden" animate="visible" exit={{ scale: 0.7, opacity: 0 }}>
                      <Chip label={`${totalPosts} posts`} size="small" sx={{ height: 20, fontSize: 11 }} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>
              {totalPages > 1 && (
                <Typography variant="caption" color="text.secondary">
                  Showing {posts.length} of {totalPosts}
                </Typography>
              )}
            </Box>
            <Divider sx={{ mb: 2.5 }} />
          </motion.div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Alert severity="error" sx={{ mb: 2 }} action={<Button size="small" onClick={() => fetchPosts(page, { append: page > 1 })}>Retry</Button>}>
                {error}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading skeletons */}
        {loading && (
          <Box>
            {Array.from({ length: 4 }).map((_, i) => <PostCard key={i} loading />)}
          </Box>
        )}

        {/* Empty state */}
        <AnimatePresence>
          {!loading && !error && posts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={springs.smooth}
            >
              <Box sx={{ textAlign: "center", py: 10 }}>
                <Article sx={{ fontSize: 52, color: "text.disabled", mb: 1.5 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>Nothing here yet</Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mb: 2.5 }}>
                  Be the first to share something with the community
                </Typography>
                <motion.div whileTap={{ scale: 0.97 }} transition={springs.snappy}>
                  <Button variant="contained" startIcon={<Add />} onClick={() => setModalOpen(true)}>
                    Create First Post
                  </Button>
                </motion.div>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Posts */}
        <AnimatePresence mode="wait">
          {!loading && posts.length > 0 && (
            <motion.div
              key="feed-posts"
              variants={listVariants}
              initial="hidden"
              animate="visible"
            >
              {posts.map((post, index) => (
                <motion.div key={post._id} variants={itemVariants}>
                  <PostCard post={post} onDelete={handleDelete} mediaMap={mediaMap} />
                  {(index + 1) % 4 === 0 && newsItems[Math.floor(index / 4)] && (
                    <NewsInlineCard item={newsItems[Math.floor(index / 4)]} />
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && posts.length > 0 && (
          <Box ref={loadMoreRef} sx={{ display: "flex", justifyContent: "center", py: 3, minHeight: 72 }}>
            {loadingMore ? (
              <CircularProgress size={22} />
            ) : page >= totalPages ? (
              <Typography variant="caption" color="text.secondary">
                You&apos;re all caught up
              </Typography>
            ) : (
              <Button size="small" variant="text" onClick={() => setPage((currentPage) => currentPage + 1)}>
                Load more
              </Button>
            )}
          </Box>
        )}

        {loadingMore && (
          <motion.div variants={fadeIn} initial="hidden" animate="visible">
            <Box>
              {Array.from({ length: 2 }).map((_, i) => <PostCard key={`more-${i}`} loading />)}
            </Box>
          </motion.div>
        )}
      </Box>

      {/* ── Sidebar ── */}
      {isWide && (
        <Box sx={{ width: 256, flexShrink: 0 }}>
          <Sidebar totalPosts={totalPosts} mediaCount={mediaCount} loading={loading} onNavigate={navigate} />
        </Box>
      )}

      {/* Mobile FAB */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, ...springs.bouncy }}
        style={{ position: "fixed", bottom: 18, right: 18, zIndex: 10 }}
      >
        <Fab color="primary" aria-label="Create post" onClick={() => setModalOpen(true)}
          sx={{ display: { md: "none" } }}>
          <Add />
        </Fab>
      </motion.div>

      <CreatePostModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onPostCreated={() => {
          fetchMediaMap();
          if (page === 1) fetchPosts(1, { silent: true });
          else setPage(1);
        }}
      />
    </Box>
  );
};

export default FeedPage;
