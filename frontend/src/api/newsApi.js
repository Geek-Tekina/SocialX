const fallbackImages = [
  "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=900&q=80",
];

const fallbackImage = (key) => fallbackImages[Math.abs(String(key).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)) % fallbackImages.length];

const normalizeHn = (items) =>
  items
    .filter((item) => item.title && item.url)
    .map((item) => ({
      id: `hn-${item.objectID}`,
      title: item.title,
      url: item.url,
      source: "Hacker News",
      author: item.author,
      date: item.created_at,
      points: item.points,
      image: fallbackImage(item.objectID),
    }));

const normalizeDevTo = (items) =>
  items.map((item) => ({
    id: `devto-${item.id}`,
    title: item.title,
    url: item.url,
    source: "DEV",
    author: item.user?.name,
    date: item.published_at,
    points: item.public_reactions_count,
    image: item.cover_image || item.social_image || fallbackImage(item.id),
  }));

export const getRelevantNews = async () => {
  const [hn, devto] = await Promise.allSettled([
    fetch("https://hn.algolia.com/api/v1/search_by_date?query=social%20media%20AI&tags=story&hitsPerPage=12"),
    fetch("https://dev.to/api/articles?tag=socialmedia&per_page=12"),
  ]);

  const items = [];

  if (hn.status === "fulfilled" && hn.value.ok) {
    const data = await hn.value.json();
    items.push(...normalizeHn(data.hits || []));
  }

  if (devto.status === "fulfilled" && devto.value.ok) {
    const data = await devto.value.json();
    items.push(...normalizeDevTo(data || []));
  }

  return items
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 20);
};
