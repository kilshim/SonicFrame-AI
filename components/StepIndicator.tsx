import React from 'react';
import { AppStep } from '../types';

interface StepIndicatorProps {
  currentStep: AppStep;
}

const steps = [
  { id: AppStep.UPLOAD, label: '영상 업로드' },
  { id: AppStep.ANALYSIS, label: 'AI 분석' },
  { id: AppStep.GENERATION, label: '오디오 생성' },
  { id: AppStep.RESULT, label: '결과 확인' },
];

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="w-full max-w-3xl mx-auto mb-12">
      <div className="flex items-center justify-between relative">
        {/* Connector Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-800 -z-10"></div>
        
        {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
                <div key={step.id} className="flex flex-col items-center gap-2 bg-dark-900 px-2">
                    <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                        ${isActive ? 'border-brand-500 bg-brand-900/20 text-brand-400 shadow-[0_0_15px_rgba(14,165,233,0.5)]' : ''}
                        ${isCompleted ? 'border-brand-600 bg-brand-600 text-white' : ''}
                        ${!isActive && !isCompleted ? 'border-slate-700 bg-dark-800 text-slate-500' : ''}
                        `}
                    >
                        {isCompleted ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <span className="text-sm font-bold">{index + 1}</span>
                        )}
                    </div>
                    <span className={`text-xs font-medium uppercase tracking-wider ${isActive ? 'text-brand-400' : 'text-slate-500'}`}>
                        {step.label}
                    </span>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;