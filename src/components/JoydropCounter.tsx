"use client";

import React, { useEffect, useState } from 'react';
import { TierIndicator } from './TierIndicator';
import { cn } from '@/lib/utils';
import { Droplets } from 'lucide-react';

interface JoydropCounterProps {
    count: number;
    tier: 1 | 2;
    label?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const JoydropCounter: React.FC<JoydropCounterProps> = ({
    count,
    tier,
    label,
    size = 'md',
    className
}) => {
    const [displayCount, setDisplayCount] = useState(count);

    // Simple count-up animation effect
    useEffect(() => {
        let start = displayCount;
        const end = count;
        if (start === end) return;

        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out quart
            const ease = 1 - Math.pow(1 - progress, 4);

            const current = Math.floor(start + (end - start) * ease);
            setDisplayCount(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [count]);

    const textSize = size === 'sm' ? 'text-2xl' : size === 'md' ? 'text-4xl' : 'text-6xl';
    const labelSize = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base';
    const colorClass = tier === 1 ? 'text-blue-600' : 'text-purple-600';

    return (
        <div className={cn("flex flex-col items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100", className)}>
            <div className="flex items-center gap-2 mb-2">
                {label && <span className={cn("font-medium text-gray-500 uppercase tracking-wider", labelSize)}>{label}</span>}
                <TierIndicator tier={tier} size="sm" />
            </div>

            <div className={cn("font-bold tabular-nums flex items-baseline gap-2", textSize, colorClass)}>
                <Droplets className={cn(size === 'sm' ? "w-4 h-4" : size === 'md' ? "w-8 h-8" : "w-10 h-10")} />
                {displayCount.toLocaleString()}
            </div>
        </div>
    );
};
