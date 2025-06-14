// src/components/GenerationProgressModal.tsx
import React from 'react';
import { CheckCircle, XCircle, Loader2, Sparkles, Wand2, Image as ImageIcon, Globe, Save } from 'lucide-react'; // Using more specific icons

export interface ProgressStage { // Exporting for use in ContentGenerator
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  icon?: React.ElementType;
}

interface GenerationProgressModalProps {
  stages: ProgressStage[];
  currentStageId: string | null; // To highlight the current stage
}

const GenerationProgressModal: React.FC<GenerationProgressModalProps> = ({ stages, currentStageId }) => {
  const getStatusIcon = (status: ProgressStage['status'], DefaultIcon?: React.ElementType) => {
    const iconClass = "w-5 h-5"; // Common class for icons
    if (status === 'in-progress') return DefaultIcon ? <DefaultIcon className={`${iconClass} text-accent animate-pulse`} /> : <Loader2 className={`${iconClass} text-accent animate-spin`} />;
    if (status === 'completed') return <CheckCircle className={`${iconClass} text-green-500`} />;
    if (status === 'error') return <XCircle className={`${iconClass} text-red-500`} />;
    // Pending
    return DefaultIcon ? <DefaultIcon className={`${iconClass} text-gray-400`} /> : <div className="w-5 h-5 border-2 border-gray-400 rounded-full" />;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out">
      <div className="cosmic-card border-0 cosmic-glow p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-100">
        <div className="text-center mb-6">
          <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-accent mx-auto mb-4 animate-bounce" /> {/* Changed animation */}
          <h2 className="text-xl md:text-2xl font-bold text-white">Crafting Your Cosmic Content...</h2>
          <p className="text-gray-300 text-sm md:text-base">Our AI agents are aligning the stars. Please wait.</p>
        </div>

        <div className="space-y-3 md:space-y-4 max-h-[60vh] overflow-y-auto pr-2"> {/* Scroll for many stages */}
          {stages.map((stage) => (
            <div
              key={stage.id}
              className={`flex items-start space-x-3 p-3 rounded-lg transition-all duration-300
                          ${stage.id === currentStageId && stage.status === 'in-progress' ? 'bg-white/10 ring-1 ring-accent' : 
                            stage.status === 'pending' ? 'bg-white/5 opacity-70' :
                            'bg-white/5'}`}
            >
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center pt-1">
                {getStatusIcon(stage.status, stage.icon)}
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold text-sm md:text-base
                  ${stage.status === 'completed' ? 'text-green-400' : 
                    stage.status === 'error' ? 'text-red-400' : 
                    stage.status === 'in-progress' ? 'text-accent' : 'text-white'}`
                  }>
                  {stage.label}
                </h3>
                <p className={`text-xs md:text-sm 
                  ${stage.status === 'in-progress' ? 'text-gray-200' : 
                    stage.status === 'completed' ? 'text-gray-400 italic' : // Different style for completed description
                    stage.status === 'error' ? 'text-red-300' : 
                    'text-gray-500'}` // Pending description
                 }>
                  {stage.status === 'in-progress' ? stage.description : 
                   stage.status === 'completed' ? 'Done!' :
                   stage.status === 'error' ? 'An issue occurred here.' :
                   stage.description} {/* Show original description for pending */}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto" />
          <p className="text-xs text-gray-400 mt-2">This may take a few moments...</p>
        </div>
      </div>
    </div>
  );
};

export default GenerationProgressModal;