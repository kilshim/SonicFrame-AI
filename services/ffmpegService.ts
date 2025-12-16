import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export const mergeVideoAndAudio = async (
    videoUrl: string, 
    audioUrl: string
): Promise<string> => {
    if (!ffmpeg) {
        ffmpeg = new FFmpeg();
    }

    if (!ffmpeg.loaded) {
        try {
            // Using unpkg for consistent versioning with index.html importmap
            const coreVersion = '0.12.10';
            const coreBaseURL = `https://unpkg.com/@ffmpeg/core@${coreVersion}/dist/esm`;
            const ffmpegBaseURL = `https://unpkg.com/@ffmpeg/ffmpeg@${coreVersion}/dist/esm`;
            
            console.log("Loading FFmpeg core...");
            
            // Load all assets as Blobs to bypass cross-origin worker restrictions.
            // We must provide workerURL to prevent the library from trying to spawn a worker from the CDN directly.
            await ffmpeg.load({
                coreURL: await toBlobURL(`${coreBaseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${coreBaseURL}/ffmpeg-core.wasm`, 'application/wasm'),
                workerURL: await toBlobURL(`${ffmpegBaseURL}/worker.js`, 'text/javascript'),
            });
            console.log("FFmpeg loaded successfully.");
        } catch (e) {
            console.error("Failed to load FFmpeg:", e);
            throw new Error(
                "브라우저 보안 설정(Cross-Origin)으로 인해 영상 병합 엔진을 로드할 수 없습니다. " +
                "이 기능은 보안 헤더(COOP/COEP)가 설정된 서버 환경이 필요할 수 있습니다."
            );
        }
    }

    const inputVideoName = 'input.mp4';
    const inputAudioName = 'input.mp3';
    const outputName = 'output.mp4';

    try {
        console.log("Writing files to FFmpeg FS...");
        await ffmpeg.writeFile(inputVideoName, await fetchFile(videoUrl));
        await ffmpeg.writeFile(inputAudioName, await fetchFile(audioUrl));

        console.log("Running FFmpeg merge command...");
        // Command: Copy video stream, Re-encode audio to AAC (safest for MP4 container), Shortest length wins
        await ffmpeg.exec([
            '-i', inputVideoName,
            '-i', inputAudioName,
            '-c:v', 'copy',      // Fast copy
            '-c:a', 'aac',       // Standard audio codec
            '-strict', 'experimental',
            '-map', '0:v:0',     // Video from file 0
            '-map', '1:a:0',     // Audio from file 1
            '-shortest',         // Stop at shortest stream end
            outputName
        ]);

        console.log("Reading output file...");
        const data = await ffmpeg.readFile(outputName);
        const blob = new Blob([data], { type: 'video/mp4' });
        return URL.createObjectURL(blob);
    } catch (error: any) {
        console.error("FFmpeg processing error:", error);
        throw new Error("영상 병합 중 내부 오류가 발생했습니다: " + (error.message || "Unknown error"));
    } finally {
        // Cleanup
        try {
            await ffmpeg.deleteFile(inputVideoName);
            await ffmpeg.deleteFile(inputAudioName);
            await ffmpeg.deleteFile(outputName);
        } catch(e) {}
    }
};