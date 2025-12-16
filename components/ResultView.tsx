import React, { useRef, useState, useEffect } from 'react';
import { AudioTrack } from '../types';
import Button from './Button';

interface ResultViewProps {
  videoUrl: string;
  audioTrack: AudioTrack;
  onReset: () => void;
  onRetry: () => void; // New prop for going back to analysis
}

const ResultView: React.FC<ResultViewProps> = ({ videoUrl, audioTrack, onReset, onRetry }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(true);

  const togglePlay = async () => {
    if (videoRef.current && audioRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          // Reset both to start to ensure sync
          videoRef.current.currentTime = 0;
          audioRef.current.currentTime = 0;
          
          // Ensure volume is up
          audioRef.current.volume = 1.0;
          
          const videoPromise = videoRef.current.play();
          const audioPromise = audioRef.current.play();
          
          await Promise.all([videoPromise, audioPromise]);
          setIsPlaying(true);
        } catch (err) {
          console.error("Playback error:", err);
          setIsPlaying(false);
        }
      }
    }
  };

  // Sync pause if video ends
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;

    const handleEnded = () => {
        setIsPlaying(false);
        if(audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    };
    
    // Check if audio is ready
    const handleCanPlay = () => setIsAudioLoading(false);

    video?.addEventListener('ended', handleEnded);
    audio?.addEventListener('canplay', handleCanPlay);
    
    // Force load
    if (audio) {
        audio.load();
    }

    // Initial check
    if(audio?.readyState && audio.readyState >= 3) {
      setIsAudioLoading(false);
    }

    return () => {
      video?.removeEventListener('ended', handleEnded);
      audio?.removeEventListener('canplay', handleCanPlay);
    };
  }, [audioTrack.url]);

  const downloadAudioOnly = () => {
      const a = document.createElement('a');
      a.href = audioTrack.url;
      a.download = audioTrack.name;
      a.click();
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center animate-fade-in pb-10">
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-700 mb-8 group">
        
        {/* Video is muted to let the generated audio take precedence */}
        <video 
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            playsInline
            muted 
        />
        
        <audio 
            ref={audioRef}
            src={audioTrack.url}
            loop={false}
            preload="auto"
            crossOrigin="anonymous"
        />

        {/* Overlay Controls */}
        <div className="absolute inset-0 bg-black/10 hover:bg-black/40 flex items-center justify-center transition-all duration-300">
            <button 
                onClick={togglePlay}
                disabled={isAudioLoading}
                className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md hover:bg-brand-500 hover:scale-105 flex items-center justify-center text-white transition-all shadow-xl border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-110"
            >
                {isAudioLoading ? (
                  <svg className="animate-spin w-10 h-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : isPlaying ? (
                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                         <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                ) : (
                    <svg className="w-12 h-12 ml-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                )}
            </button>
        </div>
        
        <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 rounded-full text-xs text-white backdrop-blur-sm border border-white/10 flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
           AI Audio Active
        </div>
      </div>

      <div className="w-full bg-dark-800 p-6 rounded-xl border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div>
            <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                생성된 사운드 효과
            </h3>
            <p className="text-slate-400 text-sm mt-1">
                영상에 최적화된 오디오 파일입니다.
            </p>
        </div>
        <div>
             <Button 
                onClick={downloadAudioOnly} 
                variant="primary"
                className="w-full md:w-auto bg-brand-600 hover:bg-brand-500 text-white shadow-brand-500/20"
             >
                오디오 파일 다운로드 (.mp3)
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
             </Button>
        </div>
      </div>
      
      {/* Navigation Buttons Row */}
      <div className="w-full mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
         <Button 
            onClick={onRetry} 
            variant="outline" 
            className="h-12 border-slate-600 hover:border-brand-500 hover:text-brand-400"
         >
             <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
             </svg>
             다른 스타일로 다시 생성
         </Button>
         
         <Button 
            onClick={onReset} 
            variant="secondary" 
            className="h-12 bg-slate-700 hover:bg-slate-600 text-white"
         >
             <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
             </svg>
             새 영상 업로드
         </Button>
      </div>
    </div>
  );
};

export default ResultView;