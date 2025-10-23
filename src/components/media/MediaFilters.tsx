import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { MediaFilters as Filters } from '@/services/mediaStudioService';
import { Label } from '@/components/ui/label';

interface MediaFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  resultsCount: number;
}

const MediaFiltersComponent = ({
  filters,
  onFiltersChange,
  resultsCount,
}: MediaFiltersProps) => {
  const [searchInput, setSearchInput] = useState(filters.searchQuery || '');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    onFiltersChange({ ...filters, searchQuery: value || undefined });
  };

  const handleFileTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      fileType: value as 'video' | 'image' | 'all',
    });
  };

  const handleFavoriteFilter = (value: string) => {
    onFiltersChange({
      ...filters,
      isFavorite: value === 'favorites' ? true : undefined,
    });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-') as [
      'created_at' | 'updated_at' | 'download_count' | 'view_count',
      'asc' | 'desc'
    ];
    onFiltersChange({ ...filters, sortBy, sortOrder });
  };

  const handleModelFilter = (value: string) => {
    onFiltersChange({
      ...filters,
      model: value === 'all' ? undefined : value,
    });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    onFiltersChange({
      fileType: 'all',
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
  };

  const activeFiltersCount = [
    filters.searchQuery,
    filters.fileType !== 'all' ? filters.fileType : null,
    filters.isFavorite,
    filters.model,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Main filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search your media..."
            className="pl-10 bg-background/50 border-primary/20 text-white placeholder:text-gray-500"
          />
          {searchInput && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* File Type Filter */}
        <Select
          value={filters.fileType || 'all'}
          onValueChange={handleFileTypeChange}
        >
          <SelectTrigger className="w-full sm:w-[140px] bg-background/50 border-primary/20 text-white">
            <SelectValue placeholder="All Media" />
          </SelectTrigger>
          <SelectContent className="bg-card border-primary/20">
            <SelectItem value="all" className="text-white hover:bg-white/10">
              All Media
            </SelectItem>
            <SelectItem value="image" className="text-white hover:bg-white/10">
              Images
            </SelectItem>
            <SelectItem value="video" className="text-white hover:bg-white/10">
              Videos
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={`${filters.sortBy || 'created_at'}-${filters.sortOrder || 'desc'}`}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-full sm:w-[160px] bg-background/50 border-primary/20 text-white">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-card border-primary/20">
            <SelectItem value="created_at-desc" className="text-white hover:bg-white/10">
              Newest First
            </SelectItem>
            <SelectItem value="created_at-asc" className="text-white hover:bg-white/10">
              Oldest First
            </SelectItem>
            <SelectItem value="view_count-desc" className="text-white hover:bg-white/10">
              Most Viewed
            </SelectItem>
            <SelectItem value="download_count-desc" className="text-white hover:bg-white/10">
              Most Downloaded
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters */}
        <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="relative border-primary/30 hover:border-primary/50 text-white"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-accent border-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-card border-primary/20 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Advanced Filters</h3>
                <Button
                  onClick={clearAllFilters}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Clear All
                </Button>
              </div>

              {/* Favorites Filter */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-300">Show</Label>
                <Select
                  value={filters.isFavorite ? 'favorites' : 'all'}
                  onValueChange={handleFavoriteFilter}
                >
                  <SelectTrigger className="w-full bg-background/50 border-primary/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-primary/20">
                    <SelectItem value="all" className="text-white hover:bg-white/10">
                      All Media
                    </SelectItem>
                    <SelectItem value="favorites" className="text-white hover:bg-white/10">
                      Favorites Only
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Model Filter */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-300">AI Model</Label>
                <Select
                  value={filters.model || 'all'}
                  onValueChange={handleModelFilter}
                >
                  <SelectTrigger className="w-full bg-background/50 border-primary/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-primary/20">
                    <SelectItem value="all" className="text-white hover:bg-white/10">
                      All Models
                    </SelectItem>
                    <SelectItem value="imagen-4" className="text-white hover:bg-white/10">
                      Google Imagen 4
                    </SelectItem>
                    <SelectItem value="veo-3.1" className="text-white hover:bg-white/10">
                      Google Veo 3.1
                    </SelectItem>
                    <SelectItem value="sora-2" className="text-white hover:bg-white/10">
                      OpenAI Sora 2
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>
          {resultsCount} {resultsCount === 1 ? 'result' : 'results'} found
        </span>
        {activeFiltersCount > 0 && (
          <Button
            onClick={clearAllFilters}
            variant="ghost"
            size="sm"
            className="text-xs text-gray-400 hover:text-white h-auto p-0"
          >
            Clear all filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default MediaFiltersComponent;
