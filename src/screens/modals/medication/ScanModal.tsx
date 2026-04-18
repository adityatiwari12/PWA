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
  // Camera view
  // --------------------------------------------------------------------------
  return (
    <div className="flex flex-col flex-1 bg-black h-[100dvh] relative overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={() => navigate('/')}
          className="p-3 bg-white/10 backdrop-blur-xl rounded-full text-white border border-white/20 active:scale-95 transition-all shadow-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="bg-white/10 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/20">
          <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Sanjivani</span>
        </div>
        <div className="w-10" />
      </div>

      <CameraView ref={cameraRef} onCapture={handleCapture} />

      {/* Dimming/Focus Overlays (Cutout Mask) */}
      <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
        {/* Dimmed background around the cutout */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" style={{
           maskImage: `linear-gradient(to right, black, black), linear-gradient(to right, black, black)`,
           WebkitMaskImage: `polygon(0% 0%, 0% 100%, calc(50% - 160px) 100%, calc(50% - 160px) calc(50% - 100px), calc(50% + 160px) calc(50% - 100px), calc(50% + 160px) calc(50% + 100px), calc(50% - 160px) calc(50% + 100px), calc(50% - 160px) 100%, 100% 100%, 100% 0%)`,
        }} />
      </div>

      {/* Instructional Overlays (Moved near frame for hierarchy) */}
      <div className="absolute inset-x-0 top-32 z-40 flex flex-col items-center pointer-events-none px-6 text-center">
        <h1 className="text-white text-2xl font-black drop-shadow-md tracking-wide">
          Scan Medicine
        </h1>
        <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">
          Auto-capture enabled
        </p>
      </div>

      {/* Camera Viewfinder / Scan Box */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-40">
        <div className="relative w-[320px] h-[200px]">
          {/* Main Bold Border */}
          <div className={`absolute inset-0 border-4 rounded-[32px] transition-all duration-500 shadow-2xl ${
            isReady ? 'border-emerald-400 shadow-emerald-500/50 scale-[1.02]' : 
            isDetecting ? 'border-amber-400 shadow-amber-500/30' : 'border-white/40'
          }`} />
          
          {/* Dynamic Feedback Badge */}
          <div className="absolute -bottom-14 left-0 right-0 flex justify-center transition-all">
            <div className={`px-5 py-2.5 rounded-full backdrop-blur-xl border flex items-center gap-2.5 shadow-xl transition-all duration-500 ${
               isReady ? 'bg-emerald-500 text-white border-emerald-400' : 
               isDetecting ? 'bg-amber-500 text-amber-950 border-amber-400/50 animate-pulse' : 
               'bg-black/60 text-white border-white/20'
            }`}>
              {isReady ? <CheckCircle size={16} className="text-white" /> : 
               isDetecting ? <RefreshCw size={16} className="animate-spin text-amber-950" /> : 
               <ScanIcon size={16} className="text-white/60" />}
              <span className="text-xs font-black uppercase tracking-widest leading-none pt-0.5">
                {guidance}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Bottom UI */}
      <div className="absolute bottom-12 left-0 right-0 z-50 px-12 flex justify-center gap-12 items-center">
        <label className="flex flex-col items-center gap-2 cursor-pointer group">
          <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white active:scale-90 transition-transform shadow-xl">
            <ImageIcon size={22} />
          </div>
          <span className="text-[10px] text-white/60 font-black uppercase tracking-widest">Upload</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </label>

        <div className="flex flex-col items-center gap-2">
          <div className={`w-20 h-20 rounded-full border-[3px] p-1.5 backdrop-blur-sm transition-all duration-500 ${
            isReady ? 'border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.5)]' : 'border-white'
          }`}>
             <button 
                onClick={() => cameraRef.current?.capture()}
                className={`w-full h-full rounded-full shadow-2xl active:scale-90 transition-all flex items-center justify-center ${
                  isReady ? 'bg-emerald-500' : 'bg-white'
                }`}
             />
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${isReady ? 'text-emerald-400' : 'text-white'}`}>
             {isReady ? 'Capturing' : 'Capture'}
          </span>
        </div>
      </div>
    </div>
  );
}
