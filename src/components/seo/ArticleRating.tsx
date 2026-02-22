import { useState, useEffect } from 'react';
import { Star, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ArticleRatingProps {
  blogPostId: string;
  companyId: string;
  targetKeywords?: string[];
  initialRating?: number | null;
  initialFeedback?: string | null;
  compact?: boolean;
  onRated?: (rating: number) => void;
}

const ArticleRating: React.FC<ArticleRatingProps> = ({
  blogPostId,
  companyId,
  targetKeywords,
  initialRating,
  initialFeedback,
  compact = false,
  onRated,
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(initialRating || 0);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [feedback, setFeedback] = useState(initialFeedback || '');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExistingRating, setHasExistingRating] = useState(!!initialRating);

  // Load existing rating
  useEffect(() => {
    if (!user || !blogPostId || initialRating) return;
    const load = async () => {
      const { data } = await supabase
        .from('seo_article_ratings')
        .select('rating, feedback_text')
        .eq('blog_post_id', blogPostId)
        .eq('user_id', user.id)
        .single();

      if (data) {
        setRating(data.rating);
        setFeedback(data.feedback_text || '');
        setHasExistingRating(true);
      }
    };
    load();
  }, [user, blogPostId, initialRating]);

  const saveRating = async (newRating: number) => {
    if (!user) return;

    setRating(newRating);
    setIsSaving(true);

    try {
      // Upsert rating
      const { error: ratingError } = await supabase
        .from('seo_article_ratings')
        .upsert(
          {
            blog_post_id: blogPostId,
            company_id: companyId,
            user_id: user.id,
            rating: newRating,
            feedback_text: feedback || null,
            keywords_used: targetKeywords || [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'blog_post_id,user_id' }
        );

      if (ratingError) throw ratingError;

      // Update blog post user_rating
      await supabase
        .from('seo_blog_posts')
        .update({
          user_rating: newRating,
          rating_feedback: feedback || null,
        })
        .eq('id', blogPostId);

      // Update keyword stats if keywords provided
      if (targetKeywords && targetKeywords.length > 0) {
        await supabase.rpc('update_keyword_stats', {
          _company_id: companyId,
          _keywords: targetKeywords,
          _increment_articles: !hasExistingRating,
          _increment_analysis: false,
          _new_rating: newRating,
        });
      }

      setHasExistingRating(true);
      onRated?.(newRating);
      toast.success(`Rated ${newRating}/5`);
    } catch (error: any) {
      console.error('Failed to save rating:', error);
      toast.error('Failed to save rating');
    } finally {
      setIsSaving(false);
    }
  };

  const saveFeedback = async () => {
    if (!user || !rating) return;
    setIsSaving(true);

    try {
      await supabase
        .from('seo_article_ratings')
        .upsert(
          {
            blog_post_id: blogPostId,
            company_id: companyId,
            user_id: user.id,
            rating,
            feedback_text: feedback || null,
            keywords_used: targetKeywords || [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'blog_post_id,user_id' }
        );

      await supabase
        .from('seo_blog_posts')
        .update({ rating_feedback: feedback || null })
        .eq('id', blogPostId);

      setShowFeedback(false);
      toast.success('Feedback saved');
    } catch {
      toast.error('Failed to save feedback');
    } finally {
      setIsSaving(false);
    }
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={(e) => { e.stopPropagation(); saveRating(star); }}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            disabled={isSaving}
            className="p-0"
          >
            <Star
              className={`w-3.5 h-3.5 transition-colors ${
                star <= (hoveredStar || rating)
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-gray-600'
              }`}
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Stars */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => saveRating(star)}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            disabled={isSaving}
            className="p-0.5 rounded hover:bg-white/10 transition-colors"
          >
            <Star
              className={`w-4 h-4 transition-colors ${
                star <= (hoveredStar || rating)
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-gray-600 hover:text-gray-400'
              }`}
            />
          </button>
        ))}
        {isSaving && <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin ml-1" />}
      </div>

      {/* Feedback toggle */}
      {rating > 0 && (
        <button
          onClick={() => setShowFeedback(!showFeedback)}
          className="text-gray-500 hover:text-gray-300 transition-colors"
          title="Add feedback"
        >
          <MessageSquare className={`w-3.5 h-3.5 ${feedback ? 'text-accent' : ''}`} />
        </button>
      )}

      {/* Feedback textarea */}
      {showFeedback && (
        <div className="absolute top-full left-0 right-0 mt-2 z-10 p-3 rounded-lg bg-card border border-border shadow-lg">
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What could be improved?"
            className="text-sm bg-white/5 border-white/20 text-white mb-2"
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowFeedback(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveFeedback} disabled={isSaving}>
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleRating;
