import { useState, useCallback, useRef, useEffect } from 'react';
import { Film, Plus, Download, Trash2, Play, Pause, SkipBack, Volume2, VolumeX, Save, FolderOpen, Cloud, CloudOff, Pencil, ArrowLeft, Scissors, Undo2, Redo2, Type, PanelRightClose, PanelRightOpen, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import type { EditorClip, PlaybackState, ExportState, TextOverlay, ClipTransition, CaptionSegment, CaptionStyle, AudioSegment } from '@/types/editor';
import { getEffectiveDuration, getClipEndTime, createTextOverlay, DEFAULT_CAPTION_STYLE, createCaptionSegment } from '@/types/editor';
import { ClipSelector } from './ClipSelector';
import { EditorTimeline } from './EditorTimeline';
import { ExportModal } from './ExportModal';
import { ProjectsLibrary } from './ProjectsLibrary';
import { TextOverlayPanel, TextOverlayPreview } from './text-overlay';
import { TransitionPanel } from './transitions';
import { CaptionPanel, CaptionPreview } from './captions';
import { exportProject, downloadBlob } from '@/services/videoEditorService';
import { generateCaptions } from '@/services/audioService';
import type { ExportDestination } from './ExportModal';
import {
  createProject,
  updateProject,
  getProject,
  EditorProject,
  migrateProjectData,
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
  const preloadVideoRef = useRef<HTMLVideoElement>(null); // Hidden video for preloading next clip
  const animationRef = useRef<number | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const preloadedClipIdRef = useRef<string | null>(null); // Track which clip is preloaded

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

  // Text overlay state
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [isTextPanelOpen, setIsTextPanelOpen] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Transition state
  const [selectedTransitionIndex, setSelectedTransitionIndex] = useState<number | null>(null);
  const [isTransitionPanelOpen, setIsTransitionPanelOpen] = useState(false);

  // Audio segments state (detached audio)
  const [audioSegments, setAudioSegments] = useState<AudioSegment[]>([]);

  // Timeline scale (px/s) - persisted per project
  const [timelineScale, setTimelineScale] = useState<number>(50);

  // Caption state
  const [captions, setCaptions] = useState<CaptionSegment[]>([]);
  const [selectedCaptionId, setSelectedCaptionId] = useState<string | null>(null);
  const [isCaptionPanelOpen, setIsCaptionPanelOpen] = useState(false);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>(DEFAULT_CAPTION_STYLE);

  // History state for Undo/Redo (includes both clips and textOverlays)
  interface HistoryState {
    clips: EditorClip[];
    textOverlays: TextOverlay[];
  }
  const [history, setHistory] = useState<HistoryState[]>([]);
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

  // Push to history when clips or textOverlays change (except during undo/redo)
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

    // Skip empty state
    if (clips.length === 0 && textOverlays.length === 0 && history.length === 0) return;

    // Create current state snapshot
    const currentState: HistoryState = { clips: [...clips], textOverlays: [...textOverlays] };

    // Check if state is different from current history position
    const currentHistoryState = history[historyIndex];
    if (currentHistoryState && JSON.stringify(currentHistoryState) === JSON.stringify(currentState)) {
      return; // No actual change
    }

    // Push new state to history
    setHistory(prev => {
      // Remove any redo states (everything after current index)
      const newHistory = prev.slice(0, historyIndex + 1);
      // Add current state
      newHistory.push(currentState);
      // Limit history size
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [clips, textOverlays]);

  // Undo handler
  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return; // Nothing to undo

    isUndoRedoRef.current = true;
    const previousState = history[historyIndex - 1];
    if (previousState) {
      setClips([...previousState.clips]);
      setTextOverlays([...previousState.textOverlays]);
    } else {
      setClips([]);
      setTextOverlays([]);
    }
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
    if (nextState) {
      setClips([...nextState.clips]);
      setTextOverlays([...nextState.textOverlays]);
    } else {
      setClips([]);
      setTextOverlays([]);
    }
    setHistoryIndex(prev => prev + 1);

    toast({
      title: 'Redo',
      description: 'Restored next state.',
    });
  }, [history, historyIndex, toast]);

  // Check if undo/redo are available
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Load a project from database
  const loadProject = async (id: string) => {
    const project = await getProject(id);
    if (project) {
      setCurrentProject(project);
      setProjectName(project.name);

      // Project data is already migrated by getProject
      const projectData = project.project_data;
      setClips(projectData.clips || []);
      setTextOverlays(projectData.textOverlays || []);
      if (projectData.timelineScale) {
        setTimelineScale(projectData.timelineScale);
      }
      setLastSaved(new Date(project.updated_at));
      setHasUnsavedChanges(false);
      setEditorMode('editing');

      // Reset history for loaded project
      setHistory([{
        clips: projectData.clips || [],
        textOverlays: projectData.textOverlays || [],
      }]);
      setHistoryIndex(0);

      // Reset text overlay selection
      setSelectedTextId(null);
      setIsTextPanelOpen(false);

      // Load first clip into video player
      if (projectData.clips?.length > 0 && videoRef.current) {
        const firstClip = projectData.clips[0];
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
    setTextOverlays([]);
    setSelectedTextId(null);
    setIsTextPanelOpen(false);
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

  // Auto-save when clips or textOverlays change (debounced)
  useEffect(() => {
    if (!user || (clips.length === 0 && textOverlays.length === 0)) return;

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
  }, [clips, textOverlays, timelineScale, user]);

  // Save project to database
  const saveProject = async () => {
    if (!user || (clips.length === 0 && textOverlays.length === 0)) return;

    setIsSaving(true);

    try {
      if (currentProject) {
        // Update existing project
        const updated = await updateProject(currentProject.id, {
          name: projectName,
          clips,
          textOverlays,
          timelineScale,
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
          clips,
          textOverlays
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

  // Add text overlay handler (must be after totalDuration is defined)
  const handleAddTextOverlay = useCallback(() => {
    const duration = Math.min(3, Math.max(0.5, totalDuration - playback.currentTime));
    const newOverlay = createTextOverlay(playback.currentTime, duration > 0 ? duration : 3);
    setTextOverlays(prev => [...prev, newOverlay]);
    setSelectedTextId(newOverlay.id);
    setIsTextPanelOpen(true);
  }, [playback.currentTime, totalDuration]);

  // Keyboard shortcuts for Undo/Redo and Add Text
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to deselect text and close panel
      if (e.key === 'Escape') {
        setSelectedTextId(null);
        setIsTextPanelOpen(false);
        return;
      }

      // Delete selected text overlay
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedTextId) {
        // Don't delete if user is typing in an input
        if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault();
        setTextOverlays(prev => prev.filter(t => t.id !== selectedTextId));
        setSelectedTextId(null);
        return;
      }

      // Check for Ctrl+T or Cmd+T for adding text
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        handleAddTextOverlay();
        return;
      }

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
  }, [handleUndo, handleRedo, handleAddTextOverlay, selectedTextId]);

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

  // Find the next clip after a given clip
  const findNextClip = useCallback((currentClipId: string): EditorClip | null => {
    const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime);
    const currentIndex = sortedClips.findIndex(c => c.id === currentClipId);
    if (currentIndex >= 0 && currentIndex < sortedClips.length - 1) {
      return sortedClips[currentIndex + 1];
    }
    return null;
  }, [clips]);

  // Preload the next clip when we're close to the end of the current one
  useEffect(() => {
    const activeClip = findActiveClip(playback.currentTime);
    if (!activeClip || !preloadVideoRef.current) return;

    const nextClip = findNextClip(activeClip.id);
    if (!nextClip) return;

    // Check if we need to preload (when we're within last 2 seconds of current clip)
    const clipLocalTime = playback.currentTime - activeClip.startTime;
    const effectiveDuration = getEffectiveDuration(activeClip);
    const timeUntilEnd = effectiveDuration - clipLocalTime;

    // Preload when within 2 seconds of clip end
    if (timeUntilEnd < 2 && preloadedClipIdRef.current !== nextClip.id) {
      console.log('[VideoEditor] Preloading next clip:', nextClip.id);
      preloadVideoRef.current.src = nextClip.sourceUrl;
      preloadVideoRef.current.load();
      preloadedClipIdRef.current = nextClip.id;

      // Pre-seek to the trim start position
      preloadVideoRef.current.addEventListener('loadedmetadata', () => {
        if (preloadVideoRef.current) {
          preloadVideoRef.current.currentTime = nextClip.trimStart;
        }
      }, { once: true });
    }
  }, [playback.currentTime, findActiveClip, findNextClip]);

  // Update video source when active clip changes
  useEffect(() => {
    const activeClip = findActiveClip(playback.currentTime);

    if (!videoRef.current) return;

    if (activeClip) {
      if (playback.activeClipId !== activeClip.id) {
        const wasPlaying = playback.playing;

        // Check if this clip was preloaded
        if (preloadedClipIdRef.current === activeClip.id && preloadVideoRef.current?.src) {
          // Swap: use the preloaded video
          console.log('[VideoEditor] Using preloaded clip:', activeClip.id);
          videoRef.current.src = preloadVideoRef.current.src;

          // The preloaded video should already be at the right position
          const handleCanPlay = () => {
            if (videoRef.current) {
              const clipLocalTime = playback.currentTime - activeClip.startTime + activeClip.trimStart;
              const clampedTime = Math.max(activeClip.trimStart, clipLocalTime);
              videoRef.current.currentTime = clampedTime;

              // Resume playback immediately if we were playing
              if (wasPlaying) {
                videoRef.current.play().catch(() => {});
              }
            }
          };

          // Check if already loaded enough to play
          if (videoRef.current.readyState >= 3) {
            handleCanPlay();
          } else {
            videoRef.current.addEventListener('canplay', handleCanPlay, { once: true });
          }

          preloadedClipIdRef.current = null;
        } else {
          // Normal load (first clip or non-preloaded)
          console.log('[VideoEditor] Loading clip:', activeClip.id, activeClip.sourceUrl);
          videoRef.current.src = activeClip.sourceUrl;
          videoRef.current.load();

          // Wait for video to be ready before seeking
          const handleLoadedMetadata = () => {
            if (videoRef.current) {
              const clipLocalTime = playback.currentTime - activeClip.startTime + activeClip.trimStart;
              const clampedTime = Math.max(activeClip.trimStart, clipLocalTime);
              videoRef.current.currentTime = clampedTime;
              console.log('[VideoEditor] Video loaded, seeking to:', clampedTime);

              // Resume playback if we were playing
              if (wasPlaying) {
                videoRef.current.play().catch(() => {});
              }
            }
          };

          videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
        }

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
  }, [playback.currentTime, playback.activeClipId, playback.playing, findActiveClip, clips]);

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
  // Only sync video position when:
  // 1. Playback state changes (play/pause)
  // 2. User seeks (currentTime changes significantly when not playing)
  // 3. Active clip changes
  const lastSyncTimeRef = useRef<number>(0);

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
      // When playing, let the video play naturally - only ensure it's playing
      // and check trim boundary
      if (clipLocalTime >= trimEndBoundary) {
        // We've reached the end of this clip's trimmed content
        // The playback animation loop will advance to the next clip
        return;
      }

      // Only start playing if paused
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    } else {
      // When paused, sync the video to the timeline position for scrubbing
      videoRef.current.pause();
      const clampedTime = Math.max(activeClip.trimStart, Math.min(clipLocalTime, trimEndBoundary));

      // Only update currentTime if it's significantly different (avoids jitter)
      if (Math.abs(videoRef.current.currentTime - clampedTime) > 0.1) {
        videoRef.current.currentTime = clampedTime;
      }
    }
  }, [playback.playing, playback.currentTime, findActiveClip]);

  // Sync video volume with active clip's audio settings
  useEffect(() => {
    if (!videoRef.current) return;

    const activeClip = findActiveClip(playback.currentTime);
    if (!activeClip) return;

    const audioInfo = activeClip.audioInfo || { hasAudio: true, volume: 1 };

    if (isMuted || audioInfo.volume === 0) {
      videoRef.current.muted = true;
    } else {
      videoRef.current.muted = false;
      // Combine global volume with clip volume
      // HTML5 video.volume is clamped to 0-1; values >1 are applied via ffmpeg on export
      const combinedVolume = volume * audioInfo.volume;
      videoRef.current.volume = Math.min(1, combinedVolume);
    }
  }, [playback.currentTime, findActiveClip, isMuted, volume]);

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

  // Clear all clips and text overlays
  const handleClearAll = useCallback(() => {
    setClips([]);
    setTextOverlays([]);
    setSelectedTextId(null);
    setIsTextPanelOpen(false);
    setPlayback({
      playing: false,
      currentTime: 0,
      activeClipId: null,
    });
  }, []);

  // Text overlay handlers
  const handleUpdateTextOverlay = useCallback((id: string, updates: Partial<TextOverlay>) => {
    setTextOverlays(prev => prev.map(overlay =>
      overlay.id === id ? { ...overlay, ...updates } : overlay
    ));
  }, []);

  const handleDeleteTextOverlay = useCallback((id: string) => {
    setTextOverlays(prev => prev.filter(overlay => overlay.id !== id));
    if (selectedTextId === id) {
      setSelectedTextId(null);
    }
  }, [selectedTextId]);

  const handleDuplicateTextOverlay = useCallback((id: string) => {
    const overlay = textOverlays.find(o => o.id === id);
    if (!overlay) return;

    const newOverlay: TextOverlay = {
      ...overlay,
      id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: overlay.startTime + overlay.duration, // Place after original
      position: {
        x: Math.min(overlay.position.x + 5, 100), // Slight offset
        y: Math.min(overlay.position.y + 5, 100),
      },
    };
    setTextOverlays(prev => [...prev, newOverlay]);
    setSelectedTextId(newOverlay.id);
  }, [textOverlays]);

  // Transition handlers
  const handleSelectTransition = useCallback((index: number | null) => {
    setSelectedTransitionIndex(index);
    if (index !== null) {
      setIsTransitionPanelOpen(true);
      // Deselect text when selecting a transition
      setSelectedTextId(null);
    }
  }, []);

  const handleUpdateTransition = useCallback((clipIndex: number, transition: ClipTransition | undefined) => {
    setClips(prev => prev.map((clip, idx) =>
      idx === clipIndex ? { ...clip, transitionOut: transition } : clip
    ));
  }, []);

  // Audio handlers
  const [selectedAudioClipId, setSelectedAudioClipId] = useState<string | null>(null);

  const handleClipVolumeChange = useCallback((clipId: string, newVolume: number) => {
    // Check if it's a detached audio segment
    const isSegment = audioSegments.some(s => s.id === clipId);
    if (isSegment) {
      setAudioSegments(prev => prev.map(seg =>
        seg.id === clipId ? { ...seg, volume: Math.max(0, Math.min(2, newVolume)) } : seg
      ));
      return;
    }

    setClips(prev => prev.map(clip => {
      if (clip.id !== clipId) return clip;
      const currentAudioInfo = clip.audioInfo || { hasAudio: true, volume: 1 };
      return {
        ...clip,
        audioInfo: {
          ...currentAudioInfo,
          volume: Math.max(0, Math.min(2, newVolume)),
        },
      };
    }));
  }, [audioSegments]);

  const handleDetachAudio = useCallback((clipId: string) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;
    const audioInfo = clip.audioInfo || { hasAudio: true, volume: 1 };
    if (!audioInfo.hasAudio) return;

    // Create independent audio segment
    const effectiveDuration = getEffectiveDuration(clip);
    const segment: AudioSegment = {
      id: `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceClipId: clip.id,
      sourceUrl: clip.sourceUrl,
      startTime: clip.startTime,
      duration: effectiveDuration,
      trimStart: clip.trimStart,
      trimEnd: clip.trimEnd,
      volume: audioInfo.volume,
      linkedToVideo: false,
    };

    setAudioSegments(prev => [...prev, segment]);

    // Mark video clip as having no audio
    setClips(prev => prev.map(c =>
      c.id === clipId
        ? { ...c, audioInfo: { ...audioInfo, hasAudio: false } }
        : c
    ));

    toast({
      title: 'Audio Detached',
      description: 'Audio is now independent. Right-click to reattach.',
    });
  }, [clips, toast]);

  const handleReattachAudio = useCallback((segmentId: string) => {
    const segment = audioSegments.find(s => s.id === segmentId);
    if (!segment) return;

    // Restore audio to the source clip
    setClips(prev => prev.map(c =>
      c.id === segment.sourceClipId
        ? {
            ...c,
            audioInfo: {
              hasAudio: true,
              volume: segment.volume,
            },
          }
        : c
    ));

    // Remove the detached segment
    setAudioSegments(prev => prev.filter(s => s.id !== segmentId));

    toast({
      title: 'Audio Reattached',
      description: 'Audio has been linked back to its video clip.',
    });
  }, [audioSegments, toast]);


  // Caption handlers
  const handleAddCaption = useCallback((caption: CaptionSegment) => {
    setCaptions(prev => [...prev, caption]);
  }, []);

  const handleUpdateCaption = useCallback((id: string, updates: Partial<CaptionSegment>) => {
    setCaptions(prev => prev.map(caption =>
      caption.id === id ? { ...caption, ...updates } : caption
    ));
  }, []);

  const handleDeleteCaption = useCallback((id: string) => {
    setCaptions(prev => prev.filter(caption => caption.id !== id));
    if (selectedCaptionId === id) {
      setSelectedCaptionId(null);
    }
  }, [selectedCaptionId]);

  const handleDuplicateCaption = useCallback((id: string) => {
    const caption = captions.find(c => c.id === id);
    if (!caption) return;

    const duration = caption.endTime - caption.startTime;
    const newCaption: CaptionSegment = {
      ...caption,
      id: `caption_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: caption.endTime,
      endTime: caption.endTime + duration,
    };
    setCaptions(prev => [...prev, newCaption]);
    setSelectedCaptionId(newCaption.id);
  }, [captions]);

  const handleGenerateCaptions = useCallback(async () => {
    if (clips.length === 0) {
      toast({
        title: 'No Clips',
        description: 'Add video clips to generate captions from audio.',
        variant: 'destructive',
      });
      return;
    }

    // Use the first clip's video for caption generation
    const firstClip = clips[0];
    if (!firstClip?.sourceUrl) {
      toast({
        title: 'Invalid Clip',
        description: 'Cannot access video source for caption generation.',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingCaptions(true);

    try {
      const result = await generateCaptions(
        firstClip.sourceUrl,
        user?.id || 'anonymous'
      );

      // Adjust caption times to account for clip's position and trim
      const adjustedCaptions = result.captions.map(caption => ({
        ...caption,
        startTime: Math.max(0, caption.startTime - firstClip.trimStart + firstClip.startTime),
        endTime: Math.max(0, caption.endTime - firstClip.trimStart + firstClip.startTime),
      }));

      setCaptions(adjustedCaptions);

      toast({
        title: 'Captions Generated',
        description: `Generated ${adjustedCaptions.length} caption segments.`,
      });
    } catch (error) {
      console.error('[VideoEditor] Caption generation failed:', error);
      toast({
        title: 'Caption Generation Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingCaptions(false);
    }
  }, [clips, user, toast]);

  const handleUpdateCaptionStyle = useCallback((updates: Partial<CaptionStyle>) => {
    setCaptionStyle(prev => ({ ...prev, ...updates }));
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
      // Get the actual rendered video dimensions for proper text scaling
      // The video element with object-contain shows the actual video size
      let previewDimensions = { width: 400, height: 711 }; // Fallback for 9:16 aspect ratio

      if (videoRef.current && previewContainerRef.current) {
        const video = videoRef.current;
        const container = previewContainerRef.current;

        // Get the actual video dimensions
        const videoNaturalWidth = video.videoWidth || 1080;
        const videoNaturalHeight = video.videoHeight || 1920;
        const videoAspectRatio = videoNaturalWidth / videoNaturalHeight;

        // Get container dimensions
        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;
        const containerAspectRatio = containerWidth / containerHeight;

        // Calculate the actual rendered video size within the container (object-contain)
        let renderedWidth: number;
        let renderedHeight: number;

        if (videoAspectRatio > containerAspectRatio) {
          // Video is wider than container - width-constrained
          renderedWidth = containerWidth;
          renderedHeight = containerWidth / videoAspectRatio;
        } else {
          // Video is taller than container - height-constrained
          renderedHeight = containerHeight;
          renderedWidth = containerHeight * videoAspectRatio;
        }

        previewDimensions = {
          width: Math.round(renderedWidth),
          height: Math.round(renderedHeight),
        };

        console.log('[VideoEditor] Video natural size:', videoNaturalWidth, 'x', videoNaturalHeight);
        console.log('[VideoEditor] Container size:', containerWidth, 'x', containerHeight);
        console.log('[VideoEditor] Rendered video size:', previewDimensions.width, 'x', previewDimensions.height);
      }

      console.log('[VideoEditor] Preview dimensions for export:', previewDimensions);

      // Server-side export: always saves to library, returns blob for download
      const blob = await exportProject(
        clips,
        (progress, stage, message) => {
          console.log('[VideoEditor] Export progress:', progress, stage, message);
          setExportState(prev => ({
            ...prev,
            progress,
            stage,
            error: null,
          }));
        },
        user?.id,
        selectedCompany?.id || null,
        projectName,
        textOverlays,
        previewDimensions
      );

      console.log('[VideoEditor] Export complete, blob size:', blob.size, 'bytes');

      // Generate filename for download
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `${projectName.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.mp4`;

      // Handle download (server already saved to library)
      if (destination === 'download' || destination === 'both') {
        console.log('[VideoEditor] Downloading file:', filename);
        downloadBlob(blob, filename);
      }

      // Note: Server-side export already saves to library automatically
      // No need to upload again for 'library' or 'both' destinations

      setExportState(prev => ({
        ...prev,
        exporting: false,
        progress: 100,
        stage: 'complete',
      }));

      const successMessage = destination === 'download'
        ? 'Your video has been downloaded (and saved to library).'
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
  }, [clips, user, selectedCompany, projectName, toast]);

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
                  : ''}
              </span>
              {/* Save status indicator */}
              {clips.length > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    {isSaving ? (
                      <>
                        <Cloud className="w-3 h-3 animate-pulse text-primary" />
                        
                      </>
                    ) : hasUnsavedChanges ? (
                      <>
                        <CloudOff className="w-3 h-3 text-yellow-500" />
                        
                      </>
                    ) : lastSaved ? (
                      <>
                        <Cloud className="w-3 h-3 text-green-500" />
                        Saved
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

          {/* Add Text button */}
          <Button
            onClick={handleAddTextOverlay}
            className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400"
            title="Add Text (Cmd+T)"
          >
            <Type className="w-4 h-4 mr-2" />
            Add Text
          </Button>

          {/* Text Panel Toggle */}
          {textOverlays.length > 0 && (
            <Button
              onClick={() => setIsTextPanelOpen(!isTextPanelOpen)}
              variant="outline"
              className={`border-purple-500/50 ${isTextPanelOpen ? 'bg-purple-600/20 text-purple-400' : 'text-purple-400'}`}
              title="Toggle Text Panel"
            >
              {isTextPanelOpen ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <PanelRightOpen className="w-4 h-4" />
              )}
            </Button>
          )}

          {/* Transitions button - only show when there are 2+ clips */}
          {clips.length > 1 && (
            <Button
              onClick={() => {
                setIsTransitionPanelOpen(!isTransitionPanelOpen);
                // Close text panel when opening transitions
                if (!isTransitionPanelOpen) {
                  setIsTextPanelOpen(false);
                  setIsCaptionPanelOpen(false);
                }
              }}
              variant="outline"
              className={`border-blue-500/50 ${isTransitionPanelOpen ? 'bg-blue-600/20 text-blue-400' : 'text-blue-400 hover:bg-blue-600/10'}`}
              title="Transitions"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Transitions
            </Button>
          )}

          {/* Captions button */}
          {clips.length > 0 && (
            <Button
              onClick={() => {
                setIsCaptionPanelOpen(!isCaptionPanelOpen);
                // Close other panels when opening captions
                if (!isCaptionPanelOpen) {
                  setIsTextPanelOpen(false);
                  setIsTransitionPanelOpen(false);
                }
              }}
              variant="outline"
              className={`border-yellow-500/50 ${isCaptionPanelOpen ? 'bg-yellow-600/20 text-yellow-400' : 'text-yellow-400 hover:bg-yellow-600/10'}`}
              title="Captions"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Captions
              {captions.length > 0 && (
                <span className="ml-1 text-xs">({captions.length})</span>
              )}
            </Button>
          )}

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
          <div
            ref={previewContainerRef}
            className="aspect-video bg-black/50 relative flex items-center justify-center"
          >
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
                  preload="auto"
                />
                {/* Hidden preload video for seamless clip transitions */}
                <video
                  ref={preloadVideoRef}
                  className="hidden"
                  muted
                  playsInline
                  preload="auto"
                />
                {!activeClip && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <p className="text-gray-400">No clip at current position</p>
                  </div>
                )}

                {/* Text Overlay Preview */}
                {textOverlays.length > 0 && (
                  <TextOverlayPreview
                    overlays={textOverlays}
                    currentTime={playback.currentTime}
                    selectedOverlayId={selectedTextId}
                    onSelectOverlay={(id) => {
                      setSelectedTextId(id);
                      if (id) setIsTextPanelOpen(true);
                    }}
                    onUpdateOverlay={handleUpdateTextOverlay}
                    videoRef={videoRef}
                  />
                )}

                {/* Caption Preview */}
                {captions.length > 0 && (
                  <CaptionPreview
                    captions={captions}
                    currentTime={playback.currentTime}
                    globalStyle={captionStyle}
                  />
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
          textOverlays={textOverlays}
          selectedTextId={selectedTextId}
          onSelectText={(id) => {
            setSelectedTextId(id);
            if (id) setIsTextPanelOpen(true);
          }}
          onUpdateText={handleUpdateTextOverlay}
          // Transition props
          selectedTransitionIndex={selectedTransitionIndex}
          onSelectTransition={handleSelectTransition}
          onUpdateTransition={handleUpdateTransition}
          // Audio props
          showAudioTrack={true}
          selectedAudioClipId={selectedAudioClipId}
          onSelectAudioClip={setSelectedAudioClipId}
          onClipVolumeChange={handleClipVolumeChange}
          onDetachAudio={handleDetachAudio}
          onReattachAudio={handleReattachAudio}
          audioSegments={audioSegments}
          videoRef={videoRef}
          isPlaying={playback.playing}
          // Caption props
          captions={captions}
          selectedCaptionId={selectedCaptionId}
          onSelectCaption={(id) => {
            setSelectedCaptionId(id);
            if (id) setIsCaptionPanelOpen(true);
          }}
          onUpdateCaption={handleUpdateCaption}
          // Scale props
          scale={timelineScale}
          onScaleChange={setTimelineScale}
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

      {/* Text Overlay Panel (Drawer) */}
      <TextOverlayPanel
        isOpen={isTextPanelOpen}
        onClose={() => setIsTextPanelOpen(false)}
        overlays={textOverlays}
        selectedOverlayId={selectedTextId}
        onSelectOverlay={setSelectedTextId}
        onAddOverlay={(overlay) => {
          setTextOverlays(prev => [...prev, overlay]);
          setSelectedTextId(overlay.id);
        }}
        onUpdateOverlay={handleUpdateTextOverlay}
        onDeleteOverlay={handleDeleteTextOverlay}
        onDuplicateOverlay={handleDuplicateTextOverlay}
        currentTime={playback.currentTime}
        totalDuration={totalDuration}
      />

      {/* Transition Panel (Drawer) */}
      <TransitionPanel
        isOpen={isTransitionPanelOpen}
        onClose={() => {
          setIsTransitionPanelOpen(false);
          setSelectedTransitionIndex(null);
        }}
        clips={clips}
        selectedClipIndex={selectedTransitionIndex}
        onUpdateTransition={handleUpdateTransition}
      />

      {/* Caption Panel (Drawer) */}
      <CaptionPanel
        isOpen={isCaptionPanelOpen}
        onClose={() => setIsCaptionPanelOpen(false)}
        captions={captions}
        selectedCaptionId={selectedCaptionId}
        onSelectCaption={setSelectedCaptionId}
        onAddCaption={handleAddCaption}
        onUpdateCaption={handleUpdateCaption}
        onDeleteCaption={handleDeleteCaption}
        onDuplicateCaption={handleDuplicateCaption}
        onGenerateCaptions={handleGenerateCaptions}
        isGenerating={isGeneratingCaptions}
        currentTime={playback.currentTime}
        totalDuration={totalDuration}
        globalStyle={captionStyle}
        onUpdateGlobalStyle={handleUpdateCaptionStyle}
      />
    </div>
  );
};

export default VideoEditor;
