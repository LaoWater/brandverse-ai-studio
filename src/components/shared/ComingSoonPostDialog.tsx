import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Check } from 'lucide-react';
import { FaInstagram, FaFacebook, FaLinkedin, FaTiktok } from 'react-icons/fa6';
import { FaXTwitter } from 'react-icons/fa6';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

/*
 * PLATFORM INTEGRATION TECHNICAL GUIDE
 *
 * Meta (Instagram + Facebook):
 * - API: Instagram Graph API + Facebook Graph API
 * - Auth: OAuth 2.0 via Facebook Login, requires Business Account
 * - Permissions: instagram_basic, instagram_content_publish, pages_manage_posts, pages_read_engagement
 * - Process: Register app on Meta for Developers -> App Review (2-4 weeks) -> Business Verification
 * - Publishing: POST /{ig-user-id}/media (create container) -> POST /{ig-user-id}/media_publish (publish)
 * - Rate limit: 200 API calls/user/hour, 25 content publishing calls/day
 *
 * Twitter/X:
 * - API: X API v2 (POST /2/tweets)
 * - Auth: OAuth 2.0 with PKCE (user-level) or OAuth 1.0a
 * - Tiers: Free (1,500 posts/month), Basic ($200/month, 3K posts), Pro ($5K/month)
 * - Media: POST /1.1/media/upload.json (chunked for video >5MB)
 *
 * LinkedIn:
 * - API: LinkedIn Marketing API (UGC Posts)
 * - Auth: OAuth 2.0 (3-legged)
 * - Permissions: w_member_social (personal), w_organization_social (company pages)
 * - Publishing: POST /ugcPosts with shareContent payload
 *
 * TikTok:
 * - API: Content Posting API (Direct Post)
 * - Auth: OAuth 2.0, permission: video.publish
 * - Important: Only supports VIDEO publishing, not static images
 *
 * Shared Infrastructure Needed:
 * - DB table: platform_connections (user_id, platform, access_token_encrypted, refresh_token_encrypted, expires_at, scopes)
 * - OAuth callback routes: /auth/callback/instagram, /auth/callback/twitter, etc.
 * - Token refresh edge function
 * - Encryption: Supabase Vault or env-level key for token storage
 * - Rate limiting: Per-platform queuing
 */

interface ComingSoonPostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  platform: string;
  postContent?: string;
  mediaUrl?: string;
}

const PLATFORM_CONFIG: Record<string, {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  url: string;
  gradient: string;
  timeline: string;
}> = {
  instagram: {
    name: 'Instagram',
    icon: FaInstagram,
    url: 'https://instagram.com',
    gradient: 'from-purple-500 via-pink-500 to-orange-500',
    timeline: 'Q2 2026',
  },
  twitter: {
    name: 'X (Twitter)',
    icon: FaXTwitter,
    url: 'https://x.com/compose/post',
    gradient: 'from-gray-700 to-gray-900',
    timeline: 'Q2 2026',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: FaLinkedin,
    url: 'https://linkedin.com/feed/',
    gradient: 'from-blue-600 to-blue-800',
    timeline: 'Q2 2026',
  },
  facebook: {
    name: 'Facebook',
    icon: FaFacebook,
    url: 'https://facebook.com',
    gradient: 'from-blue-500 to-blue-700',
    timeline: 'Q2 2026',
  },
  tiktok: {
    name: 'TikTok',
    icon: FaTiktok,
    url: 'https://tiktok.com/upload',
    gradient: 'from-gray-900 via-pink-500 to-cyan-400',
    timeline: 'Q3 2026',
  },
};

const ComingSoonPostDialog = ({
  isOpen,
  onClose,
  platform,
  postContent,
  mediaUrl,
}: ComingSoonPostDialogProps) => {
  const { toast } = useToast();
  const [copiedContent, setCopiedContent] = useState(false);
  const [copiedMedia, setCopiedMedia] = useState(false);

  const config = PLATFORM_CONFIG[platform] || {
    name: platform,
    icon: FaInstagram,
    url: '#',
    gradient: 'from-primary to-accent',
    timeline: 'TBD',
  };

  const IconComponent = config.icon;

  const handleCopy = async (text: string, type: 'content' | 'media') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'content') {
        setCopiedContent(true);
        setTimeout(() => setCopiedContent(false), 2000);
      } else {
        setCopiedMedia(true);
        setTimeout(() => setCopiedMedia(false), 2000);
      }
      toast({
        title: 'Copied!',
        description: `${type === 'content' ? 'Post content' : 'Media URL'} copied to clipboard.`,
        className: 'bg-green-600/90 border-green-600 text-white',
      });
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="bg-card border-primary/20 max-w-md">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto mb-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
              <IconComponent className="w-8 h-8 text-white" />
            </div>
          </div>
          <AlertDialogTitle className="text-white text-xl">
            Auto-posting to {config.name} is coming soon!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400 text-sm leading-relaxed">
            For now, copy your content and media to post manually.
            We're working on direct platform integrations.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-4">
          {postContent && (
            <Button
              variant="outline"
              onClick={() => handleCopy(postContent, 'content')}
              className="w-full border-primary/30 text-white hover:bg-primary/10 justify-start"
            >
              {copiedContent ? (
                <Check className="w-4 h-4 mr-2 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copiedContent ? 'Copied!' : 'Copy Content'}
            </Button>
          )}

          {mediaUrl && (
            <Button
              variant="outline"
              onClick={() => handleCopy(mediaUrl, 'media')}
              className="w-full border-primary/30 text-white hover:bg-primary/10 justify-start"
            >
              {copiedMedia ? (
                <Check className="w-4 h-4 mr-2 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copiedMedia ? 'Copied!' : 'Copy Media URL'}
            </Button>
          )}

          <Button
            onClick={() => window.open(config.url, '_blank')}
            className={`w-full bg-gradient-to-r ${config.gradient} text-white hover:opacity-90`}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open {config.name}
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="pt-2 pb-1">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Platform Integration</span>
            <span>{config.timeline}</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full w-1/4 transition-all" />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogAction
            onClick={onClose}
            className="w-full bg-white/10 text-white hover:bg-white/20 border-0"
          >
            Close
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ComingSoonPostDialog;
