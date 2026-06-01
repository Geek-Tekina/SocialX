import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, IconButton,
  CircularProgress, Divider, Alert, LinearProgress,
  ImageList, ImageListItem, Paper, Fade, Chip, useMediaQuery, useTheme,
} from "@mui/material";
import { Close, CloudUpload, Delete, AddPhotoAlternate, Image, Movie, Send } from "@mui/icons-material";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { createPost } from "../api/postApi";
import { uploadMedia } from "../api/mediaApi";
import { useAuth } from "../context/AuthContext";
import UserAvatar from "./UserAvatar";
import toast from "react-hot-toast";

const MAX_CONTENT_LENGTH = 1000;
const MAX_FILES = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const CreatePostModal = ({ open, onClose, onPostCreated }) => {
  const { auth } = useAuth();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [uploadingCount, setUploadingCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  // [{ mediaId, url, name, previewUrl }]
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0); // 0-100 overall
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({ defaultValues: { content: "" } });
  const contentValue = watch("content", "");

  const uploadFiles = async (selectedFiles) => {
    const files = Array.from(selectedFiles || []);
    if (!files.length) return;

    // Validate
    const remaining = MAX_FILES - uploadedMedia.length;
    if (files.length > remaining) {
      setUploadError(`You can attach up to ${MAX_FILES} files. ${uploadedMedia.length} already added.`);
      return;
    }
    const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length) {
      setUploadError(`${oversized.map((f) => f.name).join(", ")} exceed${oversized.length === 1 ? "s" : ""} 5MB limit.`);
      return;
    }

    setUploadError("");
    setUploadingCount(files.length);
    setUploadProgress(0);

    let completed = 0;
    const results = await Promise.allSettled(
      files.map(async (file) => {
        const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
        const { data } = await uploadMedia(file);
        completed++;
        setUploadProgress(Math.round((completed / files.length) * 100));
        return { mediaId: data.mediaId, url: data.url, name: file.name, previewUrl };
      })
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
    const failed = results.filter((r) => r.status === "rejected").length;

    if (succeeded.length) {
      setUploadedMedia((prev) => [...prev, ...succeeded]);
      toast.success(`${succeeded.length} file${succeeded.length > 1 ? "s" : ""} uploaded`);
    }
    if (failed) {
      setUploadError(`${failed} file${failed > 1 ? "s" : ""} failed to upload.`);
    }

    setUploadingCount(0);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFilesSelected = async (e) => {
    await uploadFiles(e.target.files);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragActive(false);
    await uploadFiles(e.dataTransfer.files);
  };

  const removeMedia = (mediaId) => {
    setUploadedMedia((prev) => {
      const item = prev.find((m) => m.mediaId === mediaId);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((m) => m.mediaId !== mediaId);
    });
  };

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      await createPost({
        content: values.content.trim(),
        mediaIds: uploadedMedia.map((m) => m.mediaId),
      });
      toast.success("Post created!");
      handleClose();
      onPostCreated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting || uploadingCount > 0) return;
    uploadedMedia.forEach((m) => { if (m.previewUrl) URL.revokeObjectURL(m.previewUrl); });
    reset();
    setUploadedMedia([]);
    setUploadError("");
    onClose();
  };

  const isUploading = uploadingCount > 0;
  const canAddMore = uploadedMedia.length < MAX_FILES && !isUploading;
  const imageCount = uploadedMedia.filter((item) => item.previewUrl).length;
  const fileCount = uploadedMedia.length - imageCount;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      fullScreen={fullScreen}
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: { xs: 0, sm: 3 }, overflow: "hidden" } }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <UserAvatar avatar={auth?.avatar} username={auth?.username} sx={{ width: 38, height: 38 }} />
          <Box>
            <Typography variant="h6" fontWeight={700}>Create Post</Typography>
            <Typography variant="caption" color="text.secondary">{auth?.username || "User"}</Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} disabled={submitting || isUploading} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <Divider />

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 2, px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 280px" }, gap: 2 }}>
            <Box>
              <TextField
                {...register("content", {
                  required: "Post content is required",
                  maxLength: { value: MAX_CONTENT_LENGTH, message: `Max ${MAX_CONTENT_LENGTH} characters` },
                  validate: (v) => v.trim().length > 0 || "Content cannot be empty",
                })}
                placeholder="What's on your mind?"
                multiline
                minRows={6}
                fullWidth
                error={!!errors.content}
                helperText={errors.content?.message}
                inputProps={{ maxLength: MAX_CONTENT_LENGTH }}
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">{imageCount} images</Typography>
                  <Typography variant="caption" color="text.secondary">{fileCount} files</Typography>
                </Box>
                <Typography variant="caption"
                  color={contentValue.length > MAX_CONTENT_LENGTH * 0.9 ? "warning.main" : "text.secondary"}>
                  {contentValue.length}/{MAX_CONTENT_LENGTH}
                </Typography>
              </Box>

              <input ref={fileInputRef} type="file" hidden accept="image/*,video/*" multiple onChange={handleFilesSelected} />

              {isUploading && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Uploading {uploadingCount} file{uploadingCount > 1 ? "s" : ""}...
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{uploadProgress}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 4 }} />
                </Box>
              )}

              <Box
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => canAddMore && fileInputRef.current?.click()}
                sx={{
                  border: "2px dashed",
                  borderColor: dragActive ? "primary.main" : uploadError ? "error.main" : "divider",
                  borderRadius: 2,
                  p: 2.5,
                  textAlign: "center",
                  cursor: canAddMore ? "pointer" : "default",
                  bgcolor: dragActive ? "primary.main" + "10" : "background.default",
                  transition: "all 0.2s",
                  mb: 2,
                }}
              >
                <CloudUpload sx={{ fontSize: 32, color: dragActive ? "primary.main" : "text.disabled", mb: 1 }} />
                <Typography variant="body2" fontWeight={700}>
                  Drop media here or click to browse
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Up to {MAX_FILES} files, 5MB each
                </Typography>
              </Box>

              {uploadedMedia.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <ImageList
                    cols={uploadedMedia.length === 1 ? 1 : 3}
                    rowHeight={uploadedMedia.length === 1 ? 200 : 96}
                    gap={6}
                    sx={{ borderRadius: 2, overflow: "hidden", m: 0 }}
                  >
                    {uploadedMedia.map((m) => (
                      <ImageListItem key={m.mediaId} sx={{ position: "relative", "&:hover .remove-btn": { opacity: 1 } }}>
                        {m.previewUrl ? (
                          <img src={m.previewUrl} alt={m.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }} />
                        ) : (
                          <Box sx={{ width: "100%", height: "100%", bgcolor: "background.default", borderRadius: 1,
                            display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 0.5 }}>
                            <AddPhotoAlternate color="action" />
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 90, px: 0.5 }}>
                              {m.name}
                            </Typography>
                          </Box>
                        )}
                        <IconButton
                          className="remove-btn"
                          size="small"
                          onClick={(e) => { e.stopPropagation(); removeMedia(m.mediaId); }}
                          sx={{
                            position: "absolute", top: 4, right: 4,
                            bgcolor: "rgba(0,0,0,0.6)", color: "#fff", opacity: 0,
                            transition: "opacity 0.2s", p: 0.4,
                            "&:hover": { bgcolor: "error.main" },
                          }}
                        >
                          <Delete sx={{ fontSize: 14 }} />
                        </IconButton>
                      </ImageListItem>
                    ))}

                    {canAddMore && (
                      <ImageListItem sx={{
                        border: "2px dashed", borderColor: "divider", borderRadius: 1,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", bgcolor: "background.default",
                      }}>
                        <Box sx={{ textAlign: "center" }}>
                          <AddPhotoAlternate color="action" />
                          <Typography variant="caption" color="text.secondary" display="block">Add more</Typography>
                        </Box>
                      </ImageListItem>
                    )}
                  </ImageList>
                </Box>
              )}

              {uploadError && (
                <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }} onClose={() => setUploadError("")}>
                  {uploadError}
                </Alert>
              )}
            </Box>

            <Paper elevation={0} sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.default" }}>
              <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 1 }}>
                Preview
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5 }}>
                <UserAvatar avatar={auth?.avatar} username={auth?.username} sx={{ width: 34, height: 34 }} />
                <Box>
                  <Typography variant="body2" fontWeight={700}>{auth?.username || "User"}</Typography>
                  <Typography variant="caption" color="text.secondary">Now</Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ minHeight: 80, whiteSpace: "pre-wrap", wordBreak: "break-word", color: contentValue ? "text.primary" : "text.disabled" }}>
                {contentValue || "Your post preview will appear here."}
              </Typography>
              {uploadedMedia.length > 0 && (
                <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
                  <Chip icon={<Image sx={{ fontSize: 14 }} />} label={`${imageCount} image${imageCount === 1 ? "" : "s"}`} size="small" />
                  <Chip icon={<Movie sx={{ fontSize: 14 }} />} label={`${fileCount} other`} size="small" />
                </Box>
              )}
            </Paper>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2.5 }, gap: 1 }}>
          <Button onClick={handleClose} disabled={submitting || isUploading} variant="outlined">Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting || isUploading}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Send />}>
            {submitting ? "Posting…" : "Post"}
          </Button>
        </DialogActions>
      </form>
      <Fade in={submitting}>
        <Box sx={{
          position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.28)",
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(2px)", zIndex: 2,
        }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, textAlign: "center" }}>
            <CircularProgress size={28} sx={{ mb: 1 }} />
            <Typography variant="body2" fontWeight={700}>Publishing post</Typography>
          </Paper>
        </Box>
      </Fade>
    </Dialog>
  );
};

export default CreatePostModal;
