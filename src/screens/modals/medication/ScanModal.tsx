import { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle, ArrowLeft, RefreshCw, Cpu, 
  AlertTriangle, Edit3, ChevronDown, ChevronUp, ShieldAlert,
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
// Confidence Badge
// ---------------------------------------------------------------------------
function ConfidenceBadge({ score }: { score: number }) {
  const color =
    score >= 75 ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
    score >= 55 ? 'bg-amber-100  text-amber-700  border-amber-300' :
                  'bg-red-100    text-red-700    border-red-300';

  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>
      {score}% confidence
    </span>
  );
}

// ---------------------------------------------------------------------------
// Low-confidence Fallback Banner + Manual Correction Form
// ---------------------------------------------------------------------------
interface FallbackPanelProps {
  reasons: string[];
  correction: ManualCorrection;
  onChange: (field: keyof ManualCorrection, value: string) => void;
}

function FallbackPanel({ reasons, correction, onChange }: FallbackPanelProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="w-full mt-4 rounded-xl border border-amber-300 bg-amber-50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((o: boolean) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-amber-800 font-bold text-sm"
        id="low-confidence-toggle"
      >
        <span className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-amber-600 shrink-0" />
          Low confidence — please verify
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="px-4 pb-4">
          {/* Reasons list */}
          {reasons.length > 0 && (
            <ul className="text-xs text-amber-700 mb-3 list-disc list-inside space-y-0.5">
              {reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          )}

          {/* Manual correction inputs */}
          <p className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1">
            <Edit3 size={12} /> Correct the fields if needed:
          </p>

          <div className="space-y-2">
            {(
              [
                { key: 'drug',   label: 'Drug name',    placeholder: 'e.g. Dolo 650' },
                { key: 'dosage', label: 'Dosage',        placeholder: 'e.g. 500mg' },
                { key: 'expiry', label: 'Expiry',        placeholder: 'e.g. 06/2026' },
              ] as { key: keyof ManualCorrection; label: string; placeholder: string }[]
            ).map(({ key, label, placeholder }) => (
              <div key={key} className="flex flex-col gap-0.5">
                <label
                  htmlFor={`manual-${key}`}
                  className="text-xs font-medium text-amber-800"
                >
                  {label}
                </label>
                <input
                  id={`manual-${key}`}
                  type="text"
                  value={correction[key]}
                  onChange={e => onChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
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
  const [guidance, setGuidance] = useState("Align label to start");
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
        setGuidance("Detecting...");
        
        // Wait 1.5s of stable detection to auto-capture
        if (!stableTimeoutRef.current) {
          stableTimeoutRef.current = setTimeout(() => {
            if (!isActive) return;
            setGuidance("Ready ✓");
            setIsReady(true);
            if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]); // Haptic feedback
            
            setTimeout(() => {
              if (isActive) cameraRef.current?.capture();
            }, 600); // Brief pause to show state to user before snapping
          }, 1500);
        }
      } else {
        setIsDetecting(false);
        setGuidance("Align label");
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
    setGuidance("Align label to start");
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
      <div className="flex flex-col flex-1 bg-gray-50 min-h-[calc(100vh-64px)] relative p-4">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            id="scan-back-btn"
            onClick={resetScan}
            className="p-2 mr-2 bg-white rounded-full shadow-sm active:scale-95 transition-transform"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Scan Result</h2>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 flex flex-col items-center p-4">
          {/* Captured / processed image */}
          <img
            src={scanResult?.processedImageUrl ?? capturedImageUrl}
            alt="Captured Medication"
            className="w-full max-w-sm rounded-lg border border-gray-200 mb-4 object-cover max-h-64"
          />

          {/* Processing stages */}
          {isProcessing && progressEvent && (
            <div className="w-full py-6 flex flex-col items-center">
              {progressEvent.stage === 'preprocessing' && (
                <RefreshCw className="animate-spin text-purple-600 mb-3" size={28} />
              )}
              {progressEvent.stage === 'analyzing' && (
                <Cpu className="animate-pulse text-indigo-600 mb-3" size={28} />
              )}
              {progressEvent.stage === 'extracting' && (
                <Cpu className="animate-pulse text-green-600 mb-3" size={28} />
              )}

              <p className="text-sm font-bold text-gray-700 mb-2">
                {stageLabelFor(progressEvent)}
              </p>

              {/* Indeterminate progress shimmer for Vision analysis */}
              {progressEvent.stage === 'analyzing' && (
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full w-full animate-pulse" />
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {!isProcessing && scanResult && (
            <>
              {/* Confidence badge */}
              <div className="w-full flex items-center justify-between mb-3">
                <h3 className="text-gray-800 font-bold">Detected Information</h3>
                <ConfidenceBadge score={scanResult.confidence.score} />
              </div>

              {/* Field table */}
              <div className="w-full space-y-3 mb-4 text-sm">
                <div className="flex border-b border-gray-100 pb-2">
                  <span className="text-gray-500 w-24">Drug:</span>
                  <span className="font-bold text-gray-800">
                    {effectiveDrug || <span className="text-red-400 italic">Not found</span>}
                  </span>
                </div>
                <div className="flex border-b border-gray-100 pb-2">
                  <span className="text-gray-500 w-24">Dosage:</span>
                  <span className="font-medium text-gray-800">
                    {effectiveDosage || 'Not found'}
                  </span>
                </div>
                <div className="flex border-b border-gray-100 pb-2">
                  <span className="text-gray-500 w-24">Expiry:</span>
                  <span className="font-medium text-gray-800">
                    {effectiveExpiry || 'Not found'}
                  </span>
                </div>
              </div>

              {/* Low-confidence fallback UI */}
              {scanResult.confidence.isLow && (
                <FallbackPanel
                  reasons={scanResult.confidence.reasons}
                  correction={manualCorrection}
                  onChange={(field, value) =>
                    setManualCorrection((prev: ManualCorrection) => ({ ...prev, [field]: value }))
                  }
                />
              )}

              {/* Vision model raw response (collapsible) */}
              <details className="w-full text-xs bg-gray-50 rounded-lg outline-none mt-4">
                <summary className="font-medium text-gray-500 cursor-pointer p-2">
                  View Vision AI Response
                </summary>
                <pre className="p-3 bg-gray-100 text-gray-600 whitespace-pre-wrap w-full font-mono mt-1 rounded-b-lg">
                  {scanResult.rawOcrText || 'No response from Vision model.'}
                </pre>
              </details>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex space-x-3 mt-auto mb-20">
          <button
            id="scan-retake-btn"
            onClick={resetScan}
            disabled={isProcessing}
            className="flex-1 py-3 rounded-xl bg-gray-200 text-gray-700 font-bold text-sm shadow-sm active:scale-95 transition-transform disabled:opacity-50"
          >
            Retake Photo
          </button>
          <button
            id="scan-save-btn"
            onClick={handleSave}
            disabled={isProcessing || !scanResult}
            className="flex-1 py-3 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] active:scale-95 transition-transform disabled:opacity-50"
          >
            <CheckCircle size={18} className="mr-2" /> Save Medication
          </button>
        </div>

        {/* Warning if saving with low info */}
        {!isProcessing && scanResult && scanResult.confidence.isLow && (
          <p className="text-center text-xs text-amber-600 mb-4 flex items-center justify-center gap-1 -mt-16">
            <AlertTriangle size={12} /> Please review the fields above before saving.
          </p>
        )}
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
