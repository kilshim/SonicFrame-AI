import React, { useState, useEffect, useRef } from 'react';
import VideoUploader from './components/VideoUploader';
import AnalysisView from './components/AnalysisView';
import ResultView from './components/ResultView';
import StepIndicator from './components/StepIndicator';
import GuideSection from './components/GuideSection';
import { AppStep, VideoAnalysis, AudioTrack } from './types';
import { analyzeVideoContent, optimizePromptForSoundGen } from './services/geminiService';
import { generateSoundEffect } from './services/elevenLabsService';
import Button from './components/Button';

const App: React.FC = () => {
  // State
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.UPLOAD);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(10); // Default 10s
  
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [generatedAudio, setGeneratedAudio] = useState<AudioTrack | null>(null);
  const [finalPromptUsed, setFinalPromptUsed] = useState<string>("");
  
  // API Key State
  const [elevenLabsKey, setElevenLabsKey] = useState<string>('');
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Pending file state (waiting for API key)
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  
  // Loading states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load key from local storage on mount
  useEffect(() => {
    const savedElevenKey = localStorage.getItem('elevenLabsKey');
    const savedGeminiKey = localStorage.getItem('geminiKey');
    if (savedElevenKey) setElevenLabsKey(savedElevenKey);
    if (savedGeminiKey) setGeminiKey(savedGeminiKey);
  }, []);

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  // Save key when changed
  const handleElevenKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setElevenLabsKey(newKey);
    localStorage.setItem('elevenLabsKey', newKey);
  };

  const handleGeminiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setGeminiKey(newKey);
    localStorage.setItem('geminiKey', newKey);
  };

  // Clear key function
  const handleClearKey = (type: 'gemini' | 'eleven') => {
      if (confirm("저장된 API 키를 삭제하시겠습니까?")) {
          if (type === 'gemini') {
              setGeminiKey('');
              localStorage.removeItem('geminiKey');
          } else {
              setElevenLabsKey('');
              localStorage.removeItem('elevenLabsKey');
          }
      }
  };

  const handleSettingsDone = () => {
      setShowSettings(false);
      // If we have a pending file and now have a key, start analysis
      if (pendingFile && geminiKey) {
          handleFileSelect(pendingFile); // Retry processing
          setPendingFile(null);
      }
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  // Helper to get video duration
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            resolve(video.duration);
        };
        video.onerror = () => {
            resolve(10); // Fallback
        }
        video.src = URL.createObjectURL(file);
    });
  };

  const processVideoAnalysis = async (file: File, key: string) => {
      setIsAnalyzing(true);
      setCurrentStep(AppStep.ANALYSIS);
      try {
        const result = await analyzeVideoContent(file, key.trim());
        setAnalysis(result);
      } catch (err: any) {
          setError(err.message || "영상 분석에 실패했습니다. Gemini API 키를 확인해주세요.");
          setCurrentStep(AppStep.UPLOAD);
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleFileSelect = async (file: File) => {
    setError(null);
    setVideoFile(file);
    
    // Create URL immediately so user sees something happened (if we had a preview)
    const url = URL.createObjectURL(file);
    setVideoUrl(url);

    // Get Duration
    const duration = await getVideoDuration(file);
    setVideoDuration(duration);
    console.log("Detected video duration:", duration);

    // Check key
    if (!geminiKey) {
        setPendingFile(file);
        setShowSettings(true);
        return;
    }

    // Start Analysis
    processVideoAnalysis(file, geminiKey);
  };

  const handleRegenerateAnalysis = () => {
      if (videoFile && geminiKey) {
          processVideoAnalysis(videoFile, geminiKey);
      }
  };

  const handleGenerateAudio = async (selectedPrompt: string, isCustom: boolean) => {
    if (!analysis) return;
    
    setIsGenerating(true);
    setError(null);
    setCurrentStep(AppStep.GENERATION);
    
    try {
      let promptToUse = selectedPrompt;
      setFinalPromptUsed(promptToUse); 

      if (isCustom && geminiKey) {
          console.log("Optimizing custom prompt:", selectedPrompt);
          promptToUse = await optimizePromptForSoundGen(selectedPrompt, geminiKey.trim());
          setFinalPromptUsed(promptToUse); 
      }

      const keyToUse = elevenLabsKey.trim();
      const audioResult = await generateSoundEffect(promptToUse, keyToUse, videoDuration);
      
      setGeneratedAudio(audioResult);
      setCurrentStep(AppStep.RESULT);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "오디오 생성에 실패했습니다.");
      setCurrentStep(AppStep.ANALYSIS);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetryOrSimulate = (simulate: boolean) => {
      if (!analysis || analysis.suggestedAudioPrompts.length === 0) return;
      const prompt = finalPromptUsed || analysis.suggestedAudioPrompts[0];
      
      if (simulate) {
          const originalKey = elevenLabsKey;
          setElevenLabsKey(""); 
          setIsGenerating(true);
          setError(null);
          setCurrentStep(AppStep.GENERATION);
          generateSoundEffect(prompt, null, videoDuration)
            .then(res => {
                setGeneratedAudio(res);
                setCurrentStep(AppStep.RESULT);
                setElevenLabsKey(originalKey); 
            })
            .catch(e => {
                setError(e.message);
                setIsGenerating(false);
                setElevenLabsKey(originalKey);
            })
            .finally(() => setIsGenerating(false));
      } else {
          handleGenerateAudio(prompt, false);
      }
  };

  const handleBackToAnalysis = () => {
      // Clear generated audio but keep analysis and video
      setGeneratedAudio(null);
      setCurrentStep(AppStep.ANALYSIS);
  };

  const handleReset = () => {
    setVideoFile(null);
    setAnalysis(null);
    setGeneratedAudio(null);
    setCurrentStep(AppStep.UPLOAD);
    setError(null);
    setFinalPromptUsed("");
    setPendingFile(null);
  };

  return (
    <div className="min-h-screen bg-dark-900 text-slate-200 font-sans selection:bg-brand-500/30 flex flex-col">
        {/* Header (Top Bar) */}
        <header className="border-b border-slate-800 bg-dark-900/90 backdrop-blur-md sticky top-0 z-50 h-16 flex-none">
            <div className="max-w-full px-6 h-full flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        SonicFrame AI
                    </span>
                </div>
                
                <div className="relative">
                  <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all border ${showSettings ? 'bg-brand-900/50 border-brand-500 text-brand-300' : 'bg-dark-800 border-slate-700 text-slate-300 hover:bg-dark-700'}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    설정 {pendingFile && !geminiKey && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>}
                  </button>

                  {/* API Key Settings Dropdown */}
                  {showSettings && (
                      <div 
                          ref={settingsRef}
                          className="absolute top-12 right-0 w-96 bg-dark-800/95 backdrop-blur-xl border border-slate-600 rounded-xl shadow-2xl p-6 z-50 animate-fade-in-up origin-top-right"
                      >
                          <div className="flex justify-between items-center mb-4">
                              <h3 className="text-white font-semibold flex items-center gap-2">
                                  <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                  </svg>
                                  API 키 설정
                              </h3>
                              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                              </button>
                          </div>

                          {pendingFile && !geminiKey && (
                              <div className="mb-4 bg-brand-900/30 border border-brand-500/30 rounded-lg p-3 text-xs text-brand-200">
                                  ⚠️ 영상 분석을 시작하려면 Gemini API 키를 입력해주세요.
                              </div>
                          )}
                          
                          <div className="space-y-4">
                              {/* Gemini API Key Input */}
                              <div>
                                  <label className="block text-xs font-semibold text-brand-300 uppercase tracking-wider mb-2">
                                      Gemini API Key (필수)
                                  </label>
                                  <div className="relative flex items-center">
                                    <input
                                        type="password"
                                        value={geminiKey}
                                        onChange={handleGeminiKeyChange}
                                        placeholder="AI Studio 키 입력..."
                                        className="w-full bg-dark-900 border border-slate-600 rounded-lg px-4 py-2 pr-10 text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm"
                                    />
                                    {geminiKey && (
                                        <button 
                                            onClick={() => handleClearKey('gemini')}
                                            className="absolute right-2 text-slate-500 hover:text-red-400 transition-colors p-1"
                                            title="키 삭제"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                  </div>
                              </div>

                              <div className="h-px bg-slate-700 my-2"></div>

                              {/* ElevenLabs API Key Input */}
                              <div>
                                  <label className="block text-xs font-semibold text-brand-300 uppercase tracking-wider mb-2">
                                      ElevenLabs API Key (선택)
                                  </label>
                                  <div className="relative flex items-center">
                                    <input
                                        type="password"
                                        value={elevenLabsKey}
                                        onChange={handleElevenKeyChange}
                                        placeholder="sk-..."
                                        className="w-full bg-dark-900 border border-slate-600 rounded-lg px-4 py-2 pr-10 text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm"
                                    />
                                    {elevenLabsKey && (
                                        <button 
                                            onClick={() => handleClearKey('eleven')}
                                            className="absolute right-2 text-slate-500 hover:text-red-400 transition-colors p-1"
                                            title="키 삭제"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                  </div>
                                  <div className="flex justify-between items-center mt-1">
                                      <span className="text-xs text-slate-500">미입력 시 시뮬레이션 모드 사용</span>
                                  </div>
                              </div>
                          </div>
                          <div className="mt-6 pt-4 border-t border-slate-700">
                              <Button className="w-full py-2 text-sm" onClick={handleSettingsDone}>
                                  {pendingFile && geminiKey ? '저장하고 분석 시작' : '설정 완료'}
                              </Button>
                          </div>
                      </div>
                  )}
                </div>
            </div>
        </header>

        {/* Main Content - Split Layout */}
        <div className="flex-grow flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-64px)]">
            
            {/* Left Panel: Guide (Sticky/Scrollable) */}
            <aside className="w-full lg:w-[450px] flex-shrink-0 bg-dark-800/30 border-r border-slate-800 overflow-y-auto custom-scrollbar relative z-10">
                <div className="p-8">
                   <GuideSection />
                </div>
            </aside>

            {/* Right Panel: Interactive App */}
            <main className="flex-1 overflow-y-auto custom-scrollbar bg-dark-900 p-8 relative">
                
                <div className="max-w-4xl mx-auto">
                    <StepIndicator currentStep={currentStep} />

                    {/* Error Message */}
                    {error && (
                        <div className="mb-8 bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-lg flex flex-col gap-4 animate-fade-in">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium">{error}</span>
                            </div>
                            
                            {/* Interactive Recovery Options */}
                            {currentStep === AppStep.ANALYSIS && (
                                <div className="flex flex-col md:flex-row gap-4 items-center justify-between pl-8 w-full border-t border-red-500/20 pt-3 mt-1">
                                    <div className="flex-1 w-full md:w-auto">
                                        <input 
                                            type="password"
                                            placeholder="ElevenLabs API Key를 다시 입력하세요"
                                            value={elevenLabsKey}
                                            onChange={handleElevenKeyChange}
                                            className="w-full bg-red-950/30 border border-red-500/30 rounded px-3 py-1.5 text-sm text-red-100 placeholder-red-300/50 focus:outline-none focus:border-red-400"
                                        />
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="outline" 
                                            className="text-xs border-red-400 text-red-100 hover:bg-red-900/50 whitespace-nowrap h-9"
                                            onClick={() => handleRetryOrSimulate(false)}
                                        >
                                            다시 시도
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="text-xs border-slate-500 text-slate-300 hover:bg-slate-800 whitespace-nowrap h-9"
                                            onClick={() => handleRetryOrSimulate(true)}
                                        >
                                            시뮬레이션 사용
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* View Switching */}
                    <div className="transition-all duration-500">
                        {currentStep === AppStep.UPLOAD && (
                            <div className="animate-fade-in-up">
                                <div className="text-center mb-8">
                                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                                        영상에 <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">소리를 입혀보세요</span>
                                    </h1>
                                    <p className="text-slate-400 text-lg">
                                        파일을 업로드하면 AI가 분석부터 사운드 생성까지 자동으로 처리합니다.
                                    </p>
                                </div>
                                <VideoUploader onFileSelect={handleFileSelect} />
                            </div>
                        )}

                        {currentStep === AppStep.ANALYSIS && (
                            <div className="w-full flex flex-col items-center justify-center py-20 animate-fade-in">
                                {isAnalyzing ? (
                                    <>
                                        <div className="w-16 h-16 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-6"></div>
                                        <h2 className="text-2xl font-semibold text-white mb-2">장면 분석 중...</h2>
                                        <p className="text-slate-400">Gemini가 영상의 시각적 정보를 분석하고 있습니다.</p>
                                    </>
                                ) : analysis && (
                                    <AnalysisView 
                                        analysis={analysis} 
                                        onConfirm={handleGenerateAudio}
                                        onRegenerate={handleRegenerateAnalysis}
                                        onBack={handleReset}
                                        isLoading={isGenerating}
                                    />
                                )}
                            </div>
                        )}

                        {currentStep === AppStep.GENERATION && (
                            <div className="w-full flex flex-col items-center justify-center py-20 animate-fade-in">
                                <div className="relative w-24 h-24 mb-8">
                                    <div className="absolute inset-0 bg-brand-500/20 rounded-full animate-ping"></div>
                                    <div className="relative bg-dark-800 w-full h-full rounded-full border border-brand-500/50 flex items-center justify-center">
                                        <svg className="w-10 h-10 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                        </svg>
                                    </div>
                                </div>
                                <h2 className="text-2xl font-semibold text-white mb-2">효과음 생성 중...</h2>
                                <p className="text-slate-400 text-center max-w-md">
                                    {elevenLabsKey ? 'ElevenLabs API 호출 중' : '절차적 오디오 합성 중'}...<br/>
                                    <span className="text-brand-400 italic">"{finalPromptUsed.slice(0, 50)}..."</span>
                                </p>
                            </div>
                        )}

                        {currentStep === AppStep.RESULT && videoUrl && generatedAudio && (
                            <ResultView 
                                videoUrl={videoUrl}
                                audioTrack={generatedAudio}
                                onReset={handleReset}
                                onRetry={handleBackToAnalysis}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    </div>
  );
};

export default App;