import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, X, ShieldCheck, Mail, Phone, Briefcase, Building2 } from 'lucide-react';
import { Employee } from '../../types';

interface EmployeeBadgeModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeBadgeModal: React.FC<EmployeeBadgeModalProps> = ({
  employee,
  isOpen,
  onClose,
}) => {
  const badgeCardRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen || !employee) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = () => {
    // Generate simple SVG/Canvas download of the badge
    const svg = document.getElementById(`qr-badge-${employee.id}`) as SVGElement | null;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 300, 300);
        ctx.drawImage(img, 25, 25, 250, 250);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `QR_BADGE_${employee.matricule}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Controls Header (Hidden in print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">Badge d'Identification QR</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Badge Area */}
        <div className="p-6 flex flex-col items-center bg-slate-100/60 print:bg-white print:p-0">
          <div
            ref={badgeCardRef}
            className="print-area badge-card-print w-[320px] bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 relative flex flex-col items-center text-center pb-6 transition-all"
          >
            {/* Lanyard Clip Slot */}
            <div className="w-16 h-3 bg-slate-200/90 rounded-full my-3 border border-slate-300 print:bg-slate-300" />

            {/* Badge Top Header */}
            <div className="w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 py-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-20 h-20 bg-indigo-500/20 rounded-full blur-xl" />
              <div className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center font-black text-xs">
                  S
                </div>
                <span className="font-extrabold tracking-wider text-xs uppercase">
                  ScanStock
                </span>
              </div>
              <p className="text-[10px] text-indigo-300 uppercase font-semibold tracking-widest mt-0.5">
                Badge Accès Matériel & Magasin
              </p>
            </div>

            {/* Profile Avatar / Photo */}
            <div className="relative -mt-6 mb-3">
              {employee.photoUrl ? (
                <img
                  src={employee.photoUrl}
                  alt={`${employee.prenom} ${employee.nom}`}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md mx-auto"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-700 font-bold text-2xl flex items-center justify-center border-4 border-white shadow-md mx-auto">
                  {employee.prenom[0]}
                  {employee.nom[0]}
                </div>
              )}
              <span className="absolute bottom-0 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            {/* Names & Position */}
            <h4 className="text-xl font-bold text-slate-900 tracking-tight">
              {employee.prenom} {employee.nom}
            </h4>
            <div className="flex items-center justify-center gap-1.5 text-xs text-indigo-600 font-semibold mt-0.5 px-4">
              <Briefcase className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{employee.poste}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 mt-0.5 px-4">
              <Building2 className="w-3 h-3 shrink-0" />
              <span className="truncate">{employee.departement}</span>
            </div>

            {/* High Definition QR Code */}
            <div className="my-4 p-3 bg-white rounded-xl border border-slate-200 shadow-inner flex flex-col items-center">
              <QRCodeSVG
                id={`qr-badge-${employee.id}`}
                value={employee.matricule}
                size={140}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%234f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
                  x: undefined,
                  y: undefined,
                  height: 24,
                  width: 24,
                  excavate: true,
                }}
              />
              <span className="mt-2 font-mono text-xs font-bold text-slate-800 tracking-wider bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                {employee.matricule}
              </span>
            </div>

            {/* Contact details mini */}
            <div className="w-full px-6 pt-2 border-t border-slate-100 flex flex-col gap-1 text-[11px] text-slate-500">
              <div className="flex items-center justify-center gap-1.5 truncate">
                <Mail className="w-3 h-3 text-slate-400" />
                <span className="truncate">{employee.email}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{employee.telephone}</span>
              </div>
            </div>

            {/* Security watermark footer */}
            <div className="mt-3 text-[9px] uppercase tracking-wider text-slate-400 font-mono">
              VALIDÉ MAGASIN CENTRAL • SÉCURISÉ
            </div>
          </div>
        </div>

        {/* Action Buttons (Hidden in print) */}
        <div className="no-print p-4 bg-white border-t border-slate-100 flex gap-3">
          <button
            onClick={handleDownloadImage}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            Télécharger QR
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition"
          >
            <Printer className="w-4 h-4" />
            Imprimer le Badge
          </button>
        </div>
      </div>
    </div>
  );
};
