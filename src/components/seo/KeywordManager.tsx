import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Plus, X, Wand2, ChevronDown, ChevronUp, Tag, Loader2, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { manageKeywords } from '@/services/seoService';

type KeywordCategory = 'primary' | 'secondary' | 'long-tail' | 'brand' | 'competitor';

interface SeoKeyword {
  id: string;
  keyword: string;
  category: KeywordCategory;
  is_active: boolean;
  times_used_in_articles: number;
  times_used_in_analysis: number;
  avg_article_rating: number | null;
}

const CATEGORY_COLORS: Record<KeywordCategory, string> = {
  primary: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  secondary: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'long-tail': 'bg-green-500/20 text-green-400 border-green-500/30',
  brand: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  competitor: 'bg-red-500/20 text-red-400 border-red-500/30',
};

interface KeywordManagerProps {
  companyId: string;
  companyName: string;
  companyDescription: string;
  industry: string;
  targetAudience: string;
  userCredits: number;
  keywordSuggestCredits: number;
  onCreditsChange: (delta: number) => void;
}

const KeywordManager: React.FC<KeywordManagerProps> = ({
  companyId,
  companyName,
  companyDescription,
  industry,
  targetAudience,
  userCredits,
  keywordSuggestCredits,
  onCreditsChange,
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [keywords, setKeywords] = useState<SeoKeyword[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newCategory, setNewCategory] = useState<KeywordCategory>('primary');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch keywords
  useEffect(() => {
    if (!companyId || !user) return;
    const fetchKeywords = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('seo_keywords')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch keywords:', error);
      } else {
        setKeywords((data || []) as SeoKeyword[]);
      }
      setIsLoading(false);
    };
    fetchKeywords();
  }, [companyId, user]);

  const addKeyword = async () => {
    if (!newKeyword.trim() || !user) return;

    const { data, error } = await supabase
      .from('seo_keywords')
      .insert({
        company_id: companyId,
        user_id: user.id,
        keyword: newKeyword.trim(),
        category: newCategory,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        toast.error('Keyword already exists');
      } else {
        toast.error('Failed to add keyword');
      }
      return;
    }

    setKeywords(prev => [data as SeoKeyword, ...prev]);
    setNewKeyword('');
    toast.success('Keyword added');
  };

  const removeKeyword = async (id: string) => {
    const { error } = await supabase
      .from('seo_keywords')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to remove keyword');
      return;
    }

    setKeywords(prev => prev.filter(k => k.id !== id));
  };

  const toggleKeyword = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('seo_keywords')
      .update({ is_active: !currentActive })
      .eq('id', id);

    if (error) {
      toast.error('Failed to toggle keyword');
      return;
    }

    setKeywords(prev =>
      prev.map(k => (k.id === id ? { ...k, is_active: !currentActive } : k))
    );
  };

  const suggestKeywords = async () => {
    if (userCredits < keywordSuggestCredits) {
      toast.error(`Insufficient credits. Keyword suggestion requires ${keywordSuggestCredits} credit.`);
      return;
    }

    setIsSuggesting(true);
    try {
      const result = await manageKeywords({
        company_name: companyName,
        company_description: companyDescription,
        industry,
        target_audience: targetAudience,
        existing_keywords: keywords.map(k => k.keyword),
        action: 'suggest',
      });

      // Deduct credits
      const { error: creditError } = await supabase.rpc('deduct_credits', {
        _user_id: user!.id,
        _credits_to_deduct: keywordSuggestCredits,
      });
      if (!creditError) {
        onCreditsChange(-keywordSuggestCredits);
      }

      if (result.keywords && result.keywords.length > 0) {
        // Auto-add suggested keywords
        const toInsert = result.keywords.map(k => ({
          company_id: companyId,
          user_id: user!.id,
          keyword: k.keyword,
          category: k.category,
          search_volume_estimate: k.estimated_difficulty === 'easy' ? 'low' : k.estimated_difficulty === 'hard' ? 'high' : 'medium',
          difficulty_estimate: k.estimated_difficulty,
        }));

        const { data, error } = await supabase
          .from('seo_keywords')
          .upsert(toInsert, { onConflict: 'company_id,keyword' })
          .select();

        if (!error && data) {
          setKeywords(prev => {
            const existingIds = new Set(prev.map(k => k.keyword.toLowerCase()));
            const newOnes = (data as SeoKeyword[]).filter(k => !existingIds.has(k.keyword.toLowerCase()));
            return [...newOnes, ...prev];
          });
          toast.success(`Added ${data.length} keyword suggestions`);
        }
      } else {
        toast.info('No new keyword suggestions found');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to suggest keywords');
    } finally {
      setIsSuggesting(false);
    }
  };

  const activeKeywords = keywords.filter(k => k.is_active);
  const inactiveKeywords = keywords.filter(k => !k.is_active);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:border-accent/30 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <Tag className="w-5 h-5 text-accent" />
            <span className="text-white font-medium">Keyword Manager</span>
            {activeKeywords.length > 0 && (
              <Badge variant="outline" className="text-xs border-white/20 text-gray-400">
                {activeKeywords.length} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeKeywords.length > 0 && !isOpen && (
              <div className="flex gap-1 overflow-hidden max-w-[300px]">
                {activeKeywords.slice(0, 3).map(k => (
                  <Badge key={k.id} className={`text-xs border ${CATEGORY_COLORS[k.category]}`}>
                    {k.keyword}
                  </Badge>
                ))}
                {activeKeywords.length > 3 && (
                  <span className="text-xs text-gray-500">+{activeKeywords.length - 3}</span>
                )}
              </div>
            )}
            {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 p-4 bg-white/5 rounded-lg border border-white/10 space-y-4">
          {/* Add keyword input */}
          <div className="flex gap-2">
            <Input
              placeholder="Add keyword..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
              className="bg-white/5 border-white/20 text-white flex-1"
            />
            <Select value={newCategory} onValueChange={(v) => setNewCategory(v as KeywordCategory)}>
              <SelectTrigger className="w-[130px] bg-white/5 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
                <SelectItem value="long-tail">Long-tail</SelectItem>
                <SelectItem value="brand">Brand</SelectItem>
                <SelectItem value="competitor">Competitor</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={addKeyword}
              disabled={!newKeyword.trim()}
              className="bg-accent/20 text-accent hover:bg-accent/30"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* AI Suggest button */}
          <Button
            variant="outline"
            size="sm"
            onClick={suggestKeywords}
            disabled={isSuggesting || userCredits < keywordSuggestCredits}
            className="w-full border-accent/30 text-accent hover:bg-accent/10"
          >
            {isSuggesting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4 mr-2" />
            )}
            AI Suggest Keywords
            <span className="ml-2 flex items-center text-xs opacity-70">
              <Coins className="w-3 h-3 mr-0.5" />
              {keywordSuggestCredits}
            </span>
          </Button>

          {/* Keywords list */}
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Active keywords */}
              {activeKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeKeywords.map(k => (
                    <div
                      key={k.id}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-sm transition-all ${CATEGORY_COLORS[k.category]} hover:opacity-80 group`}
                      title={`Used in ${k.times_used_in_articles} articles, ${k.times_used_in_analysis} analyses${k.avg_article_rating ? `, avg rating: ${k.avg_article_rating}` : ''}`}
                    >
                      <span>{k.keyword}</span>
                      <button
                        onClick={() => toggleKeyword(k.id, k.is_active)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Deactivate"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Inactive keywords */}
              {inactiveKeywords.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Inactive</p>
                  <div className="flex flex-wrap gap-2">
                    {inactiveKeywords.map(k => (
                      <div
                        key={k.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-sm border-gray-700 text-gray-500 opacity-60 hover:opacity-100 transition-all group cursor-pointer"
                        onClick={() => toggleKeyword(k.id, k.is_active)}
                        title="Click to reactivate"
                      >
                        <span>{k.keyword}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeKeyword(k.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400"
                          title="Delete permanently"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {keywords.length === 0 && (
                <p className="text-center text-gray-500 text-sm py-4">
                  No keywords yet. Add some manually or use AI Suggest.
                </p>
              )}
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default KeywordManager;
