"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Check, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils'; // Using the utility we created

interface SlugCheckerProps {
    value: string;
    onChange: (value: string) => void;
    onAvailabilityChange: (isAvailable: boolean) => void;
    label?: string;
    placeholder?: string;
}

export const SlugChecker: React.FC<SlugCheckerProps> = ({
    value,
    onChange,
    onAvailabilityChange,
    label = "Choose your unique ID (Slug)",
    placeholder = "e.g. johndoe"
}) => {
    const [loading, setLoading] = useState(false);
    const [available, setAvailable] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkSlug = async () => {
            if (!value) {
                setAvailable(null);
                setError(null);
                onAvailabilityChange(false);
                return;
            }

            // Basic client-side validation
            if (value.length > 30) {
                setError("Max 30 characters");
                setAvailable(false);
                onAvailabilityChange(false);
                return;
            }

            if (!/^[a-z0-9]+$/i.test(value)) {
                setError("Alphanumeric only");
                setAvailable(false);
                onAvailabilityChange(false);
                return;
            }

            setError(null);
            setLoading(true);

            try {
                const res = await fetch('/api/check_slug', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slug: value }),
                });
                const data = await res.json();

                if (data.available) {
                    setAvailable(true);
                    onAvailabilityChange(true);
                } else {
                    setAvailable(false);
                    setError(data.message || "Already taken");
                    onAvailabilityChange(false);
                }
            } catch (err) {
                console.error(err);
                setError("Error checking availability");
                setAvailable(false);
                onAvailabilityChange(false);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(checkSlug, 500);
        return () => clearTimeout(debounceTimer);
    }, [value, onAvailabilityChange]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Force lowercase for consistency
        onChange(e.target.value.toLowerCase());
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                {label}
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={handleChange}
                    className={cn(
                        "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-white border text-gray-900",
                        available === true && "border-green-500 focus:border-green-500 focus:ring-green-500",
                        available === false && "border-red-500 focus:border-red-500 focus:ring-red-500"
                    )}
                    placeholder={placeholder}
                    maxLength={30}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {loading && <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />}
                    {!loading && available === true && <Check className="h-5 w-5 text-green-500" />}
                    {!loading && available === false && <X className="h-5 w-5 text-red-500" />}
                </div>
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {error}
                </p>
            )}
            {available === true && !loading && (
                <p className="mt-1 text-sm text-green-600">Available!</p>
            )}
        </div>
    );
};
