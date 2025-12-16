import React, { useState, useEffect } from 'react';
import { VideoAnalysis } from '../types';
import Button from './Button';

interface AnalysisViewProps {
  analysis: VideoAnalysis;
  onConfirm: (selectedPrompt: string, isCustom: boolean) => void;
  onRegenerate: () => void; // New prop for re-analyzing
  onBack: () => void;      // New prop for going back to upload
  isLoading: boolean;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, onConfirm, onRegenerate, onBack, isLoading }) => {
  // Store selected indices
  const [selectedIndices, setSelectedIndices] = useState<number[]>([0]); // Default select the first one
  const [customInput, setCustomInput] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  // Toggle selection logic
  const toggleSelection = (index: number) => {
    setSelectedIndices(prev => {
        if (prev.includes(index)) {
            return prev.filter(i => i !== index);
        } else {
            return [...prev, index].sort();
        }
    });
  };

  // Generate the combined prompt string
  const getCombinedPrompt = () => {
    const parts = [];
    // Add selected suggestions
    selectedIndices.forEach(idx => {
        if (analysis.suggestedAudioPrompts[idx]) {
            parts.push(analysis.suggestedAudioPrompts[idx]);
        }
    });
    // Add custom input
    if (customInput.trim()) {
        parts.push(customInput.trim());
    }
    // Join with period and space to clearly separate thoughts for the AI optimizer
    return parts.join('. '); 
  };

  const finalPrompt = getCombinedPrompt();

  // Reset form
  const handleResetSelection = () => {
      setSelectedIndices([]);
      setCustomInput('');
  };

  // Copy to clipboard
  const handleCopy = async () => {
      if (!finalPrompt) return;
      try {
          await navigator.clipboard.writeText(finalPrompt);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
          console.error("Copy failed", err);
      }
  };

  const handleConfirm = () => {
    if (!finalPrompt.trim()) {
        alert("사운드 스타일을 선택하거나 내용을 입력해주세요.");
        return;
    }
    // Pass true for isCustom to ensure the optimizer cleans up the combined prompt
    onConfirm(finalPrompt, true);
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in h-full">
      
      {/* Visual Breakdown */}
      <div className="bg-dark-800 p-6 rounded-xl border border-slate-700 shadow-lg">
        <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-brand-400 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                영상 분석 결과
            </h3>
            <button 
                onClick={onBack}
                className="text-xs text-slate-500 hover:text-white underline underline-offset-4"
            >
                다른 영상 업로드
            </button>
        </div>
        
        <p className="text-slate-300 leading-relaxed mb-6 bg-dark-900/50 p-4 rounded-lg border border-slate-700/50">
            {analysis.sceneDescription}
        </p>

            <h3 className="text-sm font-semibold text-slate-400 mb-3 flex items-center">
            감지된 이벤트 및 분위기
        </h3>
        <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full bg-brand-900/40 text-brand-300 text-sm border border-brand-800">
                {analysis.mood}
            </span>
            {analysis.detectedEvents.map((event, idx) => (
                <span key={idx} className="px-3 py-1 rounded-full bg-slate-700 text-slate-300 text-sm">
                    {event}
                </span>
            ))}
        </div>
      </div>

      {/* Audio Selection */}
      <div className="flex flex-col bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-lg flex-grow">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                사운드 프롬프트 빌더
            </h3>
            <div className="flex gap-2">
                <button 
                    onClick={onRegenerate}
                    disabled={isLoading}
                    className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 bg-brand-900/20 px-2 py-1 rounded border border-brand-500/30 hover:border-brand-500 transition-all disabled:opacity-50"
                    title="Gemini에게 다시 분석 요청"
                >
                    <svg className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    분석 다시 하기
                </button>
                <button 
                    onClick={handleResetSelection}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-1 rounded border border-slate-700 hover:border-slate-500 transition-all"
                    title="선택 초기화"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    선택 해제
                </button>
            </div>
        </div>
        
        <p className="text-slate-400 text-sm mb-6">
            AI가 영상을 분석하여 <span className="text-brand-400 font-bold">사실적인 효과음(Foley)</span>을 제안했습니다. 
        </p>
        
        <div className="space-y-3 mb-6">
            {/* Suggested Prompt (Single, Realistic) */}
            {analysis.suggestedAudioPrompts.length > 0 && (
                <div 
                    onClick={() => toggleSelection(0)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all relative overflow-hidden group ${
                        selectedIndices.includes(0)
                        ? 'border-brand-500 bg-brand-900/20 ring-1 ring-brand-500' 
                        : 'border-slate-700 bg-dark-800 hover:border-slate-500 hover:bg-dark-700'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-bold uppercase tracking-wider ${selectedIndices.includes(0) ? 'text-brand-400' : 'text-slate-400'}`}>
                            AI 추천 스타일 (Realistic)
                        </span>
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                            selectedIndices.includes(0) ? 'bg-brand-500 border-brand-500' : 'border-slate-600 bg-dark-900'
                        }`}>
                            {selectedIndices.includes(0) && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                    </div>
                    <p className="text-slate-300 text-sm pr-6">{analysis.suggestedAudioPrompts[0]}</p>
                </div>
            )}

            {/* Custom Input */}
            <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                    직접 입력 또는 수정 요청 (선택사항)
                </label>
                <textarea 
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="예: '바람 소리를 더 크게 해줘' 처럼 수정 내용을 적거나, 위 내용을 무시하고 원하는 소리를 직접 묘사하세요."
                    className="w-full bg-black/30 border border-slate-600 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-brand-500 min-h-[60px] placeholder-slate-600"
                />
            </div>
        </div>

        {/* Final Preview & Actions */}
        <div className="mt-auto bg-dark-950 rounded-lg p-4 border border-slate-800">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">최종 프롬프트 미리보기</span>
                <button 
                    onClick={handleCopy}
                    className={`text-xs flex items-center gap-1 transition-colors ${isCopied ? 'text-green-400' : 'text-slate-400 hover:text-brand-400'}`}
                >
                    {isCopied ? (
                        <>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            복사됨!
                        </>
                    ) : (
                        <>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            복사
                        </>
                    )}
                </button>
            </div>
            <div className="text-sm text-slate-300 italic min-h-[40px] break-words">
                {finalPrompt ? (
                    `"${finalPrompt}"`
                ) : (
                    <span className="text-slate-600 not-italic">위 추천 스타일을 선택하거나 내용을 입력하세요.</span>
                )}
            </div>
        </div>
        
        <div className="mt-4">
            <Button onClick={handleConfirm} isLoading={isLoading} className="w-full" disabled={!finalPrompt.trim()}>
                오디오 생성 시작
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </Button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;