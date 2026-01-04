import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Camera,
  Play,
  Sun,
  Zap,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const VideoPromptGuide = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const tips = [
    {
      icon: Camera,
      title: 'Camera Movement',
      description: 'Describe how the camera should move',
      examples: [
        'Aerial drone shot descending',
        'Smooth tracking shot following the subject',
        'Dolly zoom effect',
        'Handheld perspective',
      ],
      color: 'text-blue-400',
    },
    {
      icon: Play,
      title: 'Subject Action',
      description: 'Define what the subject is doing',
      examples: [
        'Walking slowly forward',
        'Gentle rotation in place',
        'Leaves falling softly',
        'Waves crashing on shore',
      ],
      color: 'text-purple-400',
    },
    {
      icon: Sun,
      title: 'Lighting & Environment',
      description: 'Set the mood with lighting details',
      examples: [
        'Golden hour sunlight',
        'Neon-lit cyberpunk street',
        'Soft diffused morning light',
        'Dramatic sunset glow',
      ],
      color: 'text-amber-400',
    },
    {
      icon: Zap,
      title: 'Timing & Pace',
      description: 'Consider the 8-second duration',
      examples: [
        'Slow and smooth motion',
        'Gradual reveal of landscape',
        'Quick but controlled movement',
        'Gentle continuous zoom',
      ],
      color: 'text-green-400',
    },
  ];

  const dos = [
    'Focus on a single action or movement',
    'Use realistic, physically possible motions',
    'Keep prompts concise (<100 words)',
    'Describe camera angles and movements',
    'Specify lighting and atmosphere',
  ];

  const donts = [
    "Don't include multiple simultaneous actions",
    "Avoid physically impossible movements",
    "Don't request abrupt scene changes",
    "Avoid vague descriptions like 'cool video'",
    "Don't forget to describe camera movement",
  ];

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="ghost"
          className="w-full justify-between hover:bg-white/5 p-3"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-accent" />
            <span className="font-medium text-white">Video Prompt Guide</span>
            <Badge variant="outline" className="border-accent/50 text-accent text-xs">
              Tips
            </Badge>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </Button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4">
                {/* Essential Elements */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-accent" />
                    Essential Elements
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tips.map((tip, index) => {
                      const Icon = tip.icon;
                      return (
                        <div
                          key={index}
                          className="p-3 rounded-lg bg-background/50 border border-primary/10"
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <Icon className={`w-4 h-4 ${tip.color} flex-shrink-0 mt-0.5`} />
                            <div>
                              <h5 className="text-sm font-medium text-white">{tip.title}</h5>
                              <p className="text-xs text-gray-400 mt-0.5">{tip.description}</p>
                            </div>
                          </div>
                          <div className="mt-2 space-y-1">
                            {tip.examples.slice(0, 2).map((example, i) => (
                              <p key={i} className="text-xs text-gray-300 pl-6">
                                • {example}
                              </p>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Do's and Don'ts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Do's */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-green-400 flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Do's
                    </h4>
                    <div className="space-y-1">
                      {dos.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-xs text-gray-300"
                        >
                          <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Don'ts */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                      <XCircle className="w-3.5 h-3.5" />
                      Don'ts
                    </h4>
                    <div className="space-y-1">
                      {donts.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-xs text-gray-300"
                        >
                          <XCircle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Example Prompt */}
                <div className="p-3 rounded-lg bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20">
                  <h4 className="text-sm font-semibold text-accent mb-2">Example Prompt</h4>
                  <p className="text-xs text-gray-200 leading-relaxed">
                    "Aerial drone shot descending toward a mountain lake at sunrise, smooth and
                    slow camera movement revealing misty forest in the background, golden hour
                    lighting with soft reflections on calm water"
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default VideoPromptGuide;
