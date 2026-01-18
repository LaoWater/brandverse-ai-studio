import { useRef, useEffect, useState, useCallback } from 'react';
import type { TextOverlay, FontFamily } from '@/types/editor';

// Google Fonts URL mapping
const GOOGLE_FONTS_MAP: Record<FontFamily, string> = {
  'Inter': 'Inter:wght@300;400;700',
  'Montserrat': 'Montserrat:wght@300;400;700',
  'Roboto': 'Roboto:wght@300;400;700',
  'Playfair Display': 'Playfair+Display:wght@400;700',
  'Oswald': 'Oswald:wght@300;400;700',
  'Open Sans': 'Open+Sans:wght@300;400;700',
  'Lato': 'Lato:wght@300;400;700',
  'Poppins': 'Poppins:wght@300;400;700',
};

// Track which fonts have been loaded
const loadedFonts = new Set<FontFamily>();

// Load a Google Font dynamically
const loadGoogleFont = (fontFamily: FontFamily) => {
  if (loadedFonts.has(fontFamily)) return;

  const fontSpec = GOOGLE_FONTS_MAP[fontFamily];
  if (!fontSpec) return;

  // Check if already in DOM
  const existingLink = document.querySelector(`link[data-font="${fontFamily}"]`);
  if (existingLink) {
    loadedFonts.add(fontFamily);
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontSpec}&display=swap`;
  link.setAttribute('data-font', fontFamily);
  document.head.appendChild(link);
  loadedFonts.add(fontFamily);
};

interface TextPositionHandleProps {
  overlay: TextOverlay;
  containerRef: React.RefObject<HTMLDivElement>;
  onPositionChange: (position: { x: number; y: number }) => void;
  onFontSizeChange?: (fontSize: number) => void;
  isSelected: boolean;
  onSelect: () => void;
}

type DragMode = 'move' | 'resize';

export const TextPositionHandle = ({
  overlay,
  containerRef,
  onPositionChange,
  onFontSizeChange,
  isSelected,
  onSelect,
}: TextPositionHandleProps) => {
  const handleRef = useRef<HTMLDivElement>(null);
  const [dragMode, setDragMode] = useState<DragMode | null>(null);
  const [resizeStart, setResizeStart] = useState<{ y: number; fontSize: number } | null>(null);
  // Store the offset between mouse click and element center (in percentage points)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);

  // Load the font when the overlay's font family changes
  useEffect(() => {
    loadGoogleFont(overlay.style.fontFamily);
  }, [overlay.style.fontFamily]);

  // Handle move drag start - store offset from where we clicked to element center
  const handleMoveStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    // Calculate where we clicked as percentage
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Store the offset between click position and element's current position
    setDragOffset({
      x: overlay.position.x - clickX,
      y: overlay.position.y - clickY,
    });

    setDragMode('move');
    onSelect();
  }, [onSelect, containerRef, overlay.position.x, overlay.position.y]);

  // Handle resize drag start (corner handles)
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragMode('resize');
    setResizeStart({ y: e.clientY, fontSize: overlay.style.fontSize });
    onSelect();
  }, [onSelect, overlay.style.fontSize]);

  // Handle move drag
  useEffect(() => {
    if (dragMode !== 'move' || !dragOffset) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();

      // Calculate mouse position as percentage
      const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
      const mouseY = ((e.clientY - rect.top) / rect.height) * 100;

      // Apply the offset to maintain relative position from where we grabbed
      const x = Math.max(0, Math.min(100, mouseX + dragOffset.x));
      const y = Math.max(0, Math.min(100, mouseY + dragOffset.y));

      onPositionChange({ x, y });
    };

    const handleMouseUp = () => {
      setDragMode(null);
      setDragOffset(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragMode, dragOffset, containerRef, onPositionChange]);

  // Handle resize drag (font size)
  useEffect(() => {
    if (dragMode !== 'resize' || !resizeStart || !onFontSizeChange) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Dragging down = larger font, dragging up = smaller font
      const deltaY = e.clientY - resizeStart.y;
      const scaleFactor = 0.5; // pixels of mouse movement per font size pixel
      const newFontSize = Math.max(12, Math.min(120, resizeStart.fontSize + deltaY * scaleFactor));
      onFontSizeChange(Math.round(newFontSize));
    };

    const handleMouseUp = () => {
      setDragMode(null);
      setResizeStart(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragMode, resizeStart, onFontSizeChange]);

  const isDragging = dragMode === 'move';
  const isResizing = dragMode === 'resize';

  // Get font weight CSS value
  const getFontWeight = () => {
    switch (overlay.style.fontWeight) {
      case 'light': return 300;
      case 'bold': return 700;
      default: return 400;
    }
  };

  return (
    <div
      ref={handleRef}
      className={`absolute select-none transition-shadow ${
        isSelected ? 'z-20' : 'z-10'
      } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: `${overlay.position.x}%`,
        top: `${overlay.position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onMouseDown={handleMoveStart}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Text content with styling */}
      <div
        className={`whitespace-nowrap transition-all ${
          isSelected
            ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-transparent'
            : ''
        } ${isDragging ? 'scale-105' : ''} ${isResizing ? 'ring-2 ring-yellow-400' : ''}`}
        style={{
          fontFamily: overlay.style.fontFamily,
          fontSize: `${overlay.style.fontSize}px`,
          fontWeight: getFontWeight(),
          color: overlay.style.color,
          textAlign: overlay.style.textAlign,
          opacity: overlay.style.opacity,
          backgroundColor: overlay.style.backgroundColor,
          padding: overlay.style.backgroundColor
            ? `${overlay.style.backgroundPadding || 0}px`
            : undefined,
          borderRadius: overlay.style.backgroundColor ? '4px' : undefined,
          textShadow: !overlay.style.backgroundColor
            ? '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.5)'
            : undefined,
        }}
      >
        {overlay.text || 'Text'}
      </div>

      {/* Corner resize handles for font size - only when selected */}
      {isSelected && onFontSizeChange && (
        <>
          {/* Top-left */}
          <div
            className="absolute -top-2 -left-2 w-4 h-4 bg-purple-500 rounded-full cursor-nwse-resize hover:bg-purple-400 hover:scale-110 transition-all shadow-md"
            onMouseDown={handleResizeStart}
            title="Drag to resize text"
          />
          {/* Top-right */}
          <div
            className="absolute -top-2 -right-2 w-4 h-4 bg-purple-500 rounded-full cursor-nesw-resize hover:bg-purple-400 hover:scale-110 transition-all shadow-md"
            onMouseDown={handleResizeStart}
            title="Drag to resize text"
          />
          {/* Bottom-left */}
          <div
            className="absolute -bottom-2 -left-2 w-4 h-4 bg-purple-500 rounded-full cursor-nesw-resize hover:bg-purple-400 hover:scale-110 transition-all shadow-md"
            onMouseDown={handleResizeStart}
            title="Drag to resize text"
          />
          {/* Bottom-right */}
          <div
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-purple-500 rounded-full cursor-nwse-resize hover:bg-purple-400 hover:scale-110 transition-all shadow-md"
            onMouseDown={handleResizeStart}
            title="Drag to resize text"
          />
        </>
      )}

      {/* Font size indicator during resize */}
      {isResizing && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg">
          {overlay.style.fontSize}px
        </div>
      )}
    </div>
  );
};

export default TextPositionHandle;
