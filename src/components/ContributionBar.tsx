import React from 'react';
import { cn } from '@/lib/utils';;

interface ContributionBarProps {
    individualCount: number;
    totalOrgCount: number;
    className?: string;
}

export const ContributionBar: React.FC<ContributionBarProps> = ({
    individualCount,
    totalOrgCount,
    className
}) => {
    const percentage = totalOrgCount > 0
        ? Math.min(100, (individualCount / totalOrgCount) * 100)
        : 0;

    return (
        <div className={cn("w-full", className)}>
            <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-500">Contribution</span>
                <span className="font-bold text-gray-700">{percentage.toFixed(1)}%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};
