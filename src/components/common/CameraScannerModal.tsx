import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, RefreshCw, Zap, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { Employee, Product } from '../../types';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  title: string;
  subtitle: string;
  mode: 'qr_employee' | 'barcode_product' | 'universal';
  sampleEmployees?: Employee[];
  sampleProducts?: Product[];
}

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title,
  subtitle,
  mode,
  sampleEmployees = [],
  sampleProducts = [],
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'html5-scanner-element';

  // Play pleasant audio beep on successful scan
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // AudioContext may be restricted before interaction
    }
  };

  const handleSuccessfulScan = (text: string) => {
    playBeep();
    setScannedFeedback(text);
    setTimeout(() => {
      onScanSuccess(text);
      stopScanner();
      onClose();
    }, 400);
  };

  const startScanner = async (cameraId?: string) => {
    setCameraError(null);
    try {
      // Stop previous instance if exists
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }

      const formatsToSupport = [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
      ];

      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport,
        verbose: false,
      });
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0,
      };

      const cameraParam = cameraId ? { deviceId: { exact: cameraId } } : { facingMode: 'environment' };

      await html5QrCode.start(
        cameraParam,
        config,
        (decodedText) => {
          handleSuccessfulScan(decodedText);
        },
        () => {
          // Frame error: scanning in progress
        }
      );

      setIsScanning(true);
    } catch (err: unknown) {
      console.warn('Camera start error:', err);
      setCameraError(
        'Impossible d\'accéder à la caméra. Vérifiez les autorisations du navigateur ou utilisez le sélecteur rapide ci-dessous.'
      );
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }
    } catch {
      // Cleanup error
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setScannedFeedback(null);
      setCameraError(null);
      return;
    }

    // When modal opens, list cameras & start
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera if found
          const backCam = devices.find(d => /back|rear|environment|arrière/i.test(d.label));
          const camId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(camId);
          startScanner(camId);
        } else {
          startScanner();
        }
      })
      .catch(() => {
        startScanner();
      });

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{title}</h3>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport Area */}
        <div className="relative bg-slate-950 p-3 flex flex-col items-center justify-center min-h-[300px] overflow-hidden">
          {/* html5-qrcode target container */}
          <div
            id={scannerContainerId}
            className="w-full max-w-[340px] rounded-xl overflow-hidden shadow-inner"
          />

          {/* Target Scanner Reticle Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-64 h-64 border-2 border-indigo-400/80 rounded-2xl flex items-center justify-center shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl -mt-0.5 -ml-0.5" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl -mt-0.5 -mr-0.5" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl -mb-0.5 -ml-0.5" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-xl -mb-0.5 -mr-0.5" />

              {/* Laser line animation */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse absolute top-1/2 -translate-y-1/2 shadow-[0_0_12px_rgba(239,68,68,0.8)]" />

              {/* Mode indicator badge */}
              <div className="absolute bottom-3 px-3 py-1 bg-slate-900/90 text-white text-[11px] font-medium rounded-full border border-slate-700 flex items-center gap-1.5 backdrop-blur-sm">
                <Zap className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" />
                <span>
                  {mode === 'qr_employee'
                    ? 'Pointez vers le QR Code Badge'
                    : mode === 'barcode_product'
                    ? 'Pointez vers le Code-Barres Matériel'
                    : 'Scanner QR ou Code-Barres'}
                </span>
              </div>
            </div>
          </div>

          {/* Scanned Success Flash */}
          {scannedFeedback && (
            <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 z-20 animate-fade-in">
              <CheckCircle2 className="w-16 h-16 text-white mb-2 animate-bounce" />
              <p className="font-bold text-lg">Code Détecté !</p>
              <p className="font-mono text-xs bg-emerald-800/80 px-3 py-1 rounded-md mt-1">
                {scannedFeedback}
              </p>
            </div>
          )}

          {/* Camera Error Message */}
          {cameraError && (
            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-center p-6 z-10">
              <AlertCircle className="w-12 h-12 text-amber-400 mb-3" />
              <h4 className="text-white font-semibold text-sm mb-1">Accès Caméra Restreint</h4>
              <p className="text-slate-400 text-xs max-w-xs mb-4 leading-relaxed">
                {cameraError}
              </p>
              <button
                onClick={() => startScanner(selectedCameraId)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Réessayer la Caméra
              </button>
            </div>
          )}
        </div>

        {/* Camera Selector Switcher */}
        {cameras.length > 1 && (
          <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Changer de caméra :</span>
            <select
              value={selectedCameraId}
              onChange={(e) => {
                setSelectedCameraId(e.target.value);
                startScanner(e.target.value);
              }}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 text-xs focus:ring-1 focus:ring-indigo-500 outline-none max-w-[200px] truncate"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label || `Caméra ${c.id.substring(0, 5)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quick Simulation / Test fallback bar (Super helpful for instant testing in iFrames or without physical barcodes) */}
        <div className="p-4 bg-white border-t border-slate-100 overflow-y-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Simulation de Scan Rapide (1-Clic) :</span>
          </div>

          {mode === 'qr_employee' && sampleEmployees.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {sampleEmployees.slice(0, 4).map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => handleSuccessfulScan(emp.matricule)}
                  className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-left transition-all group"
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {emp.prenom[0]}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-medium text-slate-800 truncate group-hover:text-indigo-600">
                      {emp.prenom} {emp.nom}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      {emp.matricule}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {mode === 'barcode_product' && sampleProducts.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {sampleProducts.slice(0, 4).map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => handleSuccessfulScan(prod.codeBarre)}
                  className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-left transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                    BAR
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-medium text-slate-800 truncate group-hover:text-indigo-600">
                      {prod.nom}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      {prod.codeBarre}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {mode === 'universal' && (
            <div className="flex flex-wrap gap-2">
              {sampleEmployees.slice(0, 2).map((e) => (
                <button
                  key={e.id}
                  onClick={() => handleSuccessfulScan(e.matricule)}
                  className="text-xs px-2.5 py-1.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                >
                  Employé : {e.prenom} ({e.matricule})
                </button>
              ))}
              {sampleProducts.slice(0, 2).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSuccessfulScan(p.codeBarre)}
                  className="text-xs px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                >
                  Produit : {p.nom.slice(0, 18)}...
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
