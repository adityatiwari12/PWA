import { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle, ArrowLeft, RefreshCw, Cpu, 
  AlertTriangle,
  Image as ImageIcon,
  Scan as ScanIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CameraView, { type CameraViewActions } from '../../../components/CameraView';
import { scanPill, type ScanResult, type ScanProgressEvent } from '../../../lib/pillScanner';
import { useMedicationStore } from '../../../store/medicationStore';

// ---------------------------------------------------------------------------
// Types for local state
// ---------------------------------------------------------------------------
interface ManualCorrection {
  drug: string;
  dosage: string;
  expiry: string;
}

// ---------------------------------------------------------------------------
// Stage label helper
// ---------------------------------------------------------------------------
function stageLabelFor(evt: ScanProgressEvent): string {
  switch (evt.stage) {
    case 'preprocessing': return evt.detail || 'Enhancing image (CLAHE + Sharpen + Denoise)…';
    case 'analyzing':     return evt.detail || 'Sending to Sanjivani Vision AI…';
    case 'extracting':    return evt.detail || 'Scoring extraction confidence…';
    default:              return '';
  }
}



// ---------------------------------------------------------------------------
// Main Scan Page
// ---------------------------------------------------------------------------
export default function Scan() {
  const [scanResult,        setScanResult]        = useState<ScanResult | null>(null);
  const [capturedImageUrl,  setCapturedImageUrl]  = useState<string | null>(null);
  const [progressEvent,     setProgressEvent]     = useState<ScanProgressEvent | null>(null);
  const [manualCorrection,  setManualCorrection]  = useState<ManualCorrection>({
    drug: '', dosage: '', expiry: '',
  });

  // UX guidance states
  const [isReady, setIsReady] = useState(false);
  
  const navigate = useNavigate();
  const { setPendingScan } = useMedicationStore();
  const cameraRef = useRef<CameraViewActions>(null);

  // UX animation loop for real-time text detection
  const stableTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    if (capturedImageUrl) return;
    
    let isActive = true;
    let fallbackTick = 0;

    const interval = setInterval(async () => {
      const frame = cameraRef.current?.getFrame();
      if (!frame || !isActive) return;

      let detected = false;
      if ('TextDetector' in window) {
        try {
          const img = new Image();
          img.src = frame;
          await new Promise(r => img.onload = r);
          const detector = new (window as any).TextDetector();
          const texts = await detector.detect(img);
          detected = texts.length > 0;
        } catch(e) { /* ignore */ }
      } else {
        // Mock fallback text detection if API unavailable
        fallbackTick++;
        detected = fallbackTick > 3; 
      }

      if (detected) {
        setIsDetecting(true);
        
        // Wait 1.5s of stable detection to auto-capture
        if (!stableTimeoutRef.current) {
          stableTimeoutRef.current = setTimeout(() => {
            if (!isActive) return;
            setIsReady(true);
            if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]); // Haptic feedback
            
            setTimeout(() => {
              if (isActive) cameraRef.current?.capture();
            }, 600); // Brief pause to show state to user before snapping
          }, 1500);
        }
      } else {
        setIsDetecting(false);
        setIsReady(false);
        fallbackTick = 0;
        if (stableTimeoutRef.current) {
          clearTimeout(stableTimeoutRef.current);
          stableTimeoutRef.current = null;
        }
      }
    }, 500);
    
    return () => {
      isActive = false;
      clearInterval(interval);
      if (stableTimeoutRef.current) clearTimeout(stableTimeoutRef.current);
    };
  }, [capturedImageUrl]);

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------
  const isProcessing = progressEvent !== null && progressEvent.stage !== 'done';

  const effectiveDrug   = manualCorrection.drug   || scanResult?.medication.drug   || '';
  const effectiveDosage = manualCorrection.dosage  || scanResult?.medication.dosage || '';
  const effectiveExpiry = manualCorrection.expiry  || scanResult?.medication.expiry || '';

  function resetScan() {
    setScanResult(null);
    setCapturedImageUrl(null);
    setProgressEvent(null);
    setManualCorrection({ drug: '', dosage: '', expiry: '' });
    setIsReady(false);
  }

  // --------------------------------------------------------------------------
  // Capture handler → full pipeline
  // --------------------------------------------------------------------------
  const handleCapture = async (imageDataUrl: string) => {
    setCapturedImageUrl(imageDataUrl);
    setScanResult(null);
    setManualCorrection({ drug: '', dosage: '', expiry: '' });
    setProgressEvent({ stage: 'preprocessing' });

    try {
      const result = await scanPill(imageDataUrl, (evt) => {
        setProgressEvent(evt);
      });

      setScanResult(result);
      setProgressEvent({ stage: 'done' });

      // Pre-fill manual correction with the extracted values
      setManualCorrection({
        drug:   result.medication.drug   !== 'Unknown' ? result.medication.drug   : '',
        dosage: result.medication.dosage ?? '',
        expiry: result.medication.expiry ?? '',
      });
    } catch (err) {
      console.error('[Scan] Pipeline failed:', err);
      setProgressEvent({ stage: 'done' });
      setScanResult({
        processedImageUrl: imageDataUrl,
        rawOcrText: '',
        cleanedOcrText: '',
        medication: { drug: 'Error', dosage: null, expiry: null, manufacturer: null, genericName: '', rxcui: '', rawText: '' },
        confidence: { score: 0, isLow: true, reasons: ['Pipeline failed unexpectedly'] },
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) handleCapture(result);
    };
    reader.readAsDataURL(file);
  };

  // --------------------------------------------------------------------------
  // Save handler
  // --------------------------------------------------------------------------
  const handleSave = async () => {
    setPendingScan({
      brandName: effectiveDrug   || 'Unknown',
      dosage:    effectiveDosage || null,
      expiryDate: effectiveExpiry || null,
      rawText:   scanResult?.rawOcrText ?? '',
      addedAt:   Date.now(),
    });
    navigate('/medication/confirm');
  };

  // --------------------------------------------------------------------------
  // Results view
  // --------------------------------------------------------------------------
  if (capturedImageUrl) {
    return (
      <div className="flex flex-col bg-white h-[100dvh] relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center px-5 pt-14 pb-3 bg-white shrink-0">
          <button
            onClick={resetScan}
            className="p-2 -ml-2 text-gray-700 active:scale-90 transition-transform"
          >
            <ArrowLeft size={24} strokeWidth={2.5} />
          </button>
          <h2 className="flex-1 text-center text-[18px] font-semibold text-gray-900 tracking-tight mr-8">
            Scan Result
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-2 pb-32">
          {/* Scanned Image Thumbnail */}
          <img
            src={scanResult?.processedImageUrl ?? capturedImageUrl}
            alt="Captured Medication"
            className="w-full h-[160px] object-cover rounded-[12px] mb-6 border border-gray-100 shadow-sm"
          />

          {/* Processing State */}
          {isProcessing && progressEvent && (
            <div className="w-full py-10 flex flex-col items-center justify-center">
              {progressEvent.stage === 'preprocessing' && (
                <RefreshCw className="animate-spin text-gray-400 mb-4" size={32} />
              )}
              {progressEvent.stage === 'analyzing' && (
                <Cpu className="animate-pulse text-[#E84040] mb-4" size={32} />
              )}
              {progressEvent.stage === 'extracting' && (
                <Cpu className="animate-pulse text-gray-800 mb-4" size={32} />
              )}
              <p className="text-[14px] font-medium text-gray-800 mb-3 text-center px-4">
                {stageLabelFor(progressEvent)}
              </p>
              {progressEvent.stage === 'analyzing' && (
                <div className="w-32 bg-gray-100 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-[#E84040] h-full w-full animate-pulse" />
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {!isProcessing && scanResult && (
            <div className="flex flex-col">
              
              {/* Title Row with Badge */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-medium text-gray-900">Detected Information</h3>
                <span className="text-[12px] font-medium bg-[#F59E0B] text-white px-2.5 py-1 rounded-full whitespace-nowrap">
                  {scanResult.confidence.score}% confidence
                </span>
              </div>

              {/* 3-Row Key-Value List */}
              <div className="flex flex-col space-y-4 mb-8">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-[12px] text-gray-500">Drug</span>
                  <span className="text-[14px] font-medium text-gray-900 text-right ms-4">{effectiveDrug || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-[12px] text-gray-500">Dosage</span>
                  <span className="text-[14px] font-medium text-gray-900 text-right ms-4">{effectiveDosage || 'Not found'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-[12px] text-gray-500">Expiry</span>
                  <span className="text-[14px] font-medium text-gray-900 text-right ms-4">{effectiveExpiry || 'Not found'}</span>
                </div>
              </div>

              {/* Warning Section (only if low confidence) */}
              {scanResult.confidence.isLow && (
                <div className="border-l-[4px] border-[#F59E0B] bg-[#FFFBEB] rounded-r-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-[#F59E0B]" />
                    <h4 className="text-[14px] font-medium text-[#F59E0B]">Low confidence — please verify</h4>
                  </div>
                  
                  {/* 3 Short Bullet Points */}
                  {scanResult.confidence.reasons.length > 0 && (
                    <ul className="text-[13px] text-gray-600 list-disc list-inside space-y-1 mb-4">
                      {scanResult.confidence.reasons.slice(0, 3).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}

                  <hr className="border-amber-200/50 my-4" />

                  {/* Correct if needed fields */}
                  <p className="text-[12px] text-gray-500 mb-3">Correct if needed</p>
                  <div className="flex flex-col space-y-4">
                    {(
                      [
                        { key: 'drug',   placeholder: 'Drug name' },
                        { key: 'dosage', placeholder: 'Dosage' },
                        { key: 'expiry', placeholder: 'Expiry' },
                      ] as { key: keyof ManualCorrection; placeholder: string }[]
                    ).map(({ key, placeholder }) => (
                      <input
                        key={key}
                        type="text"
                        value={manualCorrection[key]}
                        onChange={e => setManualCorrection((prev: ManualCorrection) => ({ ...prev, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full bg-transparent border-b border-gray-300 text-[14px] text-gray-900 placeholder-gray-400 focus:border-gray-500 focus:outline-none pb-2"
                      />
                    ))}
                  </div>
                </div>
              )}
              
            </div>
          )}
        </div>

        {/* Fixed Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white p-5 border-t border-gray-100 flex flex-col z-10 pb-8">
          {!isProcessing && scanResult?.confidence.isLow && (
            <p className="text-center text-[12px] text-[#F59E0B] mb-3 font-medium">
              Please review before saving
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={resetScan}
              disabled={isProcessing}
              className="flex-1 py-3.5 rounded-[12px] bg-white border border-gray-300 text-gray-800 font-medium text-[15px] active:scale-95 transition-transform disabled:opacity-50"
            >
              Retake
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing || !scanResult}
              className="flex-[1.5] py-3.5 rounded-[12px] bg-[#E84040] text-white font-medium text-[15px] active:scale-95 transition-transform disabled:opacity-50 shadow-sm"
            >
              Save medication
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Camera view — Roxy-style clean white scanner
  // --------------------------------------------------------------------------
  return (
    <div className="flex flex-col bg-white h-[100dvh] overflow-hidden">

      {/* ── Top bar ── */}
      <div className="flex items-center px-5 pt-14 pb-3 bg-white">
        <button
          id="scan-back-btn"
          onClick={() => navigate('/')}
          className="p-2 rounded-xl text-gray-700 active:scale-90 transition-all mr-3"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <h1 className="flex-1 text-center text-[18px] font-semibold text-gray-900 tracking-tight">
          Scan Medicine
        </h1>
        {/* Spacer to keep title centred */}
        <div className="w-9" />
      </div>

      {/* ── Auto-capture status pill (subdued badge, NOT a headline) ── */}
      <div className="flex justify-center pt-1 pb-4">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold transition-colors duration-300 ${
          isReady
            ? 'bg-emerald-100 text-emerald-700'
            : isDetecting
            ? 'bg-amber-100 text-amber-700'
            : 'bg-teal-50 text-teal-600'
        }`}>
          {/* Pulsing dot */}
          <span className={`w-1.5 h-1.5 rounded-full ${
            isReady ? 'bg-emerald-500' :
            isDetecting ? 'bg-amber-500 animate-pulse' :
            'bg-teal-400 animate-pulse'
          }`} />
          {isReady ? 'Ready to capture' : isDetecting ? 'Text detected…' : 'Auto-capture on'}
        </span>
      </div>

      {/* ── Camera + Viewfinder (takes remaining vertical space) ── */}
      <div className="flex-1 relative flex flex-col items-center justify-center px-6">

        {/* White-bordered viewfinder card */}
        <div
          className="relative rounded-[20px] overflow-hidden border border-gray-200"
          style={{ width: 280, height: 200 }}
        >
          {/* Live camera feed */}
          <CameraView ref={cameraRef} onCapture={handleCapture} />

          {/* ── Red corner brackets ── */}
          {/* Top-left */}
          <span className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-[#E84040] rounded-tl-[6px] z-10" />
          {/* Top-right */}
          <span className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-[#E84040] rounded-tr-[6px] z-10" />
          {/* Bottom-left */}
          <span className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-[#E84040] rounded-bl-[6px] z-10" />
          {/* Bottom-right */}
          <span className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-[#E84040] rounded-br-[6px] z-10" />

          {/* ── Animated red scan line ── */}
          <div
            className="absolute left-3 right-3 h-[2px] bg-[#E84040] z-10 rounded-full shadow-[0_0_6px_rgba(232,64,64,0.7)]"
            style={{ animation: 'scanline 2s ease-in-out infinite' }}
          />
        </div>

        {/* Instructional label below viewfinder */}
        <p className="mt-4 text-[13px] text-gray-400 text-center">
          Align the medicine label inside the frame
        </p>
      </div>

      {/* ── Bottom action bar ── */}
      <div className="bg-white border-t border-gray-100 px-5 pb-10 pt-4">
        <div className="flex items-center gap-3">

          {/* Upload — outlined secondary */}
          <label
            id="scan-upload-btn"
            className="flex items-center justify-center gap-2 flex-[1] py-3.5 rounded-full border-[1.5px] border-gray-300 text-gray-600 text-[14px] font-medium cursor-pointer active:scale-95 transition-all select-none"
          >
            <ImageIcon size={17} strokeWidth={2} />
            Upload Photo
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>

          {/* Capture — filled primary (1.4× wider) */}
          <button
            id="scan-capture-btn"
            onClick={() => cameraRef.current?.capture()}
            className={`flex items-center justify-center gap-2 flex-[1.4] py-3.5 rounded-full text-white text-[16px] font-medium active:scale-95 transition-all shadow-md ${
              isReady
                ? 'bg-emerald-500 shadow-emerald-200'
                : 'bg-[#E84040] shadow-red-200'
            }`}
          >
            {isReady ? <CheckCircle size={18} /> : <ScanIcon size={18} />}
            {isReady ? 'Capturing…' : 'Capture'}
          </button>

        </div>
      </div>

      {/* ── Scan line keyframe animation ── */}
      <style>{`
        @keyframes scanline {
          0%   { top: 12px;  opacity: 1; }
          48%  { top: calc(100% - 14px); opacity: 1; }
          50%  { opacity: 0; }
          52%  { top: 12px;  opacity: 0; }
          54%  { opacity: 1; }
          100% { top: 12px;  opacity: 1; }
        }
      `}</style>
    </div>
  );
}
