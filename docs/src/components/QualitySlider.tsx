import {useState, useEffect} from 'react';
import {Settings, Sparkles, Zap} from 'lucide-react';
import {Slider} from '@/components/ui/slider';
import {Button} from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface QualitySliderProps {
    onChange: (quality: number) => void;
    initialValue?: number;
}

const QualitySlider = ({onChange, initialValue = 0.5}: QualitySliderProps) => {
    const [quality, setQuality] = useState(initialValue);

    useEffect(() => {
        onChange(quality);
    }, [quality, onChange]);

    const getQualityLabel = () => {
        if (quality < 0.33) return 'Niedrig';
        if (quality < 0.66) return 'Mittel';
        return 'Hoch';
    };

    const getQualityIcon = () => {
        if (quality < 0.33) return <Zap className="w-4 h-4"/>;
        if (quality < 0.66) return <Settings className="w-4 h-4"/>;
        return <Sparkles className="w-4 h-4"/>;
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md border-white/20 text-white/80 hover:bg-white/20 hover:text-white shadow-lg"
                    >
                        <Settings className="h-5 w-5"/>
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    side="top"
                    align="end"
                    className="w-56 bg-gray-900/95 backdrop-blur-md border-white/10"
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-white/60 text-sm">Grafikqualität</span>
                            <span className="flex items-center gap-1.5 text-white text-sm font-medium">
                                {getQualityIcon()}
                                {getQualityLabel()}
                            </span>
                        </div>

                        <Slider
                            value={[quality]}
                            onValueChange={(value) => setQuality(value[0])}
                            min={0}
                            max={1}
                            step={0.01}
                            className="w-full"
                        />

                        <div className="flex justify-between text-xs text-white/40">
                            <span>Performance</span>
                            <span>Qualität</span>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default QualitySlider;