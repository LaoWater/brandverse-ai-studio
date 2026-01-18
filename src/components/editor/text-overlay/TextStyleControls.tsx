import { useEffect } from 'react';
import { AlignLeft, AlignCenter, AlignRight, Bold, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TextStyle, FontFamily } from '@/types/editor';
import { ColorPicker } from './ColorPicker';

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

// Preload all fonts for the dropdown
const preloadAllFonts = () => {
  const families = Object.values(GOOGLE_FONTS_MAP).join('&family=');
  const existingLink = document.querySelector('link[data-fonts="all"]');
  if (existingLink) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
  link.setAttribute('data-fonts', 'all');
  document.head.appendChild(link);
};

interface TextStyleControlsProps {
  style: TextStyle;
  onChange: (style: TextStyle) => void;
}

const FONT_OPTIONS: { value: FontFamily; label: string }[] = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Oswald', label: 'Oswald' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Poppins', label: 'Poppins' },
];

export const TextStyleControls = ({ style, onChange }: TextStyleControlsProps) => {
  // Preload all fonts when the component mounts
  useEffect(() => {
    preloadAllFonts();
  }, []);

  const updateStyle = <K extends keyof TextStyle>(key: K, value: TextStyle[K]) => {
    onChange({ ...style, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Font Family */}
      <div className="space-y-1.5">
        <label className="text-xs text-gray-400">Font Family</label>
        <Select
          value={style.fontFamily}
          onValueChange={(value) => updateStyle('fontFamily', value as FontFamily)}
        >
          <SelectTrigger className="w-full h-9 bg-gray-800 border-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            {FONT_OPTIONS.map((font) => (
              <SelectItem
                key={font.value}
                value={font.value}
                style={{ fontFamily: font.value }}
                className="text-white hover:bg-gray-700 focus:bg-gray-700 focus:text-white"
              >
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font Size */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-400">Font Size</label>
          <span className="text-xs text-gray-400">{style.fontSize}px</span>
        </div>
        <Slider
          value={[style.fontSize]}
          min={12}
          max={120}
          step={1}
          onValueChange={([value]) => updateStyle('fontSize', value)}
          className="w-full"
        />
      </div>

      {/* Font Weight */}
      <div className="space-y-1.5">
        <label className="text-xs text-gray-400">Font Weight</label>
        <div className="flex gap-1">
          {(['light', 'normal', 'bold'] as const).map((weight) => (
            <Button
              key={weight}
              variant={style.fontWeight === weight ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateStyle('fontWeight', weight)}
              className={`flex-1 h-8 ${
                style.fontWeight === weight
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {weight === 'bold' ? (
                <Bold className="w-4 h-4" />
              ) : weight === 'light' ? (
                <Type className="w-4 h-4 opacity-50" />
              ) : (
                <Type className="w-4 h-4" />
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Text Alignment */}
      <div className="space-y-1.5">
        <label className="text-xs text-gray-400">Alignment</label>
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((align) => (
            <Button
              key={align}
              variant={style.textAlign === align ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateStyle('textAlign', align)}
              className={`flex-1 h-8 ${
                style.textAlign === align
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {align === 'left' ? (
                <AlignLeft className="w-4 h-4" />
              ) : align === 'center' ? (
                <AlignCenter className="w-4 h-4" />
              ) : (
                <AlignRight className="w-4 h-4" />
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Text Color */}
      <ColorPicker
        value={style.color}
        onChange={(color) => updateStyle('color', color)}
        label="Text Color"
      />

      {/* Background Color (optional) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-400">Background</label>
          {style.backgroundColor && (
            <button
              onClick={() => {
                const newStyle = { ...style };
                delete newStyle.backgroundColor;
                delete newStyle.backgroundPadding;
                onChange(newStyle);
              }}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Remove
            </button>
          )}
        </div>
        <ColorPicker
          value={style.backgroundColor || '#000000'}
          onChange={(color) => {
            updateStyle('backgroundColor', color);
            if (!style.backgroundPadding) {
              updateStyle('backgroundPadding', 8);
            }
          }}
        />
      </div>

      {/* Background Padding (when background is set) */}
      {style.backgroundColor && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400">Background Padding</label>
            <span className="text-xs text-gray-400">{style.backgroundPadding || 0}px</span>
          </div>
          <Slider
            value={[style.backgroundPadding || 0]}
            min={0}
            max={32}
            step={1}
            onValueChange={([value]) => updateStyle('backgroundPadding', value)}
            className="w-full"
          />
        </div>
      )}

      {/* Opacity */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-400">Opacity</label>
          <span className="text-xs text-gray-400">{Math.round(style.opacity * 100)}%</span>
        </div>
        <Slider
          value={[style.opacity]}
          min={0}
          max={1}
          step={0.05}
          onValueChange={([value]) => updateStyle('opacity', value)}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default TextStyleControls;
