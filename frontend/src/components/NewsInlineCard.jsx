import { Box, Button, Chip, Paper, Typography } from "@mui/material";
import { Launch } from "@mui/icons-material";
import { formatDistanceToNow } from "../utils/dateUtils";

const NewsInlineCard = ({ item }) => (
  <Paper elevation={0} sx={{ mb: 2, border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "180px 1fr" } }}>
      <Box
        component="img"
        src={item.image}
        alt=""
        sx={{ width: "100%", height: { xs: 160, sm: "100%" }, minHeight: 150, objectFit: "cover", bgcolor: "background.default" }}
      />
      <Box sx={{ p: 2, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75, flexWrap: "wrap" }}>
          <Chip label="News" size="small" color="primary" variant="outlined" />
          <Typography variant="caption" color="text.secondary">{item.source}</Typography>
          <Typography variant="caption" color="text.secondary">{formatDistanceToNow(item.date)}</Typography>
        </Box>
        <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight: 1.35, mb: 1 }}>
          {item.title}
        </Typography>
        <Button
          component="a"
          href={item.url}
          target="_blank"
          rel="noreferrer"
          size="small"
          endIcon={<Launch sx={{ fontSize: 13 }} />}
          sx={{ px: 0 }}
        >
          Read
        </Button>
      </Box>
    </Box>
  </Paper>
);

export default NewsInlineCard;
