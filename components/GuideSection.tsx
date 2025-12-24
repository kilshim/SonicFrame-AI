import React from 'react';

const GuideSection: React.FC = () => {
  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in text-left h-full">
      {/* Intro */}
      <div>
        <h2 className="text-xl lg:text-2xl font-bold text-white mb-2 lg:mb-4">사용 가이드</h2>
        <p className="text-slate-400 leading-relaxed text-sm">
          SonicFrame AI는 Gemini Vision의 시각 분석 능력과 ElevenLabs의 사운드 생성 기술을 결합하여, 
          영상에 딱 맞는 효과음(SFX)을 자동으로 생성해주는 도구입니다.
        </p>
      </div>

      <div className="h-px bg-slate-800"></div>

      {/* Steps */}
      <div className="space-y-6 lg:space-y-8">
        {/* Step 1 */}
        <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-900/50 text-brand-400 flex items-center justify-center font-bold border border-brand-500/30">1</div>
            <div className="flex-1">
                <h3 className="text-white font-semibold mb-2">API 키 준비 (필수)</h3>
                
                {/* Gemini Guide */}
                <div className="bg-dark-900 p-4 rounded-lg border border-slate-700 mb-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-brand-300 font-semibold text-sm">Gemini API Key</span>
                        <span className="text-[10px] bg-brand-900 text-brand-300 px-1.5 py-0.5 rounded border border-brand-700">무료 가능</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">영상의 내용을 분석하는 시각 지능 모델입니다.</p>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 hover:underline">
                        <span>Google AI Studio에서 키 발급받기</span>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                </div>

                {/* ElevenLabs Guide */}
                <div className="bg-dark-900 p-4 rounded-lg border border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-brand-300 font-semibold text-sm">ElevenLabs API Key</span>
                        <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600">유료 권장</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">고품질 사운드 효과(SFX)를 생성합니다.</p>
                    
                    <div className="space-y-2">
                        <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noreferrer" className="text-xs text-white hover:text-brand-400 flex items-center gap-1 bg-slate-800 px-3 py-2 rounded border border-slate-600 hover:border-brand-500 transition-colors">
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                            <span>API 키 확인 및 복사하기</span>
                        </a>
                        
                        <a href="https://elevenlabs.io/pricing" target="_blank" rel="noreferrer" className="text-xs text-white hover:text-brand-400 flex items-center gap-1 bg-slate-800 px-3 py-2 rounded border border-slate-600 hover:border-brand-500 transition-colors">
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                            <span>크레딧 구매 (Pricing) 페이지</span>
                        </a>
                    </div>
                    
                    <div className="mt-3 p-2 bg-yellow-900/10 border border-yellow-700/30 rounded text-xs text-yellow-500/80 leading-snug">
                        <strong>💡 참고:</strong> 사운드 생성은 많은 컴퓨팅 자원을 소모하므로 ElevenLabs 무료 계정의 크레딧이 빠르게 소진될 수 있습니다. <br/>
                        키 미입력 시 <strong>무료 시뮬레이션 모드</strong>(낮은 퀄리티)로 작동합니다.
                    </div>
                </div>
            </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold border border-slate-700">2</div>
            <div>
                <h3 className="text-white font-semibold mb-1">영상 업로드</h3>
                <p className="text-sm text-slate-400">
                    우측 영역에 영상 파일(.mp4, .mov 등)을 업로드하세요. Gemini가 자동으로 영상을 분석합니다.
                </p>
            </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold border border-slate-700">3</div>
            <div>
                <h3 className="text-white font-semibold mb-1">프롬프트 확인 및 수정</h3>
                <p className="text-sm text-slate-400">
                    AI가 제안한 스타일을 그대로 사용하거나, 텍스트 박스에 내용을 직접 입력/수정하여 원하는 소리를 만드세요.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GuideSection;