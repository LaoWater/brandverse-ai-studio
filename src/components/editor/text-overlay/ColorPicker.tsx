import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

// Preset colors for quick selection
const PRESET_COLORS = [
  '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FF6B6B', '#4ECDC4',
  '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8B500', '#2ECC71',
];

export const ColorPicker = ({ value, onChange, label }: ColorPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Validate hex color format
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      onChange(newValue);
    }
  };

  const handlePresetClick = (color: string) => {
    setInputValue(color);
    onChange(color);
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs text-gray-400">{label}</label>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-9 px-2 justify-start gap-2 border-gray-600 bg-gray-800 hover:bg-gray-700"
          >
            <div
              className="w-5 h-5 rounded border border-gray-500"
              style={{ backgroundColor: value }}
            />
            <span className="text-sm font-mono text-gray-300">{value}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3 bg-gray-800 border-gray-600" align="start">
          <div className="space-y-3">
            {/* Color input */}
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded border border-gray-500 flex-shrink-0"
                style={{ backgroundColor: inputValue }}
              />
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                placeholder="#FFFFFF"
                className="h-10 font-mono text-sm bg-gray-700 border-gray-600 text-white"
              />
            </div>

            {/* Native color picker */}
            <div>
              <input
                type="color"
                value={value}
                onChange={(e) => {
                  setInputValue(e.target.value.toUpperCase());
                  onChange(e.target.value.toUpperCase());
                }}
                className="w-full h-8 cursor-pointer rounded border border-gray-600"
                style={{ backgroundColor: 'transparent' }}
              />
            </div>

            {/* Preset colors grid */}
            <div className="grid grid-cols-5 gap-1.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handlePresetClick(color)}
                  className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                    color === value ? 'border-primary' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ColorPicker;
