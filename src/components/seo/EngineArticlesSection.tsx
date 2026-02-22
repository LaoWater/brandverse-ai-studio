import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  FileText,
  PenTool,
  Coins,
  MoreVertical,
  Trash2,
  Star,
} from 'lucide-react';
import SeoProgressCard, { type SeoStage } from '@/components/seo/SeoProgressCard';
import ArticleRating from '@/components/seo/ArticleRating';

type ArticleStatus = 'draft' | 'published';

const STATUS_CONFIG: Record<ArticleStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  published: { label: 'Published', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
};

interface EngineArticlesSectionProps {
  blogPosts: any[];
  blogTopic: string;
  setBlogTopic: (topic: string) => void;
  isGeneratingBlog: boolean;
  blogStages: SeoStage[];
  blogError: string | null;
  generateBlogPost: () => void;
  userCredits: number;
  blogPostCredits: number;
  onViewArticle: (post: any) => void;
  onUpdateStatus: (id: string, status: ArticleStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const EngineArticlesSection: React.FC<EngineArticlesSectionProps> = ({
  blogPosts,
  blogTopic,
  setBlogTopic,
  isGeneratingBlog,
  blogStages,
  blogError,
  generateBlogPost,
  userCredits,
  blogPostCredits,
  onViewArticle,
  onUpdateStatus,
  onDelete,
}) => {
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const statusOptions: ArticleStatus[] = ['draft', 'published'];

  return (
    <div className="space-y-6">
      {/* Article Generator */}
      <Card className="cosmic-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-accent" />
            Article Generator
          </CardTitle>
          <CardDescription className="text-gray-400">
            Generate SEO-optimized articles based on your analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="blogTopic" className="text-white">Topic or Title (Optional)</Label>
            <Input
              id="blogTopic"
              placeholder="Leave empty for AI suggestion based on analysis"
              value={blogTopic}
              onChange={(e) => setBlogTopic(e.target.value)}
              className="bg-white/5 border-white/20 text-white mt-2"
            />
          </div>
          {!isGeneratingBlog && (
            <Button
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white"
              onClick={generateBlogPost}
              disabled={userCredits < blogPostCredits}
            >
              <PenTool className="mr-2 w-5 h-5" />
              Generate Article
              <span className="ml-2 flex items-center text-sm opacity-80">
                <Coins className="w-4 h-4 mr-1" />
                {blogPostCredits}
              </span>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Article Generation Progress */}
      {isGeneratingBlog && blogStages.length > 0 && (
        <SeoProgressCard
          stages={blogStages}
          title="Generating Article"
          subtitle={blogTopic || 'AI is choosing the best topic from your analysis'}
          error={blogError}
        />
      )}

      {/* Generated Articles */}
      {blogPosts && blogPosts.length > 0 && (
        <Card className="cosmic-card">
          <CardHeader>
            <CardTitle className="text-white text-lg">
              Generated Articles
              <Badge variant="outline" className="ml-2 text-xs border-white/20 text-gray-400">
                {blogPosts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {blogPosts.map((post: any) => {
              const status = (post.status as ArticleStatus) || 'draft';
              const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

              return (
                <div
                  key={post.id}
                  className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-accent/30 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => onViewArticle(post)}
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="text-white font-medium group-hover:text-accent transition-colors">
                          {post.title}
                        </h4>
                        <Badge className={`text-xs ${config.color} border`}>
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-sm line-clamp-2">
                        {post.excerpt || post.content?.substring(0, 150)}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <Badge variant="outline" className="text-xs border-white/20 text-gray-400">
                          {post.word_count || 0} words
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                        {/* Inline article rating */}
                        {post.company_id && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <ArticleRating
                              blogPostId={post.id}
                              companyId={post.company_id}
                              targetKeywords={post.target_keywords}
                              initialRating={post.user_rating}
                              compact
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        {statusOptions
                          .filter(s => s !== status)
                          .map(s => (
                            <DropdownMenuItem
                              key={s}
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateStatus(post.id, s);
                              }}
                            >
                              <span className={`w-2 h-2 rounded-full mr-2 ${
                                s === 'draft' ? 'bg-amber-400' : 'bg-emerald-400'
                              }`} />
                              Mark as {STATUS_CONFIG[s].label}
                            </DropdownMenuItem>
                          ))
                        }
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-400 focus:text-red-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget({ id: post.id, title: post.title });
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={async () => {
                if (deleteTarget) {
                  await onDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EngineArticlesSection;
