import { useState, useCallback, useRef, useEffect } from 'react';
import { Film, Plus, Download, Trash2, Play, Pause, SkipBack, Volume2, VolumeX, Save, FolderOpen, Cloud, CloudOff, Pencil, ArrowLeft, Scissors, Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import type { EditorClip, PlaybackState, ExportState } from '@/types/editor';
import { getEffectiveDuration, getClipEndTime } from '@/types/editor';
import { ClipSelector } from './ClipSelector';
import { EditorTimeline } from './EditorTimeline';
import { ExportModal } from './ExportModal';
import { ProjectsLibrary } from './ProjectsLibrary';
import { exportProject, downloadBlob, saveExportToLibrary } from '@/services/videoEditorService';
import type { ExportDestination } from './ExportModal';
import {
  createProject,
  updateProject,
  getProject,
  EditorProject,
} from '@/services/editorProjectService';
import type { MediaFile } from '@/services/mediaStudioService';

type EditorMode = 'projects' | 'editing';

interface VideoEditorProps {
  onBack?: () => void;
  projectId?: string; // If provided, load existing project
  onProjectChange?: (projectId: string | null) => void;
}

export const VideoEditor = ({ onBack, projectId: initialProjectId, onProjectChange }: VideoEditorProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // View mode: 'projects' shows list, 'editing' shows the actual editor
  const [editorMode, setEditorMode] = useState<EditorMode>(initialProjectId ? 'editing' : 'projects');

  // Editor state
  const [clips, setClips] = useState<EditorClip[]>([]);
  const [playback, setPlayback] = useState<PlaybackState>({
    playing: false,
    currentTime: 0,
    activeClipId: null,
  });
  const [exportState, setExportState] = useState<ExportState>({
    exporting: false,
    progress: 0,
    stage: 'idle',
    error: null,
  });

  // Project state
  const [currentProject, setCurrentProject] = useState<EditorProject | null>(null);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // UI state
  const [showClipSelector, setShowClipSelector] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  // History state for Undo/Redo
  const [history, setHistory] = useState<EditorClip[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoRef = useRef(false); // Flag to prevent history push during undo/redo
  const isDraggingRef = useRef(false); // Flag to track if we're in a drag operation
  const preDragStateRef = useRef<EditorClip[] | null>(null); // State before drag started
  const MAX_HISTORY = 50; // Maximum history entries

  // Load existing project if projectId provided
  useEffect(() => {
    if (initialProjectId) {
      loadProject(initialProjectId);
    }
  }, [initialProjectId]);

  // Push to history when clips change (except during undo/redo)
  useEffect(() => {
    // Skip if this is an undo/redo operation
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    // Skip during drag operations - we'll handle history on drag end
    if (isDraggingRef.current) {
      return;
    }

    // Skip empty state or if clips haven't actually changed
    if (clips.length === 0 && history.length === 0) return;

    // Check if clips are different from current history position
    const currentHistoryState = history[historyIndex];
    if (currentHistoryState && JSON.stringify(currentHistoryState) === JSON.stringify(clips)) {
      return; // No actual change
    }

    // Push new state to history
    setHistory(prev => {
      // Remove any redo states (everything after current index)
      const newHistory = prev.slice(0, historyIndex + 1);
      // Add current state
      newHistory.push([...clips]);
      // Limit history size
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [clips]);

  // Undo handler
  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return; // Nothing to undo

    isUndoRedoRef.current = true;
    const previousState = history[historyIndex - 1];
    setClips(previousState ? [...previousState] : []);
    setHistoryIndex(prev => prev - 1);

    toast({
      title: 'Undo',
      description: 'Reverted to previous state.',
    });
  }, [history, historyIndex, toast]);

  // Redo handler
  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return; // Nothing to redo

    isUndoRedoRef.current = true;
    const nextState = history[historyIndex + 1];
    setClips(nextState ? [...nextState] : []);
    setHistoryIndex(prev => prev + 1);

    toast({
      title: 'Redo',
      description: 'Restored next state.',
    });
  }, [history, historyIndex, toast]);

  // Keyboard shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          // Ctrl+Shift+Z or Cmd+Shift+Z = Redo
          handleRedo();
        } else {
          // Ctrl+Z or Cmd+Z = Undo
          handleUndo();
        }
      }
      // Ctrl+Y for Redo (Windows alternative)
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Check if undo/redo are available
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Load a project from database
  const loadProject = async (id: string) => {
    const project = await getProject(id);
    if (project) {
      setCurrentProject(project);
      setProjectName(project.name);
      setClips(project.project_data.clips || []);
      setLastSaved(new Date(project.updated_at));
      setHasUnsavedChanges(false);
      setEditorMode('editing');

      // Reset history for loaded project
      setHistory([project.project_data.clips || []]);
      setHistoryIndex(0);

      // Load first clip into video player
      if (project.project_data.clips?.length > 0 && videoRef.current) {
        const firstClip = project.project_data.clips[0];
        videoRef.current.src = firstClip.sourceUrl;
        videoRef.current.load();
        setPlayback({
          playing: false,
          currentTime: 0,
          activeClipId: firstClip.id,
        });
      }

      toast({
        title: 'Project Loaded',
        description: `"${project.name}" has been loaded.`,
      });
    }
  };

  // Start a new project
  const handleCreateNew = () => {
    // Reset all state for new project
    setCurrentProject(null);
    setProjectName('Untitled Project');
    setClips([]);
    setPlayback({
      playing: false,
      currentTime: 0,
      activeClipId: null,
    });
    setHasUnsavedChanges(false);
    setLastSaved(null);
    setEditorMode('editing');

    // Reset history for new project
    setHistory([]);
    setHistoryIndex(-1);
  };

  // Go back to projects list
  const handleBackToProjects = () => {
    setEditorMode('projects');
  };

  // Auto-save when clips change (debounced)
  useEffect(() => {
    if (!user || clips.length === 0) return;

    setHasUnsavedChanges(true);

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new auto-save timeout (3 seconds after last change)
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveProject();
    }, 3000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [clips, user]);

  // Save project to database
  const saveProject = async () => {
    if (!user || clips.length === 0) return;

    setIsSaving(true);

    try {
      if (currentProject) {
        // Update existing project
        const updated = await updateProject(currentProject.id, {
          name: projectName,
          clips,
        });
        if (updated) {
          setCurrentProject(updated);
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
        }
      } else {
        // Create new project
        const created = await createProject(
          user.id,
          selectedCompany?.id || null,
          projectName,
          clips
        );
        if (created) {
          setCurrentProject(created);
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
          onProjectChange?.(created.id);

          toast({
            title: 'Project Saved',
            description: 'Your project has been saved.',
            className: 'bg-green-600/90 border-green-600 text-white',
          });
        }
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Manual save
  const handleManualSave = async () => {
    await saveProject();
    if (!hasUnsavedChanges) {
      toast({
        title: 'Saved',
        description: 'Project saved successfully.',
      });
    }
  };

  // Update project name
  const handleNameChange = async (newName: string) => {
    setProjectName(newName);
    setIsEditingName(false);

    if (currentProject) {
      await updateProject(currentProject.id, { name: newName });
    }
  };

  // Calculate total timeline duration
  const totalDuration = clips.length > 0
    ? Math.max(...clips.map(clip => getClipEndTime(clip)))
    : 0;

  // Find which clip is active at current time
  const findActiveClip = useCallback((time: number): EditorClip | null => {
    for (const clip of clips) {
      const clipEnd = getClipEndTime(clip);
      if (time >= clip.startTime && time < clipEnd) {
        return clip;
      }
    }
    return null;
  }, [clips]);

  // Update video source when active clip changes
  useEffect(() => {
    const activeClip = findActiveClip(playback.currentTime);

    if (!videoRef.current) return;

    if (activeClip) {
      if (playback.activeClipId !== activeClip.id) {
        // New clip, load it
        console.log('[VideoEditor] Loading clip:', activeClip.id, activeClip.sourceUrl);
        videoRef.current.src = activeClip.sourceUrl;
        videoRef.current.load();

        // Wait for video to be ready before seeking
        const handleLoadedMetadata = () => {
          if (videoRef.current) {
            // Seek to the trimStart position (beginning of the trimmed content)
            const clipLocalTime = playback.currentTime - activeClip.startTime + activeClip.trimStart;
            const clampedTime = Math.max(activeClip.trimStart, clipLocalTime);
            videoRef.current.currentTime = clampedTime;
            console.log('[VideoEditor] Video loaded, seeking to:', clampedTime);
          }
        };

        videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });

        setPlayback(prev => ({ ...prev, activeClipId: activeClip.id }));
      }
    } else if (clips.length > 0) {
      // No active clip at current time, but we have clips - load the first one for preview
      const firstClip = clips[0];
      if (videoRef.current.src !== firstClip.sourceUrl) {
        videoRef.current.src = firstClip.sourceUrl;
        videoRef.current.load();

        // Seek to trimStart for preview
        videoRef.current.addEventListener('loadedmetadata', () => {
          if (videoRef.current) {
            videoRef.current.currentTime = firstClip.trimStart;
          }
        }, { once: true });
      }
    }
  }, [playback.currentTime, playback.activeClipId, findActiveClip, clips]);

  // Monitor video timeupdate to enforce trim boundaries during playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!playback.playing) return;

      const activeClip = findActiveClip(playback.currentTime);
      if (!activeClip) return;

      const trimEndBoundary = activeClip.sourceDuration - activeClip.trimEnd;

      // If video has reached or passed the trim end boundary, pause it
      // The playback animation loop will handle advancing to the next clip
      if (video.currentTime >= trimEndBoundary - 0.05) {
        video.pause();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [playback.playing, playback.currentTime, findActiveClip]);

  // Playback animation loop
  useEffect(() => {
    if (!playback.playing) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      setPlayback(prev => {
        const newTime = prev.currentTime + delta;

        // Check if we've reached the end
        if (newTime >= totalDuration) {
          return { ...prev, currentTime: 0, playing: false };
        }

        return { ...prev, currentTime: newTime };
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [playback.playing, totalDuration]);

  // Sync video element with playback - respect trim boundaries
  useEffect(() => {
    if (!videoRef.current) return;

    const activeClip = findActiveClip(playback.currentTime);
    if (!activeClip) {
      videoRef.current.pause();
      return;
    }

    // Calculate the local time within the clip (accounting for trim)
    const clipLocalTime = playback.currentTime - activeClip.startTime + activeClip.trimStart;
    // Calculate the trim end boundary (where the video should stop for this clip)
    const trimEndBoundary = activeClip.sourceDuration - activeClip.trimEnd;

    if (playback.playing) {
      // Ensure video doesn't play past the trim end
      if (clipLocalTime >= trimEndBoundary) {
        // We've reached the end of this clip's trimmed content
        // The playback animation loop will advance to the next clip
        return;
      }
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      // Clamp the seek position within trim boundaries
      const clampedTime = Math.max(activeClip.trimStart, Math.min(clipLocalTime, trimEndBoundary));
      videoRef.current.currentTime = clampedTime;
    }
  }, [playback.playing, playback.currentTime, findActiveClip]);

  // Handle adding clips from library
  const handleAddClips = useCallback((mediaFiles: MediaFile[]) => {
    const newClips: EditorClip[] = mediaFiles.map((media, index) => {
      // Calculate start time (add to end of timeline)
      const existingDuration = clips.length > 0
        ? Math.max(...clips.map(c => getClipEndTime(c)))
        : 0;

      // Sum durations of previously added clips in this batch
      const batchDuration = mediaFiles.slice(0, index).reduce((sum, m) => sum + (m.duration || 8), 0);

      console.log('[VideoEditor] Adding clip:', media.file_name, 'url:', media.public_url);

      return {
        id: `clip_${Date.now()}_${index}`,
        mediaFileId: media.id,
        sourceUrl: media.public_url,
        thumbnailUrl: media.thumbnail_url,
        fileName: media.file_name,
        sourceDuration: media.duration || 8, // Default to 8s if unknown
        startTime: existingDuration + batchDuration,
        trimStart: 0,
        trimEnd: 0,
      };
    });

    setClips(prev => {
      const allClips = [...prev, ...newClips];

      // If this is the first clip(s) being added, load the first one immediately
      if (prev.length === 0 && newClips.length > 0 && videoRef.current) {
        const firstClip = newClips[0];
        console.log('[VideoEditor] First clip added, loading:', firstClip.sourceUrl);
        videoRef.current.src = firstClip.sourceUrl;
        videoRef.current.load();

        // Update playback state to point to first clip
        setPlayback({
          playing: false,
          currentTime: 0,
          activeClipId: firstClip.id,
        });
      }

      return allClips;
    });
    setShowClipSelector(false);

    toast({
      title: 'Clips Added',
      description: `Added ${newClips.length} clip${newClips.length > 1 ? 's' : ''} to timeline`,
    });
  }, [clips, toast]);

  // Handle timeline changes (reorder, trim)
  const handleTimelineChange = useCallback((updatedClips: EditorClip[]) => {
    setClips(updatedClips);
  }, []);

  // Called when drag/resize starts - save current state for undo
  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
    preDragStateRef.current = [...clips];
  }, [clips]);

  // Called when drag/resize ends - commit the change to history
  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;

    // Only add to history if state actually changed
    const preDragState = preDragStateRef.current;
    if (preDragState && JSON.stringify(preDragState) !== JSON.stringify(clips)) {
      // Push pre-drag state to history (so undo goes back to before the drag)
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        // First ensure pre-drag state is in history
        if (newHistory.length === 0 || JSON.stringify(newHistory[newHistory.length - 1]) !== JSON.stringify(preDragState)) {
          newHistory.push([...preDragState]);
        }
        // Then add current (post-drag) state
        newHistory.push([...clips]);
        // Limit history size
        while (newHistory.length > MAX_HISTORY) {
          newHistory.shift();
        }
        return newHistory;
      });
      setHistoryIndex(prev => Math.min(prev + 2, MAX_HISTORY - 1));
    }

    preDragStateRef.current = null;
  }, [clips, historyIndex]);

  // Handle clip deletion
  const handleDeleteClip = useCallback((clipId: string) => {
    setClips(prev => {
      const filtered = prev.filter(c => c.id !== clipId);
      // Recalculate start times to close gaps
      let currentStart = 0;
      return filtered.map(clip => {
        const newClip = { ...clip, startTime: currentStart };
        currentStart += getEffectiveDuration(clip);
        return newClip;
      });
    });
  }, []);

  // Handle clip split at playhead
  const handleSplitClip = useCallback((clipId: string) => {
    const clipToSplit = clips.find(c => c.id === clipId);
    if (!clipToSplit) return;

    // Calculate where in the clip the playhead is
    const clipLocalTime = playback.currentTime - clipToSplit.startTime;
    const effectiveDuration = getEffectiveDuration(clipToSplit);

    // Only split if playhead is within the clip (not at the very start or end)
    if (clipLocalTime <= 0.1 || clipLocalTime >= effectiveDuration - 0.1) {
      toast({
        title: 'Cannot Split',
        description: 'Move the playhead to a position within the clip to split.',
        variant: 'destructive',
      });
      return;
    }

    // Create two clips from the original
    const sourceTimeAtPlayhead = clipToSplit.trimStart + clipLocalTime;

    // First clip: from trimStart to playhead position
    const firstClip: EditorClip = {
      ...clipToSplit,
      id: `${clipToSplit.id}_a`,
      trimEnd: clipToSplit.sourceDuration - sourceTimeAtPlayhead, // Trim everything after the split point
    };

    // Second clip: from playhead position to trimEnd
    const secondClip: EditorClip = {
      ...clipToSplit,
      id: `${clipToSplit.id}_b`,
      trimStart: sourceTimeAtPlayhead, // Start from the split point
      startTime: clipToSplit.startTime + clipLocalTime, // Position after the first clip
    };

    // Replace the original clip with the two new clips
    setClips(prev => {
      const clipIndex = prev.findIndex(c => c.id === clipId);
      const newClips = [...prev];
      newClips.splice(clipIndex, 1, firstClip, secondClip);

      // Recalculate start times to ensure proper sequencing
      let currentStart = 0;
      return newClips.map(clip => {
        const newClip = { ...clip, startTime: currentStart };
        currentStart += getEffectiveDuration(clip);
        return newClip;
      });
    });

    toast({
      title: 'Clip Split',
      description: 'The clip has been split at the playhead position.',
    });
  }, [clips, playback.currentTime, toast]);

  // Handle seek
  const handleSeek = useCallback((time: number) => {
    setPlayback(prev => ({
      ...prev,
      currentTime: Math.max(0, Math.min(time, totalDuration)),
    }));
  }, [totalDuration]);

  // Toggle play/pause
  const togglePlayback = useCallback(() => {
    if (clips.length === 0) return;

    setPlayback(prev => {
      // If at end, restart
      if (!prev.playing && prev.currentTime >= totalDuration) {
        return { ...prev, playing: true, currentTime: 0 };
      }
      return { ...prev, playing: !prev.playing };
    });
  }, [clips.length, totalDuration]);

  // Reset to beginning
  const handleReset = useCallback(() => {
    setPlayback(prev => ({
      ...prev,
      currentTime: 0,
      playing: false,
    }));
  }, []);

  // Clear all clips
  const handleClearAll = useCallback(() => {
    setClips([]);
    setPlayback({
      playing: false,
      currentTime: 0,
      activeClipId: null,
    });
  }, []);

  // Open export modal (shows options first)
  const handleExport = useCallback(() => {
    if (clips.length === 0) {
      toast({
        title: 'No Clips',
        description: 'Add some clips to the timeline before exporting.',
        variant: 'destructive',
      });
      return;
    }

    // Reset export state and show options
    setExportState({
      exporting: false,
      progress: 0,
      stage: 'idle',
      error: null,
    });
    setShowExportModal(true);
  }, [clips, toast]);

  // Start the actual export process
  const handleStartExport = useCallback(async (destination: ExportDestination) => {
    console.log('[VideoEditor] Starting export with destination:', destination);

    setExportState({
      exporting: true,
      progress: 0,
      stage: 'preparing',
      error: null,
    });

    try {
      const blob = await exportProject(clips, (progress, stage, message) => {
        console.log('[VideoEditor] Export progress:', progress, stage, message);
        setExportState(prev => ({
          ...prev,
          progress: stage === 'uploading' ? 95 : progress,
          stage,
          error: null,
        }));
      });

      console.log('[VideoEditor] Export blob created, size:', blob.size);

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `${projectName.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.mp4`;

      // Handle download
      if (destination === 'download' || destination === 'both') {
        console.log('[VideoEditor] Downloading file:', filename);
        downloadBlob(blob, filename);
      }

      // Handle save to library
      if ((destination === 'library' || destination === 'both') && user) {
        setExportState(prev => ({
          ...prev,
          progress: 95,
          stage: 'uploading',
        }));

        console.log('[VideoEditor] Saving to library...');
        await saveExportToLibrary(
          blob,
          user.id,
          selectedCompany?.id || null,
          projectName,
          totalDuration,
          (msg) => console.log('[VideoEditor] Upload:', msg)
        );
      }

      setExportState(prev => ({
        ...prev,
        exporting: false,
        progress: 100,
        stage: 'complete',
      }));

      const successMessage = destination === 'download'
        ? 'Your video has been downloaded.'
        : destination === 'library'
        ? 'Your video has been saved to your library.'
        : 'Your video has been downloaded and saved to your library.';

      toast({
        title: 'Export Complete!',
        description: successMessage,
        className: 'bg-green-600/90 border-green-600 text-white',
      });
    } catch (error: any) {
      console.error('[VideoEditor] Export failed:', error);
      setExportState(prev => ({
        ...prev,
        exporting: false,
        stage: 'error',
        error: error.message || 'Export failed',
      }));

      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export video. Please try again.',
        variant: 'destructive',
      });
    }
  }, [clips, user, selectedCompany, projectName, totalDuration, toast]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get active clip for preview
  const activeClip = findActiveClip(playback.currentTime);

  // Format last saved time
  const formatLastSaved = () => {
    if (!lastSaved) return null;
    const diff = Date.now() - lastSaved.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return lastSaved.toLocaleTimeString();
  };

  // Show Projects Library view
  if (editorMode === 'projects') {
    return (
      <ProjectsLibrary
        onOpenProject={(projectId) => loadProject(projectId)}
        onCreateNew={handleCreateNew}
      />
    );
  }

  // Show Editor view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back to projects button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackToProjects}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="p-2 rounded-lg bg-accent/20">
            <Scissors className="w-6 h-6 text-accent" />
          </div>
          <div>
            {/* Editable project name */}
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onBlur={() => handleNameChange(projectName)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameChange(projectName);
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                  className="h-8 w-64 bg-white/10 border-white/20 text-white"
                  autoFocus
                />
              ) : (
                <h2
                  className="text-xl font-semibold text-white cursor-pointer hover:text-primary transition-colors flex items-center gap-2"
                  onClick={() => setIsEditingName(true)}
                >
                  {projectName}
                  <Pencil className="w-4 h-4 opacity-50" />
                </h2>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>
                {clips.length === 0
                  ? 'Add clips from your library to get started'
                  : `${clips.length} clip${clips.length !== 1 ? 's' : ''} • ${formatTime(totalDuration)} total`}
              </span>
              {/* Save status indicator */}
              {clips.length > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    {isSaving ? (
                      <>
                        <Cloud className="w-3 h-3 animate-pulse text-primary" />
                        Saving...
                      </>
                    ) : hasUnsavedChanges ? (
                      <>
                        <CloudOff className="w-3 h-3 text-yellow-500" />
                        Unsaved changes
                      </>
                    ) : lastSaved ? (
                      <>
                        <Cloud className="w-3 h-3 text-green-500" />
                        Saved {formatLastSaved()}
                      </>
                    ) : null}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo buttons */}
          {clips.length > 0 && (
            <>
              <Button
                onClick={handleUndo}
                variant="ghost"
                size="icon"
                disabled={!canUndo}
                className="text-gray-400 hover:text-white disabled:opacity-30"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-5 h-5" />
              </Button>
              <Button
                onClick={handleRedo}
                variant="ghost"
                size="icon"
                disabled={!canRedo}
                className="text-gray-400 hover:text-white disabled:opacity-30"
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo2 className="w-5 h-5" />
              </Button>
              <div className="w-px h-6 bg-white/10 mx-1" />
            </>
          )}

          {/* Manual save button */}
          {clips.length > 0 && (
            <Button
              onClick={handleManualSave}
              variant="outline"
              disabled={isSaving || !hasUnsavedChanges}
              className="border-white/20"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}

          <Button
            onClick={() => setShowClipSelector(true)}
            className="bg-primary/20 hover:bg-primary/30 text-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Clips
          </Button>

          {clips.length > 0 && (
            <>
              <Button
                onClick={handleClearAll}
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>

              <Button
                onClick={handleExport}
                className="cosmic-button"
                disabled={exportState.exporting}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Video
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Preview Section */}
        <Card className="cosmic-card border-0 overflow-hidden">
          <div className="aspect-video bg-black/50 relative flex items-center justify-center">
            {clips.length === 0 ? (
              <div className="text-center text-gray-400">
                <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No clips added yet</p>
                <p className="text-sm mt-1">Click "Add Clips" to import from your library</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  muted={isMuted}
                  playsInline
                  preload="metadata"
                />
                {!activeClip && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <p className="text-gray-400">No clip at current position</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Playback Controls */}
          <div className="p-4 space-y-4 bg-card/50">
            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400 w-12 text-right">
                {formatTime(playback.currentTime)}
              </span>
              <Slider
                value={[playback.currentTime]}
                min={0}
                max={totalDuration || 1}
                step={0.1}
                onValueChange={([value]) => handleSeek(value)}
                className="flex-1"
                disabled={clips.length === 0}
              />
              <span className="text-sm text-gray-400 w-12">
                {formatTime(totalDuration)}
              </span>
            </div>

            {/* Control buttons */}
            <div className="flex items-center justify-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={handleReset}
                disabled={clips.length === 0}
              >
                <SkipBack className="w-5 h-5" />
              </Button>

              <Button
                size="lg"
                className="cosmic-button rounded-full w-14 h-14"
                onClick={togglePlayback}
                disabled={clips.length === 0}
              >
                {playback.playing ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsMuted(!isMuted)}
                disabled={clips.length === 0}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>

              {!isMuted && (
                <Slider
                  value={[volume]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={([v]) => {
                    setVolume(v);
                    if (videoRef.current) videoRef.current.volume = v;
                  }}
                  className="w-24"
                />
              )}
            </div>
          </div>
        </Card>

        {/* Clips List / Info Panel */}
        <Card className="cosmic-card border-0 p-4 space-y-4">
          <h3 className="font-semibold text-white">Clips ({clips.length})</h3>

          {clips.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No clips in timeline</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {clips.map((clip, index) => (
                <div
                  key={clip.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    playback.activeClipId === clip.id
                      ? 'border-primary bg-primary/10'
                      : 'border-white/10 hover:border-white/20 bg-white/5'
                  }`}
                  onClick={() => handleSeek(clip.startTime)}
                >
                  <div className="flex items-start gap-3">
                    {/* Video thumbnail - using actual video element */}
                    <div className="w-16 h-10 bg-black/30 rounded overflow-hidden flex-shrink-0">
                      <video
                        src={clip.sourceUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        Clip {index + 1}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTime(getEffectiveDuration(clip))}
                        {(clip.trimStart > 0 || clip.trimEnd > 0) && (
                          <span className="text-accent ml-1">(trimmed)</span>
                        )}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-gray-400 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClip(clip.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Timeline */}
      <Card className="cosmic-card border-0 p-4">
        <EditorTimeline
          clips={clips}
          currentTime={playback.currentTime}
          totalDuration={totalDuration}
          onSeek={handleSeek}
          onChange={handleTimelineChange}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDeleteClip={handleDeleteClip}
          onSplitClip={handleSplitClip}
          onUndo={handleUndo}
          canUndo={canUndo}
        />
      </Card>

      {/* Clip Selector Modal */}
      <ClipSelector
        open={showClipSelector}
        onClose={() => setShowClipSelector(false)}
        onSelect={handleAddClips}
      />

      {/* Export Modal */}
      <ExportModal
        open={showExportModal}
        onClose={() => {
          if (!exportState.exporting) {
            setShowExportModal(false);
            setExportState({
              exporting: false,
              progress: 0,
              stage: 'idle',
              error: null,
            });
          }
        }}
        exportState={exportState}
        showOptions={true}
        onStartExport={handleStartExport}
      />
    </div>
  );
};

export default VideoEditor;
