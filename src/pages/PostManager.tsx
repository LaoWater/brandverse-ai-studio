import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Textarea removed as it's now in EditPostDialog
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Dialog related imports removed as they are in EditPostDialog
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Eye, Filter, Plus, Calendar, Image, Video, Instagram, Facebook, Twitter, Linkedin, Search, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { EditPostDialog } from "@/components/EditPostDialog"; // Adjust path if needed
import { FaXTwitter } from "react-icons/fa6";


type Post = Database['public']['Tables']['posts']['Row'];
type PostStatus = Database['public']['Enums']['post_status'];
type PlatformType = Database['public']['Enums']['platform_type'];

const PostManager = () => {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    platform: 'all',
    status: 'all',
    search: '',
    titleFilter: '',
    detailsFilter: '', // Retained for potential future use, though not directly in table headers
    platformFilter: '',
    statusFilter: ''
  });

  const queryClient = useQueryClient();

  const { data: allPosts, isLoading, error } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('company_id', '7f9e0135-eb5c-4157-a0af-892f712502ea') // Replace with dynamic company_id if needed
        .order('created_date', { ascending: false });

      if (error) throw error;
      return data;
    }
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
      
      const matchesDetails = !filters.detailsFilter || // Kept for consistency, not directly used in visible table filters
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
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({
        title: "Post Updated! ✨",
        description: "Post has been successfully updated.",
        className: "bg-primary/90 border-primary text-white"
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
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({
        title: "Post Deleted",
        description: "Post has been successfully deleted.",
        className: "bg-primary/90 border-primary text-white"
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

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'from-pink-500 to-purple-600' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'from-blue-600 to-blue-700' },
    { id: 'twitter', name: 'Twitter', icon: FaXTwitter, color: 'from-sky-400 to-sky-600' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'from-blue-700 to-blue-800' }
  ];

  const getStatusColor = (status: PostStatus | null | undefined) => { // Allow null/undefined for status
    switch (status) {
      case 'draft': return 'bg-yellow-500 text-yellow-900 border-yellow-500 shadow-lg shadow-yellow-500/20 font-semibold';
      case 'approved': return 'bg-green-500 text-green-900 border-green-500 shadow-lg shadow-green-500/20 font-semibold';
      case 'posted': return 'bg-primary text-white border-primary shadow-lg shadow-primary/20 font-semibold';
      default: return 'bg-gray-500 text-gray-900 border-gray-500 shadow-lg shadow-gray-500/20 font-semibold';
    }
  };

  const getPlatformIcon = (platform: PlatformType) => {
    const platformData = platforms.find(p => p.id === platform);
    return platformData ? platformData.icon : Instagram; // Default to Instagram icon
  };

  const handleEditPost = (post: Post) => {
    setSelectedPost(post);
    setIsEditDialogOpen(true);
  };

  const handleSavePost = (formData: FormData) => {
    if (!selectedPost) return;

    // This logic replicates the original behavior where `has_video` might be nulled
    // if a 'has_video' form field isn't present.
    // The EditPostDialog currently only has an input named 'has_picture'.
    const updatedPost: Partial<Post> & { id: string } = {
      id: selectedPost.id,
      title: formData.get('title') as string,
      details: formData.get('details') as string,
      status: formData.get('status') as PostStatus,
      platform_type: formData.get('platform_type') as PlatformType,
      has_picture: formData.get('has_picture') as string || null,
      has_video: formData.get('has_video') as string || null, // formData.get('has_video') will be null
                                                              // as there's no input named 'has_video'
    };

    updatePostMutation.mutate(updatedPost);
  };

  const handleDeletePost = (postId: string) => {
    // Consider adding a confirmation dialog here instead of window.confirm
    // For now, keeping original confirm
    if (confirm('Are you sure you want to delete this post?')) {
      deletePostMutation.mutate(postId);
    }
  };

  const handleQuickStatusUpdate = (postId: string, newStatus: PostStatus) => {
    updatePostMutation.mutate({ id: postId, status: newStatus });
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

  const isImageUrl = (url: string | null): url is string => { // Type guard
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url) || url.includes('image') || url.includes('img');
  };

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
    if (!post.platform_type) return acc; // Skip if platform_type is null
    if (!acc[post.platform_type]) {
      acc[post.platform_type] = [];
    }
    acc[post.platform_type].push(post);
    return acc;
  }, {} as Record<PlatformType, Post[]>) || {};

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Post <span className="text-cosmic font-serif">Library</span>
            </h1>
            <p className="text-gray-300 text-lg">
              Manage all your social media content in one place
            </p>
          </div>

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
                    <Input // Removed Search icon from input as it's often handled by placeholder or external icon
                      placeholder="Search posts..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="bg-white/5 border-white/20 text-white" // Removed pl-10 if icon is removed
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
                              <IconComponent className="w-4 h-4" />
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
            <TabsList className="bg-white/10 border-white/20">
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
                                  <IconComponent className="w-5 h-5 text-white" />
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
                                <Select 
                                  value={post.status || 'draft'} 
                                  onValueChange={(value) => handleQuickStatusUpdate(post.id, value as PostStatus)}
                                >
                                  <SelectTrigger className={`w-32 border ${getStatusColor(post.status)}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-900 border-gray-700">
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="posted">Posted</SelectItem>
                                  </SelectContent>
                                </Select>
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
                  return (
                    <Card key={post.id} className="cosmic-card">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-5 h-5 text-white" />
                            <Badge variant="outline" className="border-white/20 text-white capitalize">
                              {post.platform_type}
                            </Badge>
                          </div>
                          <Badge className={getStatusColor(post.status)}>
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
                     // Don't render platform card if it's filtered out and has no posts
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
                            {platformPosts.map((post) => (
                              <div key={post.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-white font-medium">{post.title}</h4>
                                  <Badge className={getStatusColor(post.status)}>
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
                            ))}
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
        </div>
      </div>

      <EditPostDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        post={selectedPost}
        onSave={handleSavePost}
        platforms={platforms}
        isSaving={updatePostMutation.isPending}
        isImageUrl={isImageUrl}
      />
    </div>
  );
};

export default PostManager;