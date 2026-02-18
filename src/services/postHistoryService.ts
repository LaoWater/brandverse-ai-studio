const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'it', 'this', 'that', 'was', 'are',
  'be', 'has', 'had', 'have', 'will', 'would', 'could', 'should', 'may',
  'can', 'do', 'did', 'not', 'no', 'so', 'if', 'as', 'we', 'our', 'us',
  'he', 'she', 'they', 'them', 'his', 'her', 'its', 'my', 'your', 'their',
  'what', 'which', 'who', 'when', 'where', 'how', 'all', 'each', 'every',
  'both', 'few', 'more', 'most', 'other', 'some', 'such', 'than', 'too',
  'very', 'just', 'about', 'above', 'after', 'again', 'also', 'any', 'been',
  'before', 'being', 'between', 'because', 'into', 'through', 'during',
  'out', 'up', 'down', 'then', 'once', 'here', 'there', 'why', 'only',
  'own', 'same', 'new', 'now', 'get', 'got', 'like', 'make', 'made',
]);

interface Post {
  id: string;
  title: string;
  details?: string | null;
  platform_type: string;
  status?: string | null;
  has_picture?: string | null;
  has_video?: string | null;
  created_date?: string | null;
}

export interface PostHistoryStats {
  totalPosts: number;
  platformCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  wordFrequency: { word: string; count: number }[];
}

export const getPostHistoryStats = (posts: Post[]): PostHistoryStats => {
  const platformCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  const wordMap: Record<string, number> = {};

  posts.forEach(post => {
    // Platform counts
    platformCounts[post.platform_type] = (platformCounts[post.platform_type] || 0) + 1;

    // Status counts
    const status = post.status || 'draft';
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    // Word frequency from title and details
    const text = `${post.title || ''} ${post.details || ''}`.toLowerCase();
    const words = text.match(/\b[a-zA-Z]{3,}\b/g) || [];
    words.forEach(word => {
      if (!STOPWORDS.has(word) && word.length > 2) {
        wordMap[word] = (wordMap[word] || 0) + 1;
      }
    });
  });

  const wordFrequency = Object.entries(wordMap)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  return {
    totalPosts: posts.length,
    platformCounts,
    statusCounts,
    wordFrequency,
  };
};
