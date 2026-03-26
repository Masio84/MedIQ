'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

const MM_TO_PX = 3.78;

interface VisualRulesProps {
  margins: { top: number; right: number; bottom: number; left: number };
  width: number;  // mm
  height: number; // mm
  showGrid: boolean;
  gridSize: number; // px
  zoom: number;
  onMarginChange: (margins: { top: number; right: number; bottom: number; left: number }) => void;
}

type MarginSide = 'top' | 'right' | 'bottom' | 'left';

export default function VisualRules({ 
  margins, 
  width, 
  height, 
  showGrid, 
  gridSize,
  zoom,
  onMarginChange 
}: VisualRulesProps) {
  const [activeSide, setActiveSide] = useState<MarginSide | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const startMarginValue = useRef<number | null>(null);

  const w = width * MM_TO_PX;
  const h = height * MM_TO_PX;
  const mt = margins.top * MM_TO_PX;
  const mr = margins.right * MM_TO_PX;
  const mb = margins.bottom * MM_TO_PX;
  const ml = margins.left * MM_TO_PX;

  const handleMouseDown = (e: React.MouseEvent, side: MarginSide) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveSide(side);
    startPos.current = { x: e.clientX, y: e.clientY };
    startMarginValue.current = margins[side];
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!activeSide || startPos.current === null || startMarginValue.current === null) return;

    const deltaX = (e.clientX - startPos.current.x) / (MM_TO_PX * zoom);
    const deltaY = (e.clientY - startPos.current.y) / (MM_TO_PX * zoom);

    let newValue = startMarginValue.current;
    
    // Invert deltas for right/bottom since they are measured from the edge
    if (activeSide === 'top') newValue += deltaY;
    if (activeSide === 'left') newValue += deltaX;
    if (activeSide === 'bottom') newValue -= deltaY; // measured from bottom
    if (activeSide === 'right') newValue -= deltaX;  // measured from right

    // Clamp values (e.g., between 0 and 50mm)
    const clampedValue = Math.max(0, Math.min(50, Math.round(newValue)));
    
    if (clampedValue !== margins[activeSide]) {
      onMarginChange({ ...margins, [activeSide]: clampedValue });
    }
  }, [activeSide, margins, onMarginChange, zoom]);

  const handleMouseUp = useCallback(() => {
    setActiveSide(null);
    startPos.current = null;
    startMarginValue.current = null;
  }, []);

  useEffect(() => {
    if (activeSide) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeSide, handleMouseMove, handleMouseUp]);

  return (
    <div 
      className={`absolute inset-0 pointer-events-none overflow-hidden visual-rules-overlay ${activeSide ? 'z-50' : 'z-10'}`} 
      style={{ width: w, height: h }}
    >
      {showGrid && (
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
            backgroundSize: `${gridSize}px ${gridSize}px`
          }}
        />
      )}

      {/* Margin Rules (Interactable) */}
      
      {/* Top Margin */}
      <div 
        className={`absolute left-0 right-0 border-t border-dashed transition-colors flex items-center justify-center pointer-events-auto ${activeSide === 'top' ? 'border-blue-600 bg-blue-50/10' : 'border-blue-200 hover:border-blue-400'}`}
        style={{ top: mt, height: 16, marginTop: -8, cursor: 'ns-resize' }}
        onMouseDown={(e) => handleMouseDown(e, 'top')}
      >
        <span className={`text-[8px] bg-white px-1 font-mono transition-colors ${activeSide === 'top' ? 'text-blue-600 font-bold scale-110' : 'text-blue-300'}`}>
          {margins.top}mm
        </span>
      </div>

      {/* Bottom Margin */}
      <div 
        className={`absolute left-0 right-0 border-t border-dashed transition-colors flex items-center justify-center pointer-events-auto ${activeSide === 'bottom' ? 'border-blue-600 bg-blue-50/10' : 'border-blue-200 hover:border-blue-400'}`}
        style={{ bottom: mb, height: 16, marginBottom: -8, cursor: 'ns-resize' }}
        onMouseDown={(e) => handleMouseDown(e, 'bottom')}
      >
        <span className={`text-[8px] bg-white px-1 font-mono transition-colors ${activeSide === 'bottom' ? 'text-blue-600 font-bold scale-110' : 'text-blue-300'}`}>
          {margins.bottom}mm
        </span>
      </div>

      {/* Left Margin */}
      <div 
        className={`absolute top-0 bottom-0 border-l border-dashed transition-colors flex items-center justify-center pointer-events-auto ${activeSide === 'left' ? 'border-blue-600 bg-blue-50/10' : 'border-blue-200 hover:border-blue-400'}`}
        style={{ left: ml, width: 16, marginLeft: -8, cursor: 'ew-resize' }}
        onMouseDown={(e) => handleMouseDown(e, 'left')}
      >
        <span className={`text-[8px] bg-white py-0.5 px-0.5 font-mono rotate-90 whitespace-nowrap transition-colors ${activeSide === 'left' ? 'text-blue-600 font-bold scale-110' : 'text-blue-300'}`}>
          {margins.left}mm
        </span>
      </div>

      {/* Right Margin */}
      <div 
        className={`absolute top-0 bottom-0 border-l border-dashed transition-colors flex items-center justify-center pointer-events-auto ${activeSide === 'right' ? 'border-blue-600 bg-blue-50/10' : 'border-blue-200 hover:border-blue-400'}`}
        style={{ right: mr, width: 16, marginRight: -8, cursor: 'ew-resize' }}
        onMouseDown={(e) => handleMouseDown(e, 'right')}
      >
        <span className={`text-[8px] bg-white py-0.5 px-0.5 font-mono rotate-90 whitespace-nowrap transition-colors ${activeSide === 'right' ? 'text-blue-600 font-bold scale-110' : 'text-blue-300'}`}>
          {margins.right}mm
        </span>
      </div>

      {/* Edge markers (Locked) */}
      <div className="absolute top-0 left-0 w-full h-1 flex border-b border-gray-100 italic">
        {Array.from({ length: Math.ceil(width / 10) }).map((_, i) => (
          <div key={i} className="h-full border-r border-gray-200" style={{ width: 10 * MM_TO_PX }}></div>
        ))}
      </div>
      <div className="absolute top-0 left-0 w-1 h-full flex flex-col border-r border-gray-100 italic">
        {Array.from({ length: Math.ceil(height / 10) }).map((_, i) => (
          <div key={i} className="w-full border-b border-gray-200" style={{ height: 10 * MM_TO_PX }}></div>
        ))}
      </div>
    </div>
  );
}
