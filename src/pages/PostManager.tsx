
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Eye, Filter, Plus, Calendar, Image, Video } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Post = Database['public']['Tables']['posts']['Row'];
type PostStatus = Database['public']['Enums']['post_status'];
type PlatformType = Database['public']['Enums']['platform_type'];

const PostManager = () => {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    platform: 'all',
    status: 'all',
    search: ''
  });

  const queryClient = useQueryClient();

  // Fetch all posts
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['posts', filters],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select('*')
        .eq('company_id', '7f9e0135-eb5c-4157-a0af-892f712502ea')
        .order('created_date', { ascending: false });

      if (filters.platform !== 'all') {
        query = query.eq('platform_type', filters.platform);
      }
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,details.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: async (updatedPost: Partial<Post> & { id: string }) => {
      const { data, error } = await supabase
        .from('posts')
        .update(updatedPost)
        .eq('id', updatedPost.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({
        title: "Post Updated! ✨",
        description: "Post has been successfully updated."
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

  // Delete post mutation
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
        description: "Post has been successfully deleted."
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
    { id: 'instagram', name: 'Instagram', icon: '📸', color: 'from-pink-500 to-purple-600' },
    { id: 'facebook', name: 'Facebook', icon: '👥', color: 'from-blue-600 to-blue-700' },
    { id: 'twitter', name: 'Twitter', icon: '🐦', color: 'from-sky-400 to-sky-600' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: 'from-blue-700 to-blue-800' }
  ];

  const getStatusColor = (status: PostStatus) => {
    switch (status) {
      case 'draft': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'approved': return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'posted': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    }
  };

  const getPlatformIcon = (platform: PlatformType) => {
    return platforms.find(p => p.id === platform)?.icon || '📱';
  };

  const handleEditPost = (post: Post) => {
    setSelectedPost(post);
    setIsEditDialogOpen(true);
  };

  const handleSavePost = (formData: FormData) => {
    if (!selectedPost) return;

    const updatedPost = {
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
    if (confirm('Are you sure you want to delete this post?')) {
      deletePostMutation.mutate(postId);
    }
  };

  const handleQuickStatusUpdate = (postId: string, newStatus: PostStatus) => {
    updatePostMutation.mutate({ id: postId, status: newStatus });
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

  const groupedPosts = posts?.reduce((acc, post) => {
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
              Post <span className="text-cosmic font-serif">Manager</span>
            </h1>
            <p className="text-gray-300 text-lg">
              Manage all your social media content in one place
            </p>
          </div>

          {/* Filters */}
          <Card className="cosmic-card mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-white">Search</Label>
                  <Input
                    placeholder="Search posts..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Platform</Label>
                  <Select value={filters.platform} onValueChange={(value) => setFilters(prev => ({ ...prev, platform: value }))}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="all">All Platforms</SelectItem>
                      {platforms.map(platform => (
                        <SelectItem key={platform.id} value={platform.id}>
                          {platform.icon} {platform.name}
                        </SelectItem>
                      ))}
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
                  <Button 
                    onClick={() => setFilters({ platform: 'all', status: 'all', search: '' })}
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="cosmic-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{posts?.length || 0}</div>
                <div className="text-gray-300 text-sm">Total Posts</div>
              </CardContent>
            </Card>
            <Card className="cosmic-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{posts?.filter(p => p.status === 'draft').length || 0}</div>
                <div className="text-gray-300 text-sm">Drafts</div>
              </CardContent>
            </Card>
            <Card className="cosmic-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{posts?.filter(p => p.status === 'approved').length || 0}</div>
                <div className="text-gray-300 text-sm">Approved</div>
              </CardContent>
            </Card>
            <Card className="cosmic-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{posts?.filter(p => p.status === 'posted').length || 0}</div>
                <div className="text-gray-300 text-sm">Posted</div>
              </CardContent>
            </Card>
          </div>

          {/* Posts Table */}
          <Tabs defaultValue="table" className="space-y-6">
            <TabsList className="bg-white/10 border-white/20">
              <TabsTrigger value="table" className="data-[state=active]:bg-primary">Table View</TabsTrigger>
              <TabsTrigger value="cards" className="data-[state=active]:bg-primary">Card View</TabsTrigger>
              <TabsTrigger value="platform" className="data-[state=active]:bg-primary">By Platform</TabsTrigger>
            </TabsList>

            <TabsContent value="table">
              <Card className="cosmic-card">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10 hover:bg-white/5">
                          <TableHead className="text-white">Platform</TableHead>
                          <TableHead className="text-white">Title</TableHead>
                          <TableHead className="text-white">Status</TableHead>
                          <TableHead className="text-white">Media</TableHead>
                          <TableHead className="text-white">Created</TableHead>
                          <TableHead className="text-white">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {posts?.map((post) => (
                          <TableRow key={post.id} className="border-white/10 hover:bg-white/5">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{getPlatformIcon(post.platform_type)}</span>
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
                                <SelectTrigger className={`w-32 border ${getStatusColor(post.status || 'draft')}`}>
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
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cards">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts?.map((post) => (
                  <Card key={post.id} className="cosmic-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getPlatformIcon(post.platform_type)}</span>
                          <Badge variant="outline" className="border-white/20 text-white">
                            {post.platform_type}
                          </Badge>
                        </div>
                        <Badge className={getStatusColor(post.status || 'draft')}>
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
                ))}
              </div>
            </TabsContent>

            <TabsContent value="platform">
              <div className="space-y-6">
                {platforms.map((platform) => {
                  const platformPosts = groupedPosts[platform.id as PlatformType] || [];
                  return (
                    <Card key={platform.id} className="cosmic-card">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center text-white font-semibold`}>
                            {platform.icon}
                          </div>
                          {platform.name} ({platformPosts.length} posts)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                          {platformPosts.map((post) => (
                            <div key={post.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-white font-medium">{post.title}</h4>
                                <Badge className={getStatusColor(post.status || 'draft')}>
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
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Post Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="cosmic-card max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Post</DialogTitle>
            <DialogDescription className="text-gray-300">
              Make changes to your post content and settings.
            </DialogDescription>
          </DialogHeader>
          {selectedPost && (
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSavePost(new FormData(e.currentTarget));
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Platform</Label>
                  <Select name="platform_type" defaultValue={selectedPost.platform_type}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      {platforms.map(platform => (
                        <SelectItem key={platform.id} value={platform.id}>
                          {platform.icon} {platform.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white">Status</Label>
                  <Select name="status" defaultValue={selectedPost.status || 'draft'}>
                    <SelectTrigger className="bg-white/5 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="posted">Posted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-white">Title</Label>
                <Input
                  name="title"
                  defaultValue={selectedPost.title}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Content</Label>
                <Textarea
                  name="details"
                  defaultValue={selectedPost.details || ''}
                  className="bg-white/5 border-white/20 text-white min-h-[120px]"
                />
              </div>
              <div>
                <Label className="text-white">Image Description</Label>
                <Input
                  name="has_picture"
                  defaultValue={selectedPost.has_picture || ''}
                  placeholder="Describe the image/visual content"
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Video Description</Label>
                <Input
                  name="has_video"
                  defaultValue={selectedPost.has_video || ''}
                  placeholder="Describe the video content"
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={updatePostMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {updatePostMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PostManager;
