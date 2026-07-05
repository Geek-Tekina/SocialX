import {
  Card, CardContent, CardActions, Typography, Box,
  IconButton, Chip, Tooltip, Skeleton, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, Button,
  ImageList, ImageListItem, useTheme,
} from "@mui/material";
import { Delete, AccessTime, AttachFile, OpenInNew, Favorite, FavoriteBorder, ChatBubble, IosShare, Bookmark, BookmarkBorder } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow } from "../utils/dateUtils";
import { resolveMediaIds } from "../api/mediaApi";
import { toggleLikePost } from "../api/postApi";
import UserAvatar from "./UserAvatar";
import { springs } from "../motion/variants";
import { normalizeMediaIds, normalizeMediaMap } from "../utils/mediaUtils";
import toast from "react-hot-toast";

const CONTENT_PREVIEW_LIMIT = 280;

// Shimmer skeleton — more premium than plain grey boxes
// WHY: Shimmer creates the perception of loading progress, reducing anxiety.
//      Users wait longer for shimmer loaders than static ones (Nielsen research).
const ShimmerCard = () => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
        <Skeleton variant="circular" width={38} height={38} animation="wave" />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="38%" height={18} animation="wave" />
          <Skeleton variant="text" width="22%" height={14} animation="wave" />
        </Box>
      </Box>
      <Skeleton variant="text" width="95%" animation="wave" />
      <Skeleton variant="text" width="80%" animation="wave" />
      <Skeleton variant="text" width="60%" animation="wave" sx={{ mb: 1.5 }} />
      <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 1.5 }} animation="wave" />
    </CardContent>
  </Card>
);

