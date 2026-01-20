import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, Plus, Hash, FileText, Tag, StickyNote } from 'lucide-react';
import { MediaFile } from '@/services/mediaStudioService';

interface MediaEditDialogProps {
  media: MediaFile | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (mediaId: string, updates: Partial<MediaFile>) => Promise<void>;
  isSaving?: boolean;
}

const MediaEditDialog = ({
  media,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}: MediaEditDialogProps) => {
  const [customTitle, setCustomTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [newTag, setNewTag] = useState('');

  // Initialize form when media changes
  useEffect(() => {
    if (media) {
      setCustomTitle(media.custom_title || '');
      setPrompt(media.prompt || '');
      setTags(media.tags || []);
      // Filter out GCS URI from notes for display (it's internal metadata)
      const displayNotes = media.notes?.replace(/GCS: gs:\/\/[^\s|]+\s*\|?\s*/g, '').trim() || '';
      setNotes(displayNotes);
    }
  }, [media]);

  const handleAddTag = () => {
    const trimmedTag = newTag.trim().toLowerCase().replace(/^#/, '');
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    if (!media) return;

    // Preserve GCS URI in notes if it exists
    const gcsMatch = media.notes?.match(/GCS: (gs:\/\/[^\s|]+)/);
    let finalNotes = notes.trim();
    if (gcsMatch) {
      finalNotes = finalNotes ? `${finalNotes} | ${gcsMatch[0]}` : gcsMatch[0];
    }

    await onSave(media.id, {
      custom_title: customTitle.trim() || null,
      prompt: prompt.trim(),
      tags,
      notes: finalNotes || null,
    });
  };

  const hasChanges = () => {
    if (!media) return false;
    const originalNotes = media.notes?.replace(/GCS: gs:\/\/[^\s|]+\s*\|?\s*/g, '').trim() || '';
    return (
      (customTitle.trim() || null) !== (media.custom_title || null) ||
      prompt.trim() !== (media.prompt || '') ||
      JSON.stringify(tags) !== JSON.stringify(media.tags || []) ||
      notes.trim() !== originalNotes
    );
  };

  if (!media) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Edit Media Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Custom Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-300 flex items-center gap-2">
              <Tag className="w-4 h-4 text-accent" />
              Title
            </Label>
            <Input
              id="title"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Give this media a custom title..."
              className="bg-background/50 border-primary/20 focus:border-primary/50 text-white"
            />
            <p className="text-xs text-gray-500">
              A friendly name to identify this media in your library
            </p>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-gray-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" />
              Prompt
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="The prompt used to generate this media..."
              rows={4}
              className="bg-background/50 border-primary/20 focus:border-primary/50 text-white resize-none"
            />
            <p className="text-xs text-gray-500">
              The description or prompt associated with this media
            </p>
          </div>

          {/* Tags/Hashtags */}
          <div className="space-y-2">
            <Label className="text-gray-300 flex items-center gap-2">
              <Hash className="w-4 h-4 text-accent" />
              Hashtags
            </Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a hashtag..."
                className="bg-background/50 border-primary/20 focus:border-primary/50 text-white flex-1"
              />
              <Button
                type="button"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                variant="outline"
                className="border-primary/30 hover:border-primary/50 hover:bg-primary/10"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="border-primary/30 text-gray-300 bg-primary/5 pl-2 pr-1 py-1 flex items-center gap-1"
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500">
              Add hashtags to organize and find your media easily
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-gray-300 flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-accent" />
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this media..."
              rows={3}
              className="bg-background/50 border-primary/20 focus:border-primary/50 text-white resize-none"
            />
            <p className="text-xs text-gray-500">
              Personal notes or additional context
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSaving}
            className="text-gray-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges()}
            className="cosmic-button"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MediaEditDialog;
