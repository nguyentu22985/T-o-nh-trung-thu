import React from 'react';
import { ResetIcon } from './Icons';

interface AdjustmentControlsProps {
    scale: number;
    setScale: (scale: number) => void;
    positionX: number;
    setPositionX: (x: number) => void;
    positionY: number;
    setPositionY: (y: number) => void;
    disabled: boolean;
}

const AdjustmentControls: React.FC<AdjustmentControlsProps> = ({
    scale,
    setScale,
    positionX,
    setPositionX,
    positionY,
    setPositionY,
    disabled,
}) => {
    const handleReset = () => {
        setScale(100);
        setPositionX(0);
        setPositionY(0);
    };

    return (
        <div className={`space-y-6 transition-opacity duration-300 ${disabled ? 'opacity-50' : 'opacity-100'}`}>
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label htmlFor="scale" className="font-medium text-brand-text-secondary">Scale</label>
                    <span className="text-sm font-mono px-2 py-1 bg-black/30 rounded-md">{scale}%</span>
                </div>
                <input
                    id="scale"
                    type="range"
                    min="80"
                    max="120"
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    disabled={disabled}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Adjust face scale"
                />
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label htmlFor="positionX" className="font-medium text-brand-text-secondary">Horizontal Offset</label>
                    <span className="text-sm font-mono px-2 py-1 bg-black/30 rounded-md">{positionX}%</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-brand-text-secondary">Left</span>
                    <input
                        id="positionX"
                        type="range"
                        min="-10"
                        max="10"
                        value={positionX}
                        onChange={(e) => setPositionX(Number(e.target.value))}
                        disabled={disabled}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                        aria-label="Adjust horizontal face position"
                    />
                    <span className="text-xs text-brand-text-secondary">Right</span>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label htmlFor="positionY" className="font-medium text-brand-text-secondary">Vertical Offset</label>
                    <span className="text-sm font-mono px-2 py-1 bg-black/30 rounded-md">{positionY}%</span>
                </div>
                 <div className="flex items-center gap-2">
                    <span className="text-xs text-brand-text-secondary">Up</span>
                    <input
                        id="positionY"
                        type="range"
                        min="-10"
                        max="10"
                        value={positionY}
                        onChange={(e) => setPositionY(Number(e.target.value))}
                        disabled={disabled}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                        aria-label="Adjust vertical face position"
                    />
                    <span className="text-xs text-brand-text-secondary">Down</span>
                </div>
            </div>

            <button
                onClick={handleReset}
                disabled={disabled}
                className="w-full flex items-center justify-center gap-2 text-sm text-brand-text-secondary bg-black/20 py-2 px-4 rounded-lg transition-colors enabled:hover:bg-black/40 enabled:hover:text-brand-text disabled:cursor-not-allowed"
            >
                <ResetIcon className="w-4 h-4" />
                Reset Adjustments
            </button>
        </div>
    );
};

export default AdjustmentControls;