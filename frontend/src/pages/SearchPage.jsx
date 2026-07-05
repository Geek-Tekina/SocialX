import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Paper,
} from "@mui/material";
import { Search, Clear, TravelExplore } from "@mui/icons-material";
import { useState, useRef, useCallback } from "react";
import { searchPosts } from "../api/searchApi";
import PostCard from "../components/PostCard";

const MIN_QUERY_LENGTH = 2;

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);

  const doSearch = useCallback(async (q) => {
    if (!q || q.trim().length < MIN_QUERY_LENGTH) return;
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const { data } = await searchPosts(q.trim());
      // Backend returns array directly
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err.response?.data?.message || "Search failed";
      setError(msg);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    // Debounce search by 500ms
    clearTimeout(debounceRef.current);
    if (val.trim().length >= MIN_QUERY_LENGTH) {
      debounceRef.current = setTimeout(() => doSearch(val), 500);
    } else {
      setResults([]);
      setSearched(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
    setError("");
    clearTimeout(debounceRef.current);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      clearTimeout(debounceRef.current);
      doSearch(query);
    }
  };

  const mappedResults = results.map((r) => ({
    _id: r.postId,
    content: r.content,
    user: {
      _id: r.userId,
      username: r.username || null,
      avatar: r.avatar || "nova",
      profileImageUrl: r.profileImageUrl || null,
    },
    createdAt: r.createdAt,
    mediaIds: [],
  }));

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <TravelExplore color="primary" sx={{ fontSize: 28 }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Search
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Find posts by keyword
          </Typography>
        </Box>
      </Box>

      {/* Search input */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
        }}
      >
        <TextField
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Search posts... (press Enter or wait)"
          fullWidth
          variant="outlined"
          autoFocus
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {loading ? (
                  <CircularProgress size={20} />
                ) : (
                  <Search color="action" />
                )}
              </InputAdornment>
            ),
            endAdornment: query && (
              <InputAdornment position="end">
                <IconButton onClick={handleClear} size="small" aria-label="Clear search">
                  <Clear />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
          Minimum {MIN_QUERY_LENGTH} characters. Results are ranked by relevance.
        </Typography>
      </Paper>

      <Divider sx={{ mb: 3 }} />

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Results count */}
      {searched && !loading && !error && (
        <Box sx={{ mb: 2 }}>
          <Chip
            label={
              mappedResults.length === 0
                ? `No results for "${query}"`
                : `${mappedResults.length} result${mappedResults.length !== 1 ? "s" : ""} for "${query}"`
            }
            color={mappedResults.length > 0 ? "primary" : "default"}
            variant="outlined"
            size="small"
          />
        </Box>
      )}

      {/* Empty state — not yet searched */}
      {!searched && !loading && (
        <Box sx={{ textAlign: "center", py: 10 }}>
          <TravelExplore sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Start searching
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Type at least {MIN_QUERY_LENGTH} characters to search posts
          </Typography>
        </Box>
      )}

      {/* No results */}
      {searched && !loading && !error && mappedResults.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Search sx={{ fontSize: 56, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No posts found
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Try different keywords
          </Typography>
        </Box>
      )}

      {/* Results */}
      {!loading && mappedResults.length > 0 && (
        <Box>
          {mappedResults.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              // Search results are read-only — no delete
              onDelete={null}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default SearchPage;
