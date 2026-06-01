import {
  Box, Typography, Button, Grid, Alert, CircularProgress,
  Divider, Paper, LinearProgress, Chip,
} from "@mui/material";
import { CloudUpload, PhotoLibrary, Refresh } from "@mui/icons-material";
import { useState, useEffect, useRef, useCallback } from "react";
import { getAllMedia, uploadMedia } from "../api/mediaApi";
import MediaCard from "../components/MediaCard";
import toast from "react-hot-toast";

const MediaPage = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const fetchMedia = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const { data } = await getAllMedia();
      setMedia(data.result || []);
    } catch (err) {
      if (err.response?.status === 404) setMedia([]);
      else setError(err.response?.data?.message || "Failed to load media");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File size must be under 5MB"); return; }
    setUploading(true); setUploadProgress(0);
    const interval = setInterval(() => setUploadProgress((p) => Math.min(p + 15, 85)), 200);
    try {
      await uploadMedia(file);
      clearInterval(interval); setUploadProgress(100);
      toast.success("Uploaded successfully");
      await fetchMedia(true);
    } catch (err) {
      clearInterval(interval);
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false); setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <PhotoLibrary sx={{ color: "text.secondary", fontSize: 22 }} />
          <Box>
            <Typography variant="h6" fontWeight={700}>My Media</Typography>
            {!loading && (
              <Typography variant="caption" color="text.secondary">
                {media.length} file{media.length !== 1 ? "s" : ""} uploaded
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<Refresh />}
            onClick={() => fetchMedia(true)} disabled={loading || uploading}>
            Refresh
          </Button>
          <Button variant="contained" size="small"
            startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : <CloudUpload />}
            onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </Box>
      </Box>

      <input ref={fileInputRef} type="file" hidden accept="image/*,video/*" onChange={handleFileSelect} />

      {uploading && (
        <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid", borderColor: "divider" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
            <Typography variant="body2" fontWeight={600}>Uploading...</Typography>
            <Typography variant="caption" color="text.secondary">{uploadProgress}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 4 }} />
        </Paper>
      )}

      <Divider sx={{ mb: 3 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button size="small" onClick={() => fetchMedia()}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {loading && (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}><MediaCard loading /></Grid>
          ))}
        </Grid>
      )}

      {!loading && !error && media.length === 0 && (
        <Box sx={{ textAlign: "center", py: 10 }}>
          <PhotoLibrary sx={{ fontSize: 48, color: "text.disabled", mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>No media yet</Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 2.5 }}>
            Upload images or videos to attach them to posts
          </Typography>
          <Button variant="contained" startIcon={<CloudUpload />} onClick={() => fileInputRef.current?.click()}>
            Upload First File
          </Button>
        </Box>
      )}

      {!loading && media.length > 0 && (
        <>
          <Box sx={{ mb: 2 }}>
            <Chip label={`${media.length} file${media.length !== 1 ? "s" : ""}`} size="small" />
          </Box>
          <Grid container spacing={2}>
            {media.map((item) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                <MediaCard media={item} />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
};

export default MediaPage;
