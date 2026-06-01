import {
  Box, Typography, Chip, Divider, Button, Paper,
  CircularProgress, Alert, ImageList, ImageListItem,
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, useTheme, Skeleton, Tooltip, IconButton, TextField,
} from "@mui/material";
import { AccessTime, ArrowBack, Delete, AttachFile, OpenInFull, Close, Favorite, FavoriteBorder, Send } from "@mui/icons-material";
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getPostById, deletePost, toggleLikePost, addPostComment } from "../api/postApi";
import { resolveMediaIds } from "../api/mediaApi";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow, formatDate } from "../utils/dateUtils";
import UserAvatar from "../components/UserAvatar";
import { normalizeMediaIds, normalizeMediaMap } from "../utils/mediaUtils";
import toast from "react-hot-toast";

const PostDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const theme = useTheme();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mediaMap, setMediaMap] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  const fetchPost = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data } = await getPostById(id);
      setPost(data);
      setLikes(data.likes || []);
      setComments(data.comments || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load post");
    } finally { setLoading(false); }
  }, [id]);

  const fetchMediaMap = useCallback(async () => {
    const mediaIds = normalizeMediaIds(post?.mediaIds);
    if (!mediaIds.length) return;
    try {
      const { data } = await resolveMediaIds(mediaIds);
      if (data?.map) {
        setMediaMap(normalizeMediaMap(data.map));
      }
    } catch { /* ignore */ }
  }, [post?.mediaIds]);

  useEffect(() => { fetchPost(); }, [fetchPost]);
  useEffect(() => { if (post?.mediaIds?.length) fetchMediaMap(); }, [post, fetchMediaMap]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePost(id);
      toast.success("Post deleted");
      navigate(-1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete post");
      setDeleting(false); setConfirmOpen(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    const content = commentText.trim();
    if (!content || commenting) return;
    setCommenting(true);
    try {
      const { data } = await addPostComment(id, content);
      setComments(data.comments || []);
      setCommentText("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add comment");
    } finally {
      setCommenting(false);
    }
  };

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const { data } = await toggleLikePost(id);
      setLikes(data.likes || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update like");
    } finally {
      setLiking(false);
    }
  };

  const isOwner = auth?.userId === post?.user?._id || auth?.userId === post?.user;
  const isLiked = likes.some((likedUserId) => String(likedUserId) === auth?.userId);
  const mediaIds = normalizeMediaIds(post?.mediaIds);
  const resolvedMedia = mediaIds.map((mid) => ({ id: mid, url: mediaMap[mid] })).filter((m) => m.url);
  const unresolvedCount = mediaIds.length - resolvedMedia.length;

  if (loading) {
    return (
      <Box>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
        <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, border: "1px solid", borderColor: "divider" }}>
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <Skeleton variant="circular" width={48} height={48} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width="35%" height={22} />
              <Skeleton width="20%" height={16} sx={{ mt: 0.5 }} />
            </Box>
          </Box>
          <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 1.5, mb: 2 }} />
          <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 1.5 }} />
        </Paper>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
        <Alert severity="error" action={<Button size="small" onClick={fetchPost}>Retry</Button>}>{error}</Alert>
      </Box>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Box>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Back
        </Button>

        <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: { xs: 1.5, sm: 2 }, overflow: "hidden" }}>
          {/* Accent line — only color element */}
          <Box sx={{ height: 3, bgcolor: theme.palette.primary.main, borderRadius: "12px 12px 0 0" }} />

          <Box sx={{ p: { xs: 1.75, sm: 2.5, md: 4 } }}>
            {/* Author */}
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 3 }}>
              <UserAvatar
                avatar={post?.user?.avatar}
                username={post?.user?.username}
                sx={{ width: 48, height: 48, fontWeight: 700, fontSize: 18, bgcolor: theme.palette.primary.main }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={700}>{post?.user?.username || "Unknown User"}</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <AccessTime sx={{ fontSize: 12, color: "text.secondary" }} />
                    <Typography variant="caption" color="text.secondary">{formatDistanceToNow(post?.createdAt)}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.disabled">·</Typography>
                  <Typography variant="caption" color="text.secondary">{formatDate(post?.createdAt)}</Typography>
                </Box>
              </Box>
              {isOwner && (
                <Tooltip title="Delete post">
                  <IconButton size="small" onClick={() => setConfirmOpen(true)}
                    sx={{ color: "text.secondary", "&:hover": { color: "error.main", bgcolor: "#EF444414" } }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Content */}
            <Typography variant="body1" sx={{ lineHeight: 1.85, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "1rem", mb: 3 }}>
              {post?.content}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <Button
                variant={isLiked ? "contained" : "outlined"}
                color={isLiked ? "error" : "inherit"}
                startIcon={isLiked ? <Favorite /> : <FavoriteBorder />}
                onClick={handleLike}
                disabled={liking}
                sx={{
                  color: isLiked ? "#fff" : "text.secondary",
                  borderColor: isLiked ? "error.main" : "divider",
                  "&:hover": {
                    borderColor: "error.main",
                    bgcolor: isLiked ? "error.main" : "#EF444414",
                    color: isLiked ? "#fff" : "error.main",
                  },
                }}
              >
                {likes.length} {likes.length === 1 ? "Like" : "Likes"}
              </Button>
            </Box>

            {/* Media */}
            {resolvedMedia.length > 0 && (
              <>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="overline" color="text.secondary" sx={{ mb: 1.5, display: "block", fontSize: 11 }}>
                  Attachments · {resolvedMedia.length}
                </Typography>
                <ImageList
                  cols={resolvedMedia.length === 1 ? 1 : resolvedMedia.length === 2 ? 2 : 3}
                  gap={6}
                  sx={{ borderRadius: 1.5, overflow: "hidden", mb: 0 }}
                >
                  {resolvedMedia.map((m) => (
                    <ImageListItem key={m.id}
                      sx={{ cursor: "zoom-in", position: "relative", "&:hover .zoom-icon": { opacity: 1 } }}
                      onClick={() => setLightboxImg(m.url)}>
                      <img src={m.url} alt="attachment" loading="lazy"
                        style={{ width: "100%", height: resolvedMedia.length === 1 ? "min(58vh, 420px)" : "180px", objectFit: "cover", borderRadius: 6, display: "block" }} />
                      <Box className="zoom-icon" sx={{
                        position: "absolute", top: 8, right: 8,
                        bgcolor: "rgba(0,0,0,0.5)", borderRadius: "50%",
                        width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
                        opacity: 0, transition: "opacity 0.18s",
                      }}>
                        <OpenInFull sx={{ fontSize: 14, color: "#fff" }} />
                      </Box>
                    </ImageListItem>
                  ))}
                </ImageList>
              </>
            )}

            {unresolvedCount > 0 && (
              <Box sx={{ mt: 2 }}>
                <Chip icon={<AttachFile sx={{ fontSize: 13 }} />}
                  label={`${unresolvedCount} attachment${unresolvedCount > 1 ? "s" : ""}`}
                  size="small" variant="outlined" color="primary" />
              </Box>
            )}

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Comments · {comments.length}
            </Typography>
            <Box component="form" onSubmit={handleComment} sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1, mb: 2 }}>
              <TextField
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment"
                size="small"
                fullWidth
                inputProps={{ maxLength: 500 }}
              />
              <Button type="submit" variant="contained" disabled={commenting || !commentText.trim()} endIcon={<Send />} sx={{ alignSelf: { xs: "stretch", sm: "auto" } }}>
                Send
              </Button>
            </Box>
            <Box sx={{ display: "grid", gap: 1.25 }}>
              {comments.map((comment) => (
                <Box key={comment._id || `${comment.user?._id}-${comment.createdAt}`} sx={{ display: "flex", gap: 1.25 }}>
                  <UserAvatar avatar={comment.user?.avatar} username={comment.user?.username} sx={{ width: 32, height: 32 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "baseline", flexWrap: "wrap" }}>
                      <Typography variant="body2" fontWeight={700}>{comment.user?.username || "User"}</Typography>
                      <Typography variant="caption" color="text.secondary">{formatDistanceToNow(comment.createdAt)}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {comment.content}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>

        {/* Lightbox */}
        <Dialog open={Boolean(lightboxImg)} onClose={() => setLightboxImg(null)} maxWidth="xl"
          PaperProps={{ sx: { bgcolor: "transparent", boxShadow: "none", m: 1 } }}>
          <Box sx={{ position: "relative" }}>
            <IconButton onClick={() => setLightboxImg(null)}
              sx={{ position: "absolute", top: 8, right: 8, bgcolor: "rgba(0,0,0,0.6)", color: "#fff", zIndex: 1, "&:hover": { bgcolor: "rgba(0,0,0,0.8)" } }}>
              <Close />
            </IconButton>
            <img src={lightboxImg} alt="Full size"
              style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 10, display: "block" }} />
          </Box>
        </Dialog>

        {/* Delete confirm */}
        <Dialog open={confirmOpen} onClose={() => !deleting && setConfirmOpen(false)} PaperProps={{ sx: { borderRadius: 2.5 } }}>
          <DialogTitle fontWeight={600}>Delete Post?</DialogTitle>
          <DialogContent>
            <DialogContentText>This action cannot be undone. The post will be permanently removed.</DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setConfirmOpen(false)} disabled={deleting} variant="outlined">Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}
              startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : null}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </motion.div>
  );
};

export default PostDetailPage;
