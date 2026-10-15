import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeRendererProps {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'UPC' | 'auto';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  format = 'auto',
  width = 1.6,
  height = 50,
  displayValue = true,
  fontSize = 13,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      // Determine format: if it's 13 digits and format is EAN13 or auto
      const isDigits13 = /^\d{13}$/.test(value.trim());
      const selectedFormat = format === 'auto' ? (isDigits13 ? 'EAN13' : 'CODE128') : format;

      JsBarcode(svgRef.current, value.trim(), {
        format: selectedFormat,
        width: width,
        height: height,
        displayValue: displayValue,
        fontSize: fontSize,
        margin: 4,
        background: '#ffffff',
        lineColor: '#0f172a',
        font: 'JetBrains Mono, monospace',
      });
    } catch {
      // Fallback to CODE128 in case of checksum discrepancy in EAN13
      try {
        if (svgRef.current) {
          JsBarcode(svgRef.current, value.trim(), {
            format: 'CODE128',
            width: width,
            height: height,
            displayValue: displayValue,
            fontSize: fontSize,
            margin: 4,
            background: '#ffffff',
            lineColor: '#0f172a',
          });
        }
      } catch {
        // Silent error
      }
    }
  }, [value, format, width, height, displayValue, fontSize]);

  if (!value) return null;

  return (
    <div className={`inline-flex flex-col items-center justify-center bg-white p-1 rounded ${className}`}>
      <svg ref={svgRef} className="max-w-full h-auto overflow-hidden" />
    </div>
  );
};