const PostCard = ({ post, onDelete, loading = false, mediaMap = {} }) => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [localMap, setLocalMap] = useState({});
  const [likes, setLikes] = useState(post?.likes || []);
  const [liking, setLiking] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const mediaIds = normalizeMediaIds(post?.mediaIds);
    if (!mediaIds.length) return;
    const mergedMap = { ...normalizeMediaMap(mediaMap), ...normalizeMediaMap(localMap) };
    const missing = mediaIds.filter((id) => !mergedMap[id]);
    if (!missing.length) return;
    resolveMediaIds(missing)
      .then(({ data }) => {
        if (data?.map) {
          setLocalMap((prev) => ({ ...prev, ...normalizeMediaMap(data.map) }));
        }
      })
      .catch(() => {});
  }, [post?._id]); // eslint-disable-line

  useEffect(() => {
    setLikes(post?.likes || []);
  }, [post?._id, post?.likes]);

  if (loading) return <ShimmerCard />;

  const isOwner = auth?.userId === post?.user?._id || auth?.userId === post?.user;
  const timeAgo = formatDistanceToNow(post?.createdAt);
  const mediaIds = normalizeMediaIds(post?.mediaIds);
  const merged = { ...normalizeMediaMap(mediaMap), ...normalizeMediaMap(localMap) };
  const resolvedMedia = mediaIds.map((id) => ({ id, url: merged[id] })).filter((m) => m.url);
  const unresolvedCount = mediaIds.length - resolvedMedia.length;
  const content = post?.content || "";
  const isTruncated = content.length > CONTENT_PREVIEW_LIMIT;
  const displayContent = isTruncated ? content.slice(0, CONTENT_PREVIEW_LIMIT) + "…" : content;
  const previewMedia = resolvedMedia.slice(0, 2);
  const extraCount = resolvedMedia.length - previewMedia.length;
  const goToDetail = () => navigate(`/posts/${post._id}`);
  const isLiked = likes.some((likedUserId) => String(likedUserId) === auth?.userId);
  const postUrl = `${window.location.origin}/posts/${post._id}`;

  const handleDelete = async () => {
    setDeleting(true);
    try { await onDelete(post._id); }
    finally { setDeleting(false); setConfirmOpen(false); }
  };

  const handleLike = async () => {
    if (liking || !post?._id) return;
    setLiking(true);
    try {
      const { data } = await toggleLikePost(post._id);
      setLikes(data.likes || []);
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      toast.success("Post link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.smooth}
        style={{ marginBottom: 14 }}
      >
        <Card sx={{ mb: 0, overflow: "hidden", borderRadius: { xs: 1.5, sm: 2 } }}>
          {/* 2px accent line — only color element on the card */}
          <Box sx={{ height: 2, bgcolor: theme.palette.primary.main, opacity: 0.6 }} />

          <CardContent sx={{ pb: 1, px: { xs: 1.5, sm: 2 }, pt: { xs: 1.5, sm: 2 } }}>
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1.5 }}>
              <UserAvatar
                avatar={post?.user?.avatar}
                profileImageUrl={post?.user?.profileImageUrl}
                username={post?.user?.username}
                sx={{ width: 38, height: 38, fontSize: 14, fontWeight: 700, bgcolor: theme.palette.primary.main }}
              />

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={700} noWrap>
                  {post?.user?.username || "Unknown User"}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <AccessTime sx={{ fontSize: 11, color: "text.secondary" }} />
                  <Typography variant="caption" color="text.secondary">{timeAgo}</Typography>
                </Box>
              </Box>

              {isOwner && onDelete && (
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  transition={springs.snappy}
                >
                  <Tooltip title="Delete post">
                    <IconButton size="small" onClick={() => setConfirmOpen(true)}
                      sx={{ "&:hover": { color: "error.main", bgcolor: "#EF444414" } }}>
                      <Delete sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </motion.div>
              )}
            </Box>

            {/* Content */}
            <Typography
              variant="body1"
              sx={{ lineHeight: 1.72, whiteSpace: "pre-wrap", wordBreak: "break-word", cursor: isTruncated ? "pointer" : "default" }}
              onClick={isTruncated ? goToDetail : undefined}
            >
              {displayContent}
            </Typography>
            {isTruncated && (
              <span style={{ display: "inline-block" }}>
                <Typography
                  component="span"
                  variant="body2"
                  color="primary"
                  sx={{ mt: 0.5, cursor: "pointer", fontWeight: 600, display: "block",
                    "&:hover": { textDecoration: "underline" } }}
                  onClick={goToDetail}
                >
                  Read more →
                </Typography>
              </span>
            )}

            <AnimatePresence>
              {previewMedia.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Box sx={{ mt: 1.5, cursor: "pointer", borderRadius: 1.5, overflow: "hidden" }} onClick={goToDetail}>
                    <ImageList
                      sx={{ borderRadius: 1.5, overflow: "hidden", m: 0 }}
                      cols={previewMedia.length === 1 ? 1 : 2}
                      rowHeight={previewMedia.length === 1 ? 220 : 128}
                      gap={3}
                    >
                      {previewMedia.map((m, idx) => (
                        <ImageListItem key={m.id} sx={{ position: "relative", overflow: "hidden" }}>
                          <img
                            src={m.url}
                            alt="Post media"
                            loading="lazy"
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                          {idx === previewMedia.length - 1 && extraCount > 0 && (
                            <Box sx={{
                              position: "absolute", inset: 0,
                              bgcolor: "rgba(0,0,0,0.52)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <Typography variant="h5" sx={{ color: "#fff", fontWeight: 800 }}>
                                +{extraCount}
                              </Typography>
                            </Box>
                          )}
                        </ImageListItem>
                      ))}
                    </ImageList>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>

            {unresolvedCount > 0 && resolvedMedia.length === 0 && (
              <Box sx={{ mt: 1.5 }}>
                <Chip icon={<AttachFile sx={{ fontSize: 13 }} />}
                  label={`${unresolvedCount} attachment${unresolvedCount > 1 ? "s" : ""}`}
                  size="small" variant="outlined" color="primary" />
              </Box>
            )}
          </CardContent>

          <CardActions sx={{
            px: { xs: 1, sm: 2 },
            pt: 0,
            pb: 1.25,
            display: "flex",
            flexWrap: "wrap",
            gap: { xs: 0.25, sm: 0.5 },
          }}>
            <motion.div whileTap={{ scale: 0.9 }} transition={springs.snappy}>
              <Button
                size="small"
                startIcon={isLiked ? <Favorite sx={{ fontSize: 15 }} /> : <FavoriteBorder sx={{ fontSize: 15 }} />}
                onClick={handleLike}
                disabled={liking}
                sx={{
                  fontSize: 12,
                  py: 0.25,
                  minWidth: 0,
                  fontWeight: 700,
                  color: isLiked ? "error.main" : "text.secondary",
                  "&:hover": {
                    color: "error.main",
                    bgcolor: "#EF444414",
                  },
                }}
              >
                {likes.length}
              </Button>
            </motion.div>
            <Button
              size="small"
              startIcon={<ChatBubble sx={{ fontSize: 15 }} />}
              onClick={goToDetail}
              sx={{ fontSize: 12, py: 0.25, minWidth: 0, fontWeight: 700, color: "text.secondary" }}
            >
              {post?.comments?.length || 0}
            </Button>
            <Button
              size="small"
              startIcon={<IosShare sx={{ fontSize: 15 }} />}
              onClick={handleShare}
              sx={{ fontSize: 12, py: 0.25, minWidth: 0, fontWeight: 700, color: "text.secondary" }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>Share</Box>
            </Button>
            <Button
              size="small"
              startIcon={saved ? <Bookmark sx={{ fontSize: 15 }} /> : <BookmarkBorder sx={{ fontSize: 15 }} />}
              onClick={() => setSaved((value) => !value)}
              sx={{ fontSize: 12, py: 0.25, minWidth: 0, fontWeight: 700, color: saved ? "primary.main" : "text.secondary" }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>{saved ? "Saved" : "Save"}</Box>
            </Button>
            <Box sx={{ flex: 1 }} />
            <motion.div whileTap={{ scale: 0.94 }} transition={springs.snappy}>
              <Button
                size="small"
                endIcon={<OpenInNew sx={{ fontSize: 12 }} />}
                onClick={goToDetail}
                sx={{ fontSize: 12, py: 0.25, fontWeight: 600, color: "text.secondary",
                  minWidth: 0,
                  "&:hover": { color: "primary.main" } }}
              >
                <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>View</Box>
              </Button>
            </motion.div>
          </CardActions>
        </Card>
      </motion.div>

      {/* Delete confirm */}
      <Dialog open={confirmOpen} onClose={() => !deleting && setConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 2.5 } }}>
        <DialogTitle fontWeight={600}>Delete Post?</DialogTitle>
        <DialogContent>
          <DialogContentText>This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={deleting} variant="outlined">Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PostCard;
