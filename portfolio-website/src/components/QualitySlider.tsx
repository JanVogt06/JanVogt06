import {useState, useEffect, useRef} from 'react';
import {Leaf, Zap, Monitor, Sparkles, Flame} from 'lucide-react';

interface QualitySliderProps {
    onChange: (quality: number) => void;
    initialValue?: number;
}

// 5 discrete quality levels
const qualityLevels = [
    { value: 0, icon: Leaf, color: '#22C55E', label: 'Eco' },
    { value: 0.25, icon: Zap, color: '#EAB308', label: 'Low' },
    { value: 0.5, icon: Monitor, color: '#6B7280', label: 'Mid' },
    { value: 0.75, icon: Sparkles, color: '#8B5CF6', label: 'High' },
    { value: 1, icon: Flame, color: '#EC4899', label: 'Ultra' },
];

const QualitySlider = ({onChange, initialValue = 0.5}: QualitySliderProps) => {
    // Find closest level to initial value
    const getClosestLevel = (val: number) => {
        let closest = 0;
        let minDiff = Math.abs(qualityLevels[0].value - val);
        qualityLevels.forEach((level, i) => {
            const diff = Math.abs(level.value - val);
            if (diff < minDiff) {
                minDiff = diff;
                closest = i;
            }
        });
        return closest;
    };

    const [activeIndex, setActiveIndex] = useState(getClosestLevel(initialValue));
    const [isDragging, setIsDragging] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        onChange(qualityLevels[activeIndex].value);
    }, [activeIndex, onChange]);

    const updateFromPosition = (clientX: number) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        // Snap to nearest level
        const newIndex = Math.round(percentage * (qualityLevels.length - 1));
        setActiveIndex(newIndex);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        updateFromPosition(e.clientX);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        updateFromPosition(e.touches[0].clientX);
    };

    const handleClick = (index: number) => {
        setActiveIndex(index);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) updateFromPosition(e.clientX);
        };
        const handleTouchMove = (e: TouchEvent) => {
            if (isDragging) updateFromPosition(e.touches[0].clientX);
        };
        const handleEnd = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleEnd);
            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('touchend', handleEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging]);

    const activeLevel = qualityLevels[activeIndex];
    const ActiveIcon = activeLevel.icon;
    const thumbPosition = (activeIndex / (qualityLevels.length - 1)) * 100;

    return (
        <>
            <style>{`
                .liquid-glass-slider {
                    position: relative;
                    background: linear-gradient(
                        135deg,
                        rgba(255, 255, 255, 0.18) 0%,
                        rgba(255, 255, 255, 0.08) 50%,
                        rgba(255, 255, 255, 0.14) 100%
                    );
                    backdrop-filter: blur(24px) saturate(1.8) brightness(1.05);
                    -webkit-backdrop-filter: blur(24px) saturate(1.8) brightness(1.05);
                    border: 1px solid rgba(255, 255, 255, 0.25);
                    box-shadow: 
                        0 8px 32px rgba(0, 0, 0, 0.1),
                        0 2px 8px rgba(0, 0, 0, 0.05),
                        inset 0 1px 0 rgba(255, 255, 255, 0.3),
                        inset 0 -1px 0 rgba(255, 255, 255, 0.1);
                }
                
                .liquid-glass-slider::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    background: linear-gradient(
                        135deg,
                        rgba(255, 255, 255, 0.35) 0%,
                        transparent 50%
                    );
                    pointer-events: none;
                }
                
                .quality-track {
                    position: relative;
                    height: 12px;
                    border-radius: 9999px;
                    cursor: pointer;
                }
                
                .quality-thumb {
                    position: absolute;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 
                        0 4px 12px rgba(0, 0, 0, 0.25),
                        0 2px 4px rgba(0, 0, 0, 0.15);
                    transition: left 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
                    cursor: grab;
                    user-select: none;
                    z-index: 10;
                }
                
                .quality-thumb:hover,
                .quality-thumb.dragging {
                    transform: translate(-50%, -50%) scale(1.1);
                    box-shadow: 
                        0 6px 20px rgba(0, 0, 0, 0.3),
                        0 3px 6px rgba(0, 0, 0, 0.2);
                }
                
                .quality-thumb.dragging {
                    cursor: grabbing;
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                }
                
                .ghost-icon {
                    position: absolute;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0.25;
                    pointer-events: none;
                    transition: opacity 0.2s ease;
                }
                
                .step-dot {
                    position: absolute;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                
                .step-dot:hover {
                    background: rgba(255, 255, 255, 0.15);
                }
            `}</style>

            <div className="absolute top-6 right-6 z-50 max-sm:top-auto max-sm:bottom-6 max-sm:right-1/2 max-sm:translate-x-1/2">
                <div className="liquid-glass-slider rounded-full px-5 py-3">
                    <div
                        ref={trackRef}
                        className="quality-track relative z-10 w-[180px]"
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                    >
                        {/* Step indicators with ghost icons */}
                        {qualityLevels.map((level, i) => {
                            const Icon = level.icon;
                            const isActive = i === activeIndex;
                            return (
                                <div
                                    key={i}
                                    className="step-dot"
                                    style={{ left: `${(i / (qualityLevels.length - 1)) * 100}%` }}
                                    onClick={() => handleClick(i)}
                                >
                                    {!isActive && (
                                        <Icon
                                            className="w-4 h-4 text-white/30"
                                        />
                                    )}
                                </div>
                            );
                        })}

                        {/* Active thumb */}
                        <div
                            className={`quality-thumb ${isDragging ? 'dragging' : ''}`}
                            style={{
                                left: `${thumbPosition}%`,
                                backgroundColor: activeLevel.color
                            }}
                        >
                            <ActiveIcon className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default QualitySlider;