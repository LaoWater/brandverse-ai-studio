import React, { useState } from 'react';
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
  ShieldAlert,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface GenerationError {
  type?: string;
  code?: number | string;
  title?: string;
  message?: string;
  suggestion?: string;
  operationId?: string;
  retryable?: boolean;
  prompt?: string; // Original prompt for AI analysis
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
      if (parsed.type === 'GOOGLE_API_ERROR' || parsed.type === 'MODERATION_BLOCKED' || parsed.type === 'SORA_API_ERROR') {
        return parsed;
      }
    } catch {
      // Not JSON, use as plain message
    }

    // Check for moderation errors in plain text
    if (error.includes('moderation') || error.includes('blocked by our moderation')) {
      return {
        type: 'MODERATION_BLOCKED',
        code: 'moderation_blocked',
        title: 'Content Moderation Block',
        message: 'Your request was blocked by the AI moderation system.',
        suggestion: 'Try simplifying your prompt or removing potentially sensitive content.',
        retryable: true,
      };
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

// Supabase Edge Function URL
const SUPABASE_FUNCTION_URL = 'https://vcgaqikuaaazjpwyzvwb.supabase.co/functions/v1';

const GenerationErrorDialog: React.FC<GenerationErrorDialogProps> = ({
  open,
  onClose,
  onRetry,
  error,
}) => {
  const parsedError = parseError(error);
  const isRetryable = parsedError.retryable !== false;
  const isGoogleError = parsedError.type === 'GOOGLE_API_ERROR';
  const isModerationError = parsedError.type === 'MODERATION_BLOCKED';

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleAiAnalysis = async () => {
    if (!parsedError.prompt) {
      setAnalysisError('No prompt available for analysis');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAiAnalysis(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${SUPABASE_FUNCTION_URL}/analyze-moderation-error`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt: parsedError.prompt,
          error_code: parsedError.code,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis request failed');
      }

      const result = await response.json();
      setAiAnalysis(result.analysis);
    } catch (err: any) {
      setAnalysisError(err.message || 'Failed to analyze prompt');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-card/95 backdrop-blur-xl max-w-md border border-destructive/20 shadow-2xl">
        <DialogTitle className="sr-only">{parsedError.title}</DialogTitle>
        <DialogDescription className="sr-only">{parsedError.message}</DialogDescription>

        <div className="py-6">
          {/* Error Icon with Glow Effect */}
          <div className="relative flex justify-center mb-6">
            {/* Glow background */}
            <div className={`absolute w-24 h-24 rounded-full blur-xl ${isModerationError ? 'bg-orange-500/20' : 'bg-destructive/20'}`} />

            {/* Icon container */}
            <div className={`relative z-10 w-20 h-20 rounded-full border flex items-center justify-center ${
              isModerationError
                ? 'bg-gradient-to-br from-orange-500/30 to-orange-500/10 border-orange-500/30'
                : 'bg-gradient-to-br from-destructive/30 to-destructive/10 border-destructive/30'
            }`}>
              {isModerationError ? (
                <ShieldAlert className="w-10 h-10 text-orange-400" />
              ) : isGoogleError ? (
                <Clock className="w-10 h-10 text-amber-400 animate-pulse" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-destructive" />
              )}
            </div>

            {/* Decorative rings */}
            <div className={`absolute w-24 h-24 rounded-full border animate-ping ${isModerationError ? 'border-orange-500/10' : 'border-destructive/10'}`} style={{ animationDuration: '2s' }} />
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

          {/* Moderation Error Notice with AI Assistance */}
          {isModerationError && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-6 mx-2">
              <div className="space-y-3">
                <div className="text-xs text-orange-200/80">
                  <p className="font-medium mb-2">Common moderation triggers:</p>
                  <ul className="list-disc list-inside space-y-1 text-orange-200/70">
                    <li>References to faces, eyes, or close-up human features</li>
                    <li>Surreal or abstract imagery with human elements</li>
                    <li>Content that could be misinterpreted as manipulated media</li>
                    <li>Certain artistic styles combined with human subjects</li>
                  </ul>
                </div>

                {/* AI Analysis Section */}
                {aiAnalysis && (
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mt-3">
                    <p className="text-xs font-medium text-primary mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Analysis
                    </p>
                    <p className="text-xs text-gray-200 whitespace-pre-wrap">{aiAnalysis}</p>
                  </div>
                )}

                {analysisError && (
                  <p className="text-xs text-red-400 mt-2">{analysisError}</p>
                )}

                {/* AI Assistance Button */}
                {parsedError.prompt && !aiAnalysis && (
                  <Button
                    onClick={handleAiAnalysis}
                    disabled={isAnalyzing}
                    variant="outline"
                    size="sm"
                    className="w-full border-orange-500/30 text-orange-200 hover:bg-orange-500/10 mt-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                        Analyzing prompt...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 mr-2" />
                        Get AI Assistance
                      </>
                    )}
                  </Button>
                )}
              </div>
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
