import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ComingSoonPostDialog from './ComingSoonPostDialog';
import { cn } from '@/lib/utils';

interface PostActionButtonProps {
  platform: string;
  postContent?: string;
  mediaUrl?: string;
  size?: 'sm' | 'default';
  variant?: 'outline' | 'default';
  className?: string;
}

const PostActionButton = ({
  platform,
  postContent,
  mediaUrl,
  size = 'sm',
  variant = 'outline',
  className,
}: PostActionButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button
        size={size}
        variant={variant}
        onClick={() => setIsDialogOpen(true)}
        className={cn(
          'border-primary/30 text-primary hover:bg-primary/10',
          className,
        )}
      >
        <Send className="w-3 h-3" />
      </Button>

      <ComingSoonPostDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        platform={platform}
        postContent={postContent}
        mediaUrl={mediaUrl}
      />
    </>
  );
};

export default PostActionButton;
