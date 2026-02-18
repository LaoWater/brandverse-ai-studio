import { useMemo } from "react";

interface WordCloudProps {
  words: { word: string; count: number }[];
  onWordClick?: (word: string) => void;
}

const COLORS = [
  'text-blue-400', 'text-purple-400', 'text-pink-400', 'text-cyan-400',
  'text-green-400', 'text-amber-400', 'text-indigo-400', 'text-rose-400',
];

const WordCloud = ({ words, onWordClick }: WordCloudProps) => {
  const styledWords = useMemo(() => {
    if (words.length === 0) return [];
    const maxCount = Math.max(...words.map(w => w.count));
    const minCount = Math.min(...words.map(w => w.count));
    const range = maxCount - minCount || 1;

    return words.map((w, i) => {
      const normalized = (w.count - minCount) / range;
      const fontSize = 12 + normalized * 12; // 12px to 24px
      const colorClass = COLORS[i % COLORS.length];
      return { ...w, fontSize, colorClass };
    });
  }, [words]);

  if (styledWords.length === 0) {
    return (
      <p className="text-xs text-gray-500 text-center py-2">
        Generate more posts to see trending words
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5 justify-center">
      {styledWords.map(({ word, count, fontSize, colorClass }) => (
        <button
          key={word}
          type="button"
          className={`${colorClass} hover:opacity-80 transition-opacity cursor-pointer leading-tight`}
          style={{ fontSize: `${fontSize}px` }}
          onClick={() => onWordClick?.(word)}
          title={`${word} (${count})`}
        >
          {word}
        </button>
      ))}
    </div>
  );
};

export default WordCloud;
