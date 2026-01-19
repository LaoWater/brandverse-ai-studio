import { useState, useRef } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Loader2, CheckCircle, Link2, FileVideo, FileImage, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ImportVideoDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyId?: string;
}

// Supported file types
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE_MB = 100; // 100MB limit

const SUPABASE_FUNCTION_URL = 'https://vcgaqikuaaazjpwyzvwb.supabase.co/functions/v1';

const ImportVideoDialog = ({ open, onClose, onSuccess, companyId }: ImportVideoDialogProps) => {
  const { user } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<'url' | 'file'>('file');

  // URL import state
  const [videoUrl, setVideoUrl] = useState('');

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Common state
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

  // File validation
  const validateFile = (file: File): string | null => {
    const isVideo = SUPPORTED_VIDEO_TYPES.includes(file.type);
    const isImage = SUPPORTED_IMAGE_TYPES.includes(file.type);

    if (!isVideo && !isImage) {
      return 'Unsupported file type. Please upload a video (MP4, WebM, MOV) or image (JPEG, PNG, GIF, WebP).';
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`;
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      setImportStatus('error');
      return;
    }

    setSelectedFile(file);
    setErrorMessage('');
    setImportStatus('idle');
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      setImportStatus('error');
      return;
    }

    setSelectedFile(file);
    setErrorMessage('');
    setImportStatus('idle');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Upload local file
  const handleFileUpload = async () => {
    if (!selectedFile || !user) return;

    setIsImporting(true);
    setImportStatus('importing');
    setErrorMessage('');
    setUploadProgress(0);

    try {
      const isVideo = SUPPORTED_VIDEO_TYPES.includes(selectedFile.type);
      const fileType = isVideo ? 'video' : 'image';
      const bucketName = isVideo ? 'media-studio-videos' : 'media-studio-images';

      // Generate unique filename
      const fileExt = selectedFile.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
      const timestamp = Date.now();
      const fileName = `${user.id}/${timestamp}_uploaded.${fileExt}`;

      setUploadProgress(10);

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message || 'Failed to upload file');
      }

      setUploadProgress(60);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(uploadData.path);

      setUploadProgress(80);

      // Create media_files record
      const { error: dbError } = await supabase
        .from('media_files')
        .insert({
          user_id: user.id,
          company_id: companyId || null,
          file_name: selectedFile.name,
          file_type: fileType,
          file_format: fileExt,
          file_size: selectedFile.size,
          storage_path: uploadData.path,
          public_url: publicUrl,
          thumbnail_url: isVideo ? null : publicUrl, // Images use themselves as thumbnail
          prompt: 'Local upload',
          model_used: 'local-upload',
          aspect_ratio: null,
          quality: null,
          duration: null,
          tags: ['uploaded'],
          is_favorite: false,
        });

      if (dbError) {
        throw new Error(dbError.message || 'Failed to save file record');
      }

      setUploadProgress(100);
      setImportStatus('success');

      // Wait a moment to show success, then close
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);

    } catch (error: any) {
      console.error('Upload error:', error);
      setErrorMessage(error.message || 'Failed to upload file');
      setImportStatus('error');
    } finally {
      setIsImporting(false);
    }
  };

  // URL import (existing functionality)
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
    setSelectedFile(null);
    setUploadProgress(0);
    setImportStatus('idle');
    setErrorMessage('');
    setActiveTab('file');
    onClose();
  };

  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Check if file is a video
  const isVideoFile = selectedFile ? SUPPORTED_VIDEO_TYPES.includes(selectedFile.type) : false;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="bg-card/95 backdrop-blur-xl max-w-lg border border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Upload className="w-5 h-5 text-primary" />
            Import Media
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Upload a video or image from your device, or import from a URL.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'url' | 'file')} className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-background/50">
            <TabsTrigger value="file" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="url" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Link2 className="w-4 h-4 mr-2" />
              From URL
            </TabsTrigger>
          </TabsList>

          {/* File Upload Tab */}
          <TabsContent value="file" className="space-y-4 mt-4">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Drop zone */}
            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Drop files here or click to browse</p>
                    <p className="text-gray-500 text-sm mt-1">
                      Videos (MP4, WebM, MOV) or Images (JPEG, PNG, GIF, WebP)
                    </p>
                    <p className="text-gray-600 text-xs mt-1">Max {MAX_FILE_SIZE_MB}MB</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Selected file preview */
              <div className="border border-primary/30 rounded-lg p-4 bg-background/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {isVideoFile ? (
                      <FileVideo className="w-6 h-6 text-primary" />
                    ) : (
                      <FileImage className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{selectedFile.name}</p>
                    <p className="text-gray-500 text-sm">
                      {isVideoFile ? 'Video' : 'Image'} - {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    disabled={isImporting}
                    className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Upload progress */}
                {isImporting && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 bg-background rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* File upload action */}
            <div className="flex gap-3">
              <Button
                onClick={handleFileUpload}
                disabled={isImporting || !selectedFile || importStatus === 'success'}
                className="flex-1 cosmic-button text-white"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : importStatus === 'success' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Uploaded!
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {selectedFile ? (isVideoFile ? 'Video' : 'Image') : 'File'}
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
          </TabsContent>

          {/* URL Import Tab */}
          <TabsContent value="url" className="space-y-4 mt-4">
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

            {/* URL import action */}
            <div className="flex gap-3">
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
                    <Link2 className="w-4 h-4 mr-2" />
                    Import from URL
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
          </TabsContent>
        </Tabs>

        {/* Error Message - shown for both tabs */}
        {importStatus === 'error' && errorMessage && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mt-4">
            <p className="text-sm text-destructive">{errorMessage}</p>
          </div>
        )}

        {/* Success Message - shown for both tabs */}
        {importStatus === 'success' && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-2 mt-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-sm text-green-400">
              {activeTab === 'file' ? 'File uploaded successfully!' : 'Video imported successfully!'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImportVideoDialog;
