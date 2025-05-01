'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  maxRating?: number;
  size?: number; // Size in pixels
  className?: string;
  disabled?: boolean;
}

export function RatingInput({
  value,
  onChange,
  maxRating = 5,
  size = 24, // Default size 24px
  className,
  disabled = false,
}: RatingInputProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleMouseEnter = (index: number) => {
    if (!disabled) {
      setHoverRating(index);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoverRating(0);
    }
  };

  const handleClick = (index: number) => {
    if (!disabled) {
      onChange(index);
    }
  };

  return (
    <div className={cn("flex gap-1", className)}>
      {[...Array(maxRating)].map((_, i) => {
        const ratingValue = i + 1;
        const isFilled = ratingValue <= (hoverRating || value);

        return (
          <button
            key={ratingValue}
            type="button" // Prevent form submission if used within a form
            onMouseEnter={() => handleMouseEnter(ratingValue)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(ratingValue)}
            className={cn(
              "p-0 bg-transparent border-none cursor-pointer transition-colors duration-150",
              disabled && "cursor-not-allowed opacity-70"
            )}
            aria-label={`Rate ${ratingValue} out of ${maxRating} stars`}
            disabled={disabled}
          >
            <Star
              size={size}
              className={cn(
                "transition-colors",
                isFilled ? "text-yellow-500 fill-yellow-400" : "text-muted-foreground/40"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
