import {
  Card, CardMedia, CardContent, Typography, Box, Chip, Skeleton,
  Tooltip,
} from "@mui/material";
import { Image, VideoFile, InsertDriveFile } from "@mui/icons-material";
import { formatDistanceToNow } from "../utils/dateUtils";

const getTypeLabel = (mimeType) => {
  if (!mimeType) return "FILE";
  if (mimeType.startsWith("image/")) return mimeType.split("/")[1]?.toUpperCase();
  if (mimeType.startsWith("video/")) return mimeType.split("/")[1]?.toUpperCase();
  return "FILE";
};

const MediaCard = ({ media, loading = false }) => {
  if (loading) {
    return (
      <Card>
        <Skeleton variant="rectangular" height={180} />
        <CardContent>
          <Skeleton width="70%" />
          <Skeleton width="40%" />
        </CardContent>
      </Card>
    );
  }

  const isImage = media?.mimeType?.startsWith("image/");
  const isVideo = media?.mimeType?.startsWith("video/");

  return (
    <Card sx={{
      height: "100%", display: "flex", flexDirection: "column",
      transition: "transform 0.15s, box-shadow 0.15s",
      "&:hover": { transform: "translateY(-3px)", boxShadow: "0 10px 28px rgba(0,0,0,0.1)" },
    }}>
      <Box sx={{ position: "relative", bgcolor: "background.default", height: 180, overflow: "hidden", borderRadius: "12px 12px 0 0" }}>
        {isImage ? (
          <CardMedia component="img" image={media.url} alt={media.originalName}
            sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : isVideo ? (
          <CardMedia component="video" src={media.url}
            sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "text.secondary" }}>
            <InsertDriveFile sx={{ fontSize: 48 }} />
          </Box>
        )}
        <Chip
          label={getTypeLabel(media?.mimeType)}
          size="small"
          sx={{ position: "absolute", top: 8, left: 8, bgcolor: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 10, height: 20 }}
        />
      </Box>

      <CardContent sx={{ flex: 1, pt: 1.5 }}>
        <Tooltip title={media?.originalName} placement="top">
          <Typography variant="body2" fontWeight={600} noWrap sx={{ mb: 0.5 }}>
            {media?.originalName}
          </Typography>
        </Tooltip>
        <Typography variant="caption" color="text.secondary">
          {formatDistanceToNow(media?.createdAt)}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default MediaCard;
