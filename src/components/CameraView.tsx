import { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Camera as CameraIcon, RefreshCw } from 'lucide-react';

interface CameraViewProps {
  onCapture: (imageDataUrl: string) => void;
}

export interface CameraViewActions {
  capture: () => void;
  getFrame: () => string | null;
}

const CameraView = forwardRef<CameraViewActions, CameraViewProps>(({ onCapture }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize camera
  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setHasStarted(true);
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        setErrorMsg("Failed to access camera. Please check permissions.");
      }
    };

    startCamera();

    // Cleanup stream on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      onCapture(dataUrl);
    }
  }, [onCapture]);

  const getFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState !== 4) return null; // Ensure video is playing
    const context = canvas.getContext('2d');
    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.5); // Fast, low-quality frame for detection
    }
    return null;
  }, []);

  useImperativeHandle(ref, () => ({
    capture: captureFrame,
    getFrame
  }));

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {!hasStarted && !errorMsg && (
        <div className="absolute inset-0 flex items-center justify-center text-white z-10 flex-col bg-black">
          <RefreshCw className="animate-spin mb-4" size={32} />
          <p className="text-sm font-bold tracking-widest uppercase">Initializing Camera...</p>
        </div>
      )}

      {errorMsg && (
        <div className="absolute inset-0 flex items-center justify-center text-white z-10 flex-col bg-black p-6 text-center">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4">
            <CameraIcon size={32} />
          </div>
          <p className="text-red-400 font-bold mb-2 uppercase text-xs tracking-widest">Camera Error</p>
          <p className="text-sm text-gray-500">{errorMsg}</p>
        </div>
      )}
      
      <video 
        ref={videoRef} 
        className="w-full h-full object-cover" 
        playsInline 
        muted 
      />
      
      {/* Hidden canvas for capturing frames */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
});

CameraView.displayName = 'CameraView';
export default CameraView;
