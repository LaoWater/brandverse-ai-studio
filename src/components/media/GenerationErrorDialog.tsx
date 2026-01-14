import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  RefreshCw,
  Clock,
  XCircle,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';

export interface GenerationError {
  type?: string;
  code?: number;
  title?: string;
  message?: string;
  suggestion?: string;
  operationId?: string;
  retryable?: boolean;
}

interface GenerationErrorDialogProps {
  open: boolean;
  onClose: () => void;
  onRetry?: () => void;
  error: GenerationError | string | null;
}

// Parse error message to extract structured error if possible
const parseError = (error: GenerationError | string | null): GenerationError => {
  if (!error) {
    return {
      title: "Something Went Wrong",
      message: "An unexpected error occurred.",
      suggestion: "Please try again.",
      retryable: true,
    };
  }

  if (typeof error === 'string') {
    // Try to parse as JSON (structured error from backend)
    try {
      const parsed = JSON.parse(error);
      if (parsed.type === 'GOOGLE_API_ERROR') {
        return parsed;
      }
    } catch {
      // Not JSON, use as plain message
    }

    // Check for common error patterns
    if (error.includes('Internal error')) {
      return {
        type: 'GOOGLE_API_ERROR',
        code: 13,
        title: "Service Temporarily Unavailable",
        message: "Google's video generation service encountered a temporary issue.",
        suggestion: "This is usually resolved within a few minutes. Please try again shortly.",
        retryable: true,
      };
    }

    if (error.includes('timeout') || error.includes('Timeout') || error.includes('timed out')) {
      return {
        title: "Generation Taking Longer Than Expected",
        message: "The video is still being generated but took longer than expected.",
        suggestion: "Your video may still be processing. Check your library in a few minutes, or try again with a shorter duration.",
        retryable: true,
      };
    }

    if (error.includes('502') || error.includes('Bad Gateway') || error.includes('Failed to fetch')) {
      return {
        title: "Connection Interrupted",
        message: "The connection to the server was interrupted during generation.",
        suggestion: "Your video may still be processing in the background. Check your library in a few minutes, or try again.",
        retryable: true,
      };
    }

    if (error.includes('Insufficient credits')) {
      return {
        title: "Insufficient Credits",
        message: error,
        suggestion: "Purchase more credits to continue generating content.",
        retryable: false,
      };
    }

    return {
      title: "Generation Failed",
      message: error,
      suggestion: "Please try again with different settings.",
      retryable: true,
    };
  }

  return error;
};

const GenerationErrorDialog: React.FC<GenerationErrorDialogProps> = ({
  open,
  onClose,
  onRetry,
  error,
}) => {
  const parsedError = parseError(error);
  const isRetryable = parsedError.retryable !== false;
  const isGoogleError = parsedError.type === 'GOOGLE_API_ERROR';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-card/95 backdrop-blur-xl max-w-md border border-destructive/20 shadow-2xl">
        <DialogTitle className="sr-only">{parsedError.title}</DialogTitle>
        <DialogDescription className="sr-only">{parsedError.message}</DialogDescription>

        <div className="py-6">
          {/* Error Icon with Glow Effect */}
          <div className="relative flex justify-center mb-6">
            {/* Glow background */}
            <div className="absolute w-24 h-24 bg-destructive/20 rounded-full blur-xl" />

            {/* Icon container */}
            <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-destructive/30 to-destructive/10 border border-destructive/30 flex items-center justify-center">
              {isGoogleError ? (
                <Clock className="w-10 h-10 text-amber-400 animate-pulse" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-destructive" />
              )}
            </div>

            {/* Decorative rings */}
            <div className="absolute w-24 h-24 rounded-full border border-destructive/10 animate-ping" style={{ animationDuration: '2s' }} />
          </div>

          {/* Error Title */}
          <h3 className="text-2xl font-bold text-center text-white mb-2">
            {parsedError.title}
          </h3>

          {/* Error Message */}
          <p className="text-center text-gray-300 mb-4 px-2">
            {parsedError.message}
          </p>

          {/* Suggestion Box */}
          {parsedError.suggestion && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 mx-2">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-200">
                  {parsedError.suggestion}
                </p>
              </div>
            </div>
          )}

          {/* Google Service Notice (for Google API errors) */}
          {isGoogleError && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-6 mx-2">
              <p className="text-xs text-amber-200/80 text-center">
                This is a temporary issue with Google's AI service, not your request.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 px-2">
            {isRetryable && onRetry && (
              <Button
                onClick={() => {
                  onClose();
                  onRetry();
                }}
                className="flex-1 cosmic-button text-white font-semibold py-3"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="outline"
              className={`${isRetryable && onRetry ? 'flex-1' : 'w-full'} border-white/20 text-white hover:bg-white/10 py-3`}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>

          {/* Operation ID for debugging (small, subtle) */}
          {parsedError.operationId && (
            <p className="text-[10px] text-gray-500 text-center mt-4">
              Operation ID: {parsedError.operationId}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenerationErrorDialog;
