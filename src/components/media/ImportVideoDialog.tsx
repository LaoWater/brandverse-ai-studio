import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, CheckCircle, Link2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ImportVideoDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyId?: string;
}

const SUPABASE_FUNCTION_URL = 'https://vcgaqikuaaazjpwyzvwb.supabase.co/functions/v1';

const ImportVideoDialog = ({ open, onClose, onSuccess, companyId }: ImportVideoDialogProps) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const extractGcsPath = (url: string): string | null => {
    // Handle various GCS URL formats:
    // gs://bucket/path/to/file.mp4
    // https://storage.googleapis.com/bucket/path/to/file.mp4
    // https://storage.cloud.google.com/bucket/path/to/file.mp4

    // gs:// format
    if (url.startsWith('gs://')) {
      const match = url.match(/gs:\/\/[^/]+\/(.+)/);
      return match ? match[1] : null;
    }

    // storage.googleapis.com format (public URL)
    const publicMatch = url.match(/storage\.googleapis\.com\/[^/]+\/(.+)/);
    if (publicMatch) return publicMatch[1];

    // storage.cloud.google.com format (authenticated URL)
    const authMatch = url.match(/storage\.cloud\.google\.com\/[^/]+\/(.+)/);
    if (authMatch) return authMatch[1];

    return null;
  };

  const handleImport = async () => {
    if (!videoUrl.trim()) return;

    const gcsPath = extractGcsPath(videoUrl.trim());
    if (!gcsPath) {
      setErrorMessage('Invalid URL format. Please use a Google Cloud Storage URL.');
      setImportStatus('error');
      return;
    }

    setIsImporting(true);
    setImportStatus('importing');
    setErrorMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${SUPABASE_FUNCTION_URL}/import-gcs-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          gcs_path: gcsPath,
          company_id: companyId,
          // Optional metadata - could add more fields later
          prompt: 'Imported video',
          model: 'external-import',
          mode: 'import',
          aspect_ratio: '16:9',
          resolution: '1080p',
          duration: 0,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Import failed');
      }

      setImportStatus('success');

      // Wait a moment to show success, then close
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);

    } catch (error: any) {
      console.error('Import error:', error);
      setErrorMessage(error.message || 'Failed to import video');
      setImportStatus('error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setVideoUrl('');
    setImportStatus('idle');
    setErrorMessage('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="bg-card/95 backdrop-blur-xl max-w-md border border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Link2 className="w-5 h-5 text-primary" />
            Import External Video
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Import a video from Google Cloud Storage into your library.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="video-url" className="text-gray-300">
              Video URL
            </Label>
            <Input
              id="video-url"
              placeholder="gs://bucket/path/video.mp4 or https://storage.googleapis.com/..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              disabled={isImporting}
              className="bg-background/50 border-primary/20 text-white placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-500">
              Supports GCS URLs (gs://, storage.googleapis.com, storage.cloud.google.com)
            </p>
          </div>

          {/* Error Message */}
          {importStatus === 'error' && errorMessage && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              <p className="text-sm text-destructive">{errorMessage}</p>
            </div>
          )}

          {/* Success Message */}
          {importStatus === 'success' && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-sm text-green-400">Video imported successfully!</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleImport}
              disabled={isImporting || !videoUrl.trim() || importStatus === 'success'}
              className="flex-1 cosmic-button text-white"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : importStatus === 'success' ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Imported!
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Video
                </>
              )}
            </Button>
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={isImporting}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportVideoDialog;
