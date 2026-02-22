import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Eye, Filter, Plus, Calendar, Image, Video, Instagram, Facebook, Twitter, Linkedin, Search, X, Library, AlertCircle, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { EditPostDialog } from "@/components/EditPostDialog";
import { FaXTwitter, FaInstagram, FaFacebook, FaLinkedin } from "react-icons/fa6";
import { useCompany } from "@/contexts/CompanyContext";
import { useMediaStudio, MediaType } from "@/contexts/MediaStudioContext";
import { useAuth } from "@/contexts/AuthContext";
import MediaLibrary from "@/components/media/MediaLibrary";
import PostActionButton from "@/components/shared/PostActionButton";
import { MediaFile, extractAndUploadLastFrame } from "@/services/mediaStudioService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Post = Database['public']['Tables']['posts']['Row'];
type PostStatus = Database['public']['Enums']['post_status'];
type PlatformType = Database['public']['Enums']['platform_type'];
type ViewMode = 'posts' | 'studio';

const PostManager = () => {
  const { selectedCompany } = useCompany();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    setMediaType,
    setVideoGenerationMode,
    clearReferenceImages,
    addReferenceImageFromUrl,
    clearVideoFrames,
    setInputVideoImageFromUrl,
    setSourceVideoForExtension,
  } = useMediaStudio();

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('posts');
  const [isContinuingVideo, setIsContinuingVideo] = useState(false);
  const [continueVideoProgress, setContinueVideoProgress] = useState('');
  const [postedConfirmDialog, setPostedConfirmDialog] = useState<{ isOpen: boolean; postId: string | null }>({ isOpen: false, postId: null });
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ isOpen: boolean; postId: string | null }>({ isOpen: false, postId: null });
  const [filters, setFilters] = useState({
    platform: 'all',
    status: 'all',
    search: '',
    titleFilter: '',
    detailsFilter: '',
    platformFilter: '',
    statusFilter: ''
  });

  const queryClient = useQueryClient();

  const { data: allPosts, isLoading, error } = useQuery({
    queryKey: ['posts', selectedCompany?.id],
    queryFn: async () => {
      if (!selectedCompany?.id) {
        return [];
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('company_id', selectedCompany.id)
        .order('created_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedCompany?.id
  });

  const filteredPosts = useMemo(() => {
    if (!allPosts) return [];
    
    return allPosts.filter(post => {
      const matchesSearch = !filters.search || 
        post.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        (post.details && post.details.toLowerCase().includes(filters.search.toLowerCase()));

      const matchesPlatform = filters.platform === 'all' || post.platform_type === filters.platform;
      const matchesStatus = filters.status === 'all' || post.status === filters.status;

      const matchesTitle = !filters.titleFilter || 
        post.title.toLowerCase().includes(filters.titleFilter.toLowerCase());
      
      const matchesDetails = !filters.detailsFilter ||
        (post.details && post.details.toLowerCase().includes(filters.detailsFilter.toLowerCase()));
      
      const matchesPlatformFilter = !filters.platformFilter || 
        post.platform_type.toLowerCase().includes(filters.platformFilter.toLowerCase());
      
      const matchesStatusFilter = !filters.statusFilter || 
        (post.status && post.status.toLowerCase().includes(filters.statusFilter.toLowerCase()));

      return matchesSearch && matchesPlatform && matchesStatus && 
             matchesTitle && matchesDetails && matchesPlatformFilter && matchesStatusFilter;
    });
  }, [allPosts, filters]);

  const updatePostMutation = useMutation({
    mutationFn: async (updatedPostArgs: Partial<Post> & { id: string }) => {
      const { id, ...updateData } = updatedPostArgs;
      const { data, error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', selectedCompany?.id] });
      toast({
        title: "Post Updated! ✨",
        description: "Post has been successfully updated.",
      });
      setIsEditDialogOpen(false);
      setSelectedPost(null);
    },
    onError: (error) => {
      toast({
        title: "Error updating post",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts', selectedCompany?.id] });
      toast({
        title: "Post Deleted",
        description: "Post has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting post",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // --- Media Studio integration handlers (mirror MediaStudio.tsx) ---
  const handleUseForGeneration = async (media: MediaFile, targetType: MediaType) => {
    try {
      if (targetType === 'image') {
        clearReferenceImages();
        await addReferenceImageFromUrl(media.public_url, media.file_name);
        setMediaType('image');
      } else {
        clearVideoFrames();
        await setInputVideoImageFromUrl(media.public_url, media.file_name);
        setMediaType('video');
        setVideoGenerationMode('image-to-video');
      }
      navigate('/media-studio?view=create');
      toast({ title: 'Ready', description: `Image loaded in Media Studio for ${targetType} generation.` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load image. Please try again.', variant: 'destructive' });
    }
  };

  const handleContinueVideo = async (media: MediaFile) => {
    if (!user) return;
    setIsContinuingVideo(true);
    setContinueVideoProgress('Preparing...');
    try {
      const result = await extractAndUploadLastFrame(
        media.public_url,
        user.id,
        media.id,
        (stage) => setContinueVideoProgress(stage)
      );
      if (!result.success || !result.frameUrl) throw new Error(result.error || 'Failed to extract frame');
      clearVideoFrames();
      await setInputVideoImageFromUrl(result.frameUrl, `continuation_from_${media.file_name}`);
      setMediaType('video');
      setVideoGenerationMode('image-to-video');
      navigate('/media-studio?view=create');
      toast({ title: 'Ready to Continue', description: 'Last frame extracted! Enter a prompt in Media Studio to continue this video.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to extract frame.', variant: 'destructive' });
    } finally {
      setIsContinuingVideo(false);
      setContinueVideoProgress('');
    }
  };

  const handleExtendVideo = (media: MediaFile, gcsUri: string) => {
    setSourceVideoForExtension(gcsUri, media.public_url);
    setMediaType('video');
    setVideoGenerationMode('extend-video');
    navigate('/media-studio?view=create');
    toast({ title: 'Ready to Extend', description: 'Enter a prompt in Media Studio to extend this video.' });
  };

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: FaInstagram, color: 'from-pink-500 to-purple-600', iconColor: '#E4405F' },
    { id: 'facebook', name: 'Facebook', icon: FaFacebook, color: 'from-blue-600 to-blue-700', iconColor: '#1877F2' },
    { id: 'twitter', name: 'X', icon: FaXTwitter, color: 'from-sky-400 to-sky-600', iconColor: '#000000' },
    { id: 'linkedin', name: 'LinkedIn', icon: FaLinkedin, color: 'from-blue-700 to-blue-800', iconColor: '#0A66C2' }
  ];

  const getStatusColor = (status: PostStatus | null | undefined): { className: string; style: React.CSSProperties } => {
    switch (status) {
      case 'draft':
        return {
          className: 'text-yellow-900 border-yellow-600 font-semibold',
          style: { backgroundColor: '#eab308' }
        };
      case 'approved':
        return {
          className: 'text-green-900 border-green-600 font-semibold',
          style: { backgroundColor: '#22c55e' }
        };
      case 'posted':
        return {
          className: 'text-white border-2 border-emerald-300 font-semibold',
          style: { backgroundColor: '#10b981' }
        };
      default:
        return {
          className: 'text-gray-900 border-gray-600 font-semibold',
          style: { backgroundColor: '#6b7280' }
        };
    }
  };

  const getPlatformIcon = (platform: PlatformType) => {
    const platformData = platforms.find(p => p.id === platform);
    return platformData ? platformData.icon : Instagram;
  };

  const getPlatformColor = (platform: PlatformType) => {
    const platformData = platforms.find(p => p.id === platform);
    return platformData?.iconColor || '#6B7280';
  };

  const handleEditPost = (post: Post) => {
    setSelectedPost(post);
    setIsEditDialogOpen(true);
  };

  const handleSavePost = (formData: FormData) => {
    if (!selectedPost) return;

    const updatedPost: Partial<Post> & { id: string } = {
      id: selectedPost.id,
      title: formData.get('title') as string,
      details: formData.get('details') as string,
      status: formData.get('status') as PostStatus,
      platform_type: formData.get('platform_type') as PlatformType,
      has_picture: formData.get('has_picture') as string || null,
      has_video: formData.get('has_video') as string || null,
    };

    updatePostMutation.mutate(updatedPost);
  };

  const handleDeletePost = (postId: string) => {
    setDeleteConfirmDialog({ isOpen: true, postId });
  };

  const confirmDeletePost = () => {
    if (deleteConfirmDialog.postId) {
      deletePostMutation.mutate(deleteConfirmDialog.postId);
    }
    setDeleteConfirmDialog({ isOpen: false, postId: null });
  };

  const handleQuickStatusUpdate = (postId: string, newStatus: PostStatus) => {
    if (newStatus === 'posted') {
      setPostedConfirmDialog({ isOpen: true, postId });
    } else {
      updatePostMutation.mutate({ id: postId, status: newStatus });
    }
  };

  const confirmPostedStatus = () => {
    if (postedConfirmDialog.postId) {
      updatePostMutation.mutate({ id: postedConfirmDialog.postId, status: 'posted' });
    }
    setPostedConfirmDialog({ isOpen: false, postId: null });
  };

  const clearAllFilters = () => {
    setFilters({
      platform: 'all',
      status: 'all',
      search: '',
      titleFilter: '',
      detailsFilter: '',
      platformFilter: '',
      statusFilter: ''
    });
  };

  const isImageUrl = (url: string | null): url is string => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url) || url.includes('image') || url.includes('img');
  };

  if (!selectedCompany) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="text-center text-white">
            <h1 className="text-2xl mb-4">Please select a company to view posts</h1>
            <p className="text-gray-400">Choose a company from the navigation to manage your posts.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="text-center text-white">Loading posts...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="text-center text-red-400">Error loading posts: {error.message}</div>
        </div>
      </div>
    );
  }

  const groupedPosts = filteredPosts?.reduce((acc, post) => {
    if (!post.platform_type) return acc;
    if (!acc[post.platform_type]) {
      acc[post.platform_type] = [];
    }
    acc[post.platform_type].push(post);
    return acc;
  }, {} as Record<PlatformType, Post[]>) || {};

  return (
    <div className="min-h-screen bg-cosmic-gradient">
      {/* Ambient Gradient Background - Static for performance */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Top-left warm glow */}
        <div className="absolute top-16 left-[8%] w-[240px] h-[240px] bg-primary/16 rounded-full blur-3xl"></div>
        {/* Top-right accent */}
        <div className="absolute top-24 right-[12%] w-[200px] h-[200px] bg-accent/14 rounded-full blur-3xl"></div>
        {/* Mid-right primary */}
        <div className="absolute top-[50%] right-[6%] w-[180px] h-[180px] bg-primary/12 rounded-full blur-3xl"></div>
        {/* Bottom-left accent */}
        <div className="absolute bottom-[25%] left-[10%] w-[220px] h-[220px] bg-accent/15 rounded-full blur-3xl"></div>
        {/* Bottom-right blend */}
        <div className="absolute bottom-[10%] right-[15%] w-[200px] h-[200px] bg-primary/14 rounded-full blur-3xl"></div>
      </div>
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            {/* View Mode Switcher with Company Logo - GPU accelerated */}
            <div className="relative flex items-center justify-center gap-4 sm:gap-6 mb-3 sm:mb-4">
              {/* Tabs */}
              <div className="relative inline-flex items-center bg-muted/50 dark:bg-black/30 rounded-full p-1.5 sm:p-2 border-0 will-change-auto">
                {/* Sliding indicator - hardware accelerated with transform */}
                <div
                  className="absolute top-1 bottom-1 sm:top-1.5 sm:bottom-1.5 w-[calc(50%-6px)] rounded-full bg-gradient-to-r from-primary to-accent transition-transform duration-300 ease-out will-change-transform"
                  style={{
                    transform: viewMode === 'posts' ? 'translateX(6px)' : 'translateX(calc(100% + 6px))',
                  }}
                />

                {/* Posts Button */}
                <button
                  onClick={() => setViewMode('posts')}
                  className={`relative z-10 px-4 py-2.5 sm:px-7 sm:py-3.5 rounded-full text-sm sm:text-xl font-semibold transition-colors duration-200 ${
                    viewMode === 'posts'
                      ? 'text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className="flex items-center gap-1 sm:gap-2">
                    <span className="hidden sm:inline">Post</span> <span className={`font-serif ${viewMode === 'posts' ? 'text-white' : 'text-cosmic'}`}>Library</span>
                  </span>
                </button>

                {/* Studio Button */}
                <button
                  onClick={() => setViewMode('studio')}
                  className={`relative z-10 px-4 py-2.5 sm:px-7 sm:py-3.5 rounded-full text-sm sm:text-xl font-semibold transition-colors duration-200 ${
                    viewMode === 'studio'
                      ? 'text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className="flex items-center gap-1 sm:gap-2">
                    <span className="hidden sm:inline">Studio</span> <span className={`font-serif ${viewMode === 'studio' ? 'text-white' : 'text-cosmic'}`}><span className="sm:hidden">Media</span><span className="hidden sm:inline">Library</span></span>
                  </span>
                </button>
              </div>

              {/* Company Logo - Absolute Top Right - Hidden on mobile */}
              {selectedCompany && (
                <div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 items-center gap-3">
                  {selectedCompany.logo_path ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden">
                      <img
                        src={selectedCompany.logo_path}
                        alt={selectedCompany.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                      {selectedCompany.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-base font-medium text-white">{selectedCompany.name}</span>
                </div>
              )}
            </div>
            <p className="text-gray-300 text-sm sm:text-lg px-2">
              {viewMode === 'posts'
                ? <>Manage all your social media content for <span className="text-primary font-semibold">{selectedCompany.name}</span></>
                : <>Browse and manage all AI-generated media for <span className="text-primary font-semibold">{selectedCompany.name}</span></>
              }
            </p>
          </div>

          {viewMode === 'posts' ? (
            <>
              <Card className="cosmic-card mb-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filters & Search
                {(filters.search || filters.platform !== 'all' || filters.status !== 'all' || 
                  filters.titleFilter || filters.detailsFilter || filters.platformFilter || filters.statusFilter) && (
                  <Button
                    onClick={clearAllFilters}
                    size="sm"
                    variant="outline"
                    className="ml-auto border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear All
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-white">Global Search</Label>
                  <div className="relative">
                    <Input
                      placeholder="Search posts..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-white">Platform</Label>
                  <Select value={filters.platform} onValueChange={(value) => setFilters(prev => ({ ...prev, platform: value }))}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="all">All Platforms</SelectItem>
                      {platforms.map(platform => {
                        const IconComponent = platform.icon;
                        return (
                          <SelectItem key={platform.id} value={platform.id}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4" style={{ color: platform.iconColor }} />
                              {platform.name}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white">Status</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="posted">Posted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <div className="text-white text-sm">
                    Showing {filteredPosts?.length || 0} of {allPosts?.length || 0} posts
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="cosmic-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{filteredPosts?.length || 0}</div>
                <div className="text-gray-300 text-sm">Filtered Posts</div>
              </CardContent>
            </Card>
            <Card className="cosmic-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{filteredPosts?.filter(p => p.status === 'draft').length || 0}</div>
                <div className="text-gray-300 text-sm">Drafts</div>
              </CardContent>
            </Card>
            <Card className="cosmic-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{filteredPosts?.filter(p => p.status === 'approved').length || 0}</div>
                <div className="text-gray-300 text-sm">Approved</div>
              </CardContent>
            </Card>
            <Card className="cosmic-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{filteredPosts?.filter(p => p.status === 'posted').length || 0}</div>
                <div className="text-gray-300 text-sm">Posted</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="table" className="space-y-6">
            <TabsList className="bg-white/10 border-white/20 post-manager-tabs">
              <TabsTrigger value="table" className="data-[state=active]:bg-primary text-white">Table View</TabsTrigger>
              <TabsTrigger value="cards" className="data-[state=active]:bg-primary text-white">Card View</TabsTrigger>
              <TabsTrigger value="platform" className="data-[state=active]:bg-primary text-white">By Platform</TabsTrigger>
            </TabsList>

            <TabsContent value="table">
              <Card className="cosmic-card">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10 hover:bg-white/5">
                          <TableHead className="text-white">
                            <div className="space-y-2">
                              <div>Platform</div>
                              <Input
                                placeholder="Filter platform..."
                                value={filters.platformFilter}
                                onChange={(e) => setFilters(prev => ({ ...prev, platformFilter: e.target.value }))}
                                className="bg-white/5 border-white/20 text-white text-xs h-7"
                              />
                            </div>
                          </TableHead>
                          <TableHead className="text-white">
                            <div className="space-y-2">
                              <div>Title</div>
                              <Input
                                placeholder="Filter title..."
                                value={filters.titleFilter}
                                onChange={(e) => setFilters(prev => ({ ...prev, titleFilter: e.target.value }))}
                                className="bg-white/5 border-white/20 text-white text-xs h-7"
                              />
                            </div>
                          </TableHead>
                          <TableHead className="text-white">
                            <div className="space-y-2">
                              <div>Status</div>
                              <Input
                                placeholder="Filter status..."
                                value={filters.statusFilter}
                                onChange={(e) => setFilters(prev => ({ ...prev, statusFilter: e.target.value }))}
                                className="bg-white/5 border-white/20 text-white text-xs h-7"
                              />
                            </div>
                          </TableHead>
                          <TableHead className="text-white">Media</TableHead>
                          <TableHead className="text-white">Created</TableHead>
                          <TableHead className="text-white">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPosts?.map((post) => {
                          const IconComponent = getPlatformIcon(post.platform_type);
                          return (
                            <TableRow key={post.id} className="border-white/10 hover:bg-white/5">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <IconComponent className="w-5 h-5" style={{ color: getPlatformColor(post.platform_type) }} />
                                  <span className="text-white capitalize">{post.platform_type}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-xs">
                                  <div className="text-white font-medium truncate">{post.title}</div>
                                  <div className="text-gray-400 text-sm truncate">{post.details?.substring(0, 60)}...</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const statusStyle = getStatusColor(post.status);
                                  return (
                                    <Select
                                      value={post.status || 'draft'}
                                      onValueChange={(value) => handleQuickStatusUpdate(post.id, value as PostStatus)}
                                    >
                                      <SelectTrigger
                                        className={`status-dropdown w-32 border ${statusStyle.className}`}
                                        style={statusStyle.style}
                                      >
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-gray-900 border-gray-700">
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="posted">Posted</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  );
                                })()}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {post.has_picture && <Image className="w-4 h-4 text-blue-400" />}
                                  {post.has_video && <Video className="w-4 h-4 text-purple-400" />}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-gray-400 text-sm">
                                  {post.created_date ? new Date(post.created_date).toLocaleDateString() : 'N/A'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <PostActionButton
                                    platform={post.platform_type}
                                    postContent={post.details || undefined}
                                    mediaUrl={post.has_picture || post.has_video || undefined}
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditPost(post)}
                                    className="border-white/20 text-white hover:bg-white/10"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeletePost(post.id)}
                                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cards">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts?.map((post) => {
                  const IconComponent = getPlatformIcon(post.platform_type);
                  const statusStyle = getStatusColor(post.status);
                  return (
                    <Card key={post.id} className="cosmic-card">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-5 h-5" style={{ color: getPlatformColor(post.platform_type) }} />
                            <Badge variant="outline" className="border-white/20 text-white capitalize">
                              {post.platform_type}
                            </Badge>
                          </div>
                          <Badge className={statusStyle.className} style={statusStyle.style}>
                            {post.status}
                          </Badge>
                        </div>
                        <CardTitle className="text-white text-lg">{post.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300 text-sm mb-4 line-clamp-3">{post.details}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            {post.has_picture && <Image className="w-4 h-4 text-blue-400" />}
                            {post.has_video && <Video className="w-4 h-4 text-purple-400" />}
                          </div>
                          <div className="flex gap-2">
                            <PostActionButton
                              platform={post.platform_type}
                              postContent={post.details || undefined}
                              mediaUrl={post.has_picture || post.has_video || undefined}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditPost(post)}
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeletePost(post.id)}
                              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="platform">
              <div className="space-y-6">
                {platforms.map((platform) => {
                  const platformPosts = groupedPosts[platform.id as PlatformType] || [];
                  if (platformPosts.length === 0 && (filters.platform !== 'all' && filters.platform !== platform.id)) {
                    return null;
                  }
                  const IconComponent = platform.icon;
                  return (
                    <Card key={platform.id} className="cosmic-card">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center text-white font-semibold`}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          {platform.name} ({platformPosts.length} posts)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {platformPosts.length > 0 ? (
                          <div className="grid md:grid-cols-2 gap-4">
                            {platformPosts.map((post) => {
                              const statusStyle = getStatusColor(post.status);
                              return (
                              <div key={post.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-white font-medium">{post.title}</h4>
                                  <Badge className={statusStyle.className} style={statusStyle.style}>
                                    {post.status}
                                  </Badge>
                                </div>
                                <p className="text-gray-300 text-sm mb-3 line-clamp-2">{post.details}</p>
                                <div className="flex items-center justify-between">
                                  <div className="flex gap-1">
                                    {post.has_picture && <Image className="w-4 h-4 text-blue-400" />}
                                    {post.has_video && <Video className="w-4 h-4 text-purple-400" />}
                                  </div>
                                  <div className="flex gap-2">
                                    <PostActionButton
                                      platform={post.platform_type}
                                      postContent={post.details || undefined}
                                      mediaUrl={post.has_picture || post.has_video || undefined}
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditPost(post)}
                                      className="border-white/20 text-white hover:bg-white/10"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeletePost(post.id)}
                                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-center py-4">No posts for this platform with current filters.</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
            </>
          ) : (
            /* Studio Library View - Same behavior as Media Studio: show all companies by default with toggle */
            <MediaLibrary
              onCreateNew={() => setViewMode('posts')}
              isStudioContext={true}
              onUseForGeneration={handleUseForGeneration}
              onContinueVideo={handleContinueVideo}
              onExtendVideo={handleExtendVideo}
              isContinuingVideo={isContinuingVideo}
              continueVideoProgress={continueVideoProgress}
            />
          )}
        </div>
      </div>

      <EditPostDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        post={selectedPost}
        onSave={handleSavePost}
        platforms={platforms.map(p => ({ ...p, icon: p.icon as any }))}
        isSaving={updatePostMutation.isPending}
        isImageUrl={isImageUrl}
      />

      {/* Posted Status Confirmation Dialog */}
      <AlertDialog open={postedConfirmDialog.isOpen} onOpenChange={(open) => !open && setPostedConfirmDialog({ isOpen: false, postId: null })}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-foreground">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              Multi-Platform Distribution
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-base leading-relaxed">
              <span className="block mb-3">
                Multi-platform auto-posting is currently in <span className="text-amber-500 font-semibold">testing phase</span> and will be available soon!
              </span>
              <span className="block">
                For now, you can manually create the post on your platform and mark it as posted here to track your content calendar.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary text-foreground border-border hover:bg-secondary/80">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPostedStatus}
              className="bg-gradient-to-r from-primary to-accent text-white hover:opacity-90"
            >
              Continue & Mark as Posted
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Post Confirmation Dialog */}
      <AlertDialog open={deleteConfirmDialog.isOpen} onOpenChange={(open) => !open && setDeleteConfirmDialog({ isOpen: false, postId: null })}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-foreground">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              Delete Post
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-base leading-relaxed">
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary text-foreground border-border hover:bg-secondary/80">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePost}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PostManager;
