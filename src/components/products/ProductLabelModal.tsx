import React, { useRef } from 'react';
import { Printer, X, Tag, MapPin } from 'lucide-react';
import { Product } from '../../types';
import { BarcodeRenderer } from '../common/BarcodeRenderer';

interface ProductLabelModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductLabelModal: React.FC<ProductLabelModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const labelRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen || !product) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Controls Header (Hidden in print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">Étiquette Code-Barres Matériel</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Label Area */}
        <div className="p-8 flex flex-col items-center justify-center bg-slate-100/60 print:bg-white print:p-0">
          <div
            ref={labelRef}
            className="print-area badge-card-print w-[330px] bg-white rounded-2xl shadow-lg border-2 border-slate-300 p-5 flex flex-col items-center text-center relative"
          >
            {/* Top header */}
            <div className="w-full flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                {product.categorie}
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-800">
                {product.reference}
              </span>
            </div>

            {/* Product Title */}
            <h4 className="text-base font-bold text-slate-900 leading-snug mb-1">
              {product.nom}
            </h4>

            {/* Location */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-4 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="font-medium">{product.emplacement}</span>
            </div>

            {/* Barcode Render */}
            <div className="w-full bg-white p-2 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
              <BarcodeRenderer
                value={product.codeBarre}
                width={1.7}
                height={55}
                displayValue={true}
                fontSize={13}
              />
            </div>

            {/* Stock indicator info */}
            <div className="w-full mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>STOCK: {product.quantite} un.</span>
              <span>SEUIL MIN: {product.seuilAlerte}</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="no-print p-4 bg-white border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
          >
            Fermer
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition"
          >
            <Printer className="w-4 h-4" />
            Imprimer l'étiquette
          </button>
        </div>
      </div>
    </div>
  );
};
