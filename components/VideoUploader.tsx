import React, { useRef, useState } from 'react';
import Button from './Button';

interface VideoUploaderProps {
  onFileSelect: (file: File) => void;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onFileSelect }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const validateAndUpload = (file: File) => {
    // Check MIME type or file extension
    const validExtensions = /\.(mp4|mov|avi|webm|mkv|m4v)$/i;
    const isVideoType = file.type.startsWith('video/');
    const hasVideoExtension = validExtensions.test(file.name);

    if (isVideoType || hasVideoExtension) {
      // Increased limit to 100MB as requested
      const maxSize = 100 * 1024 * 1024; // 100MB
      
      if (file.size > maxSize) {
          alert(`파일 크기가 너무 큽니다 (${(file.size / 1024 / 1024).toFixed(1)}MB). 100MB 이하의 영상을 업로드해주세요.`);
          return;
      }
      onFileSelect(file);
    } else {
      alert("지원하지 않는 파일 형식입니다. 비디오 파일(MP4, MOV 등)을 업로드해주세요.");
      console.error("File rejected:", file.type, file.name);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div 
      className={`relative w-full h-64 md:h-80 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-4 md:p-8 cursor-pointer
      ${dragActive ? 'border-brand-500 bg-brand-900/10' : 'border-slate-700 bg-dark-800/50 hover:border-slate-600 hover:bg-dark-800'}
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={onButtonClick}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="video/*,.mp4,.mov,.avi,.webm,.mkv"
        onChange={handleChange}
        onClick={(e) => (e.currentTarget.value = '')} // Reset value to allow re-selection of same file
      />
      
      <div className="w-12 h-12 md:w-16 md:h-16 mb-4 md:mb-6 rounded-full bg-slate-800 flex items-center justify-center text-brand-400 shadow-lg shadow-black/20">
        <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>

      <h3 className="text-lg md:text-xl font-semibold text-white mb-2">동영상 업로드</h3>
      <p className="text-slate-400 text-center mb-6 md:mb-8 max-w-sm leading-relaxed text-sm md:text-base">
        파일을 이곳에 드래그하거나 클릭하세요.
        <br/><span className="text-xs text-slate-500">(MP4, MOV, WEBM 지원 / 최대 100MB)</span>
      </p>

      <Button 
        onClick={(e) => { e.stopPropagation(); onButtonClick(); }} 
        variant="outline"
        className="bg-dark-900 border-brand-500/30 text-brand-400 hover:bg-brand-500 hover:text-white hover:border-transparent py-2 md:py-3"
      >
        파일 선택하기
      </Button>
    </div>
  );
};

export default VideoUploader;