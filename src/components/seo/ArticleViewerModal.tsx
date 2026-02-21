import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Eye, Code, FileText, Clock, Hash, FileCode } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

interface ArticleData {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  word_count?: number;
  reading_time_minutes?: number;
  target_keywords?: string[];
  created_at: string;
}

interface ArticleViewerModalProps {
  article: ArticleData | null;
  isOpen: boolean;
  onClose: () => void;
}

type DisplayMode = 'rich' | 'plain' | 'markdown' | 'html';

const DISPLAY_MODES: { id: DisplayMode; label: string; icon: React.ElementType }[] = [
  { id: 'rich', label: 'Rich Text', icon: Eye },
  { id: 'plain', label: 'Plain Text', icon: FileText },
  { id: 'markdown', label: 'Markdown', icon: Code },
  { id: 'html', label: 'HTML', icon: FileCode },
];

// Strip markdown syntax to produce clean plain text
const stripMarkdown = (md: string): string => {
  return md
    .replace(/#{1,6}\s+/g, '')                 // Remove headings
    .replace(/\*\*(.+?)\*\*/g, '$1')           // Remove bold
    .replace(/\*(.+?)\*/g, '$1')               // Remove italic
    .replace(/_(.+?)_/g, '$1')                  // Remove underscore italic
    .replace(/`(.+?)`/g, '$1')                  // Remove inline code
    .replace(/^\s*[-*+]\s/gm, '- ')            // Normalize bullets
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')        // Remove links, keep text
    .replace(/>\s?/gm, '')                      // Remove blockquotes
    .replace(/---+/g, '')                       // Remove horizontal rules
    .replace(/\n{3,}/g, '\n\n')                 // Collapse excessive newlines
    .trim();
};

// Convert markdown to basic HTML string
const markdownToHtml = (md: string): string => {
  let html = md;

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

  // Inline code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');

  // Unordered lists — group consecutive bullet lines
  html = html.replace(/((?:^[-*+]\s.+\n?)+)/gm, (match) => {
    const items = match.trim().split('\n').map(line =>
      `  <li>${line.replace(/^[-*+]\s/, '')}</li>`
    ).join('\n');
    return `<ul>\n${items}\n</ul>`;
  });

  // Ordered lists — group consecutive numbered lines
  html = html.replace(/((?:^\d+\.\s.+\n?)+)/gm, (match) => {
    const items = match.trim().split('\n').map(line =>
      `  <li>${line.replace(/^\d+\.\s/, '')}</li>`
    ).join('\n');
    return `<ol>\n${items}\n</ol>`;
  });

  // Blockquotes
  html = html.replace(/^>\s?(.+)$/gm, '<blockquote>$1</blockquote>');

  // Horizontal rules
  html = html.replace(/^---+$/gm, '<hr>');

  // Paragraphs — wrap remaining non-empty, non-tag lines
  html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, '<p>$1</p>');

  // Clean up double newlines
  html = html.replace(/\n{2,}/g, '\n');

  return html.trim();
};

const ArticleViewerModal: React.FC<ArticleViewerModalProps> = ({ article, isOpen, onClose }) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('rich');
  const [copied, setCopied] = useState(false);

  const plainText = useMemo(() => article ? stripMarkdown(article.content) : '', [article]);
  const htmlContent = useMemo(() => article ? markdownToHtml(article.content) : '', [article]);

  const copyContent = async () => {
    if (!article) return;

    let textToCopy: string;
    switch (displayMode) {
      case 'rich':
      case 'markdown':
        textToCopy = article.content;
        break;
      case 'plain':
        textToCopy = plainText;
        break;
      case 'html':
        textToCopy = htmlContent;
        break;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success(`Copied as ${displayMode === 'rich' ? 'markdown' : displayMode}`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  if (!article) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        data-theme-aware
        className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden"
      >
        {/* Header */}
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <DialogTitle className="text-foreground text-xl font-bold pr-8 leading-tight">
            {article.title}
          </DialogTitle>

          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {article.word_count && (
              <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                <FileText className="w-3 h-3 mr-1" />
                {article.word_count} words
              </Badge>
            )}
            {article.reading_time_minutes && (
              <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                <Clock className="w-3 h-3 mr-1" />
                {article.reading_time_minutes} min read
              </Badge>
            )}
            <Badge variant="outline" className="text-xs border-border text-muted-foreground">
              {new Date(article.created_at).toLocaleDateString()}
            </Badge>
            {article.target_keywords && article.target_keywords.length > 0 && (
              <>
                {article.target_keywords.slice(0, 3).map((kw) => (
                  <Badge key={kw} className="text-xs bg-accent/10 text-accent border-accent/20">
                    <Hash className="w-3 h-3 mr-0.5" />
                    {kw}
                  </Badge>
                ))}
              </>
            )}
          </div>
        </DialogHeader>

        {/* Display mode switcher + Copy button */}
        <div className="px-6 pb-3 flex items-center justify-between gap-3 flex-shrink-0 border-b border-border/30">
          <div className="flex items-center bg-muted/50 rounded-lg p-1 gap-0.5">
            {DISPLAY_MODES.map((mode) => {
              const Icon = mode.icon;
              const isActive = displayMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setDisplayMode(mode.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-primary to-accent text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{mode.label}</span>
                </button>
              );
            })}
          </div>

          <Button
            size="sm"
            variant="outline"
            className="border-border text-foreground hover:bg-muted flex-shrink-0"
            onClick={copyContent}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 mr-1.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 mr-1.5" />
            )}
            Copy
          </Button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {displayMode === 'rich' && (
            <div className="article-rich-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-foreground mt-6 mb-3">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold text-foreground mt-6 mb-2 pb-1 border-b border-border/30">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-semibold text-foreground mt-4 mb-1.5">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-muted-foreground text-sm leading-relaxed my-2.5">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="text-foreground font-semibold">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="text-muted-foreground italic">{children}</em>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-outside ml-5 space-y-1.5 my-3 text-muted-foreground text-sm">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside ml-5 space-y-1.5 my-3 text-muted-foreground text-sm">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-accent/50 pl-4 italic text-muted-foreground my-4">{children}</blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{children}</a>
                  ),
                  code: ({ children }) => (
                    <code className="bg-muted/50 px-1.5 py-0.5 rounded text-xs font-mono text-foreground">{children}</code>
                  ),
                  hr: () => <hr className="border-border/30 my-6" />,
                }}
              >
                {article.content}
              </ReactMarkdown>
            </div>
          )}

          {displayMode === 'plain' && (
            <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground leading-relaxed">
              {plainText}
            </pre>
          )}

          {displayMode === 'markdown' && (
            <pre className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
              <code className="text-sm font-mono text-foreground leading-relaxed whitespace-pre-wrap">
                {article.content}
              </code>
            </pre>
          )}

          {displayMode === 'html' && (
            <pre className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
              <code className="text-sm font-mono text-foreground leading-relaxed whitespace-pre-wrap">
                {htmlContent}
              </code>
            </pre>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ArticleViewerModal;
