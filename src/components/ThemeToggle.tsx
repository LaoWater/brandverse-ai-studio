import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="relative w-10 h-10 rounded-full transition-all duration-300 hover:scale-110 theme-toggle-button"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {/* Sun icon for light mode (shows when in dark mode) */}
          <Sun
            className={`absolute w-5 h-5 transition-all duration-500 ${
              theme === 'dark'
                ? 'rotate-0 scale-100 opacity-100'
                : 'rotate-90 scale-0 opacity-0'
            }`}
          />
          {/* Moon icon for dark mode (shows when in light mode) */}
          <Moon
            className={`absolute w-5 h-5 transition-all duration-500 ${
              theme === 'light'
                ? 'rotate-0 scale-100 opacity-100'
                : '-rotate-90 scale-0 opacity-0'
            }`}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>Switch to {theme === 'dark' ? 'light' : 'dark'} mode</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default ThemeToggle;
