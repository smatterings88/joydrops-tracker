import React from 'react';
import { User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';;

interface TierIndicatorProps {
    tier: 1 | 2;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    showLabel?: boolean;
}

export const TierIndicator: React.FC<TierIndicatorProps> = ({
    tier,
    size = 'md',
    className,
    showLabel = false
}) => {
    const isTier1 = tier === 1;
    const colorClass = isTier1 ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700';
    const iconSize = size === 'sm' ? 14 : size === 'md' ? 18 : 24;

    return (
        <div className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-medium", colorClass, className)}>
            {isTier1 ? <User size={iconSize} /> : <Users size={iconSize} />}
            {showLabel && (
                <span className={cn(
                    "leading-none",
                    size === 'sm' && "text-xs",
                    size === 'md' && "text-sm",
                    size === 'lg' && "text-base"
                )}>
                    {isTier1 ? 'Tier 1 (Personal)' : 'Tier 2 (Organization)'}
                </span>
            )}
        </div>
    );
};
