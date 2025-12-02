"use client";

import React from "react";

interface LoadingProps {
  /** Size of the loader: sm, md, lg, xl */
  size?: "sm" | "md" | "lg" | "xl";
  /** Variant style */
  variant?: "spinner" | "dots" | "pulse" | "bars";
  /** Optional loading text */
  text?: string;
  /** Full screen overlay mode */
  fullScreen?: boolean;
  /** Custom className */
  className?: string;
}

const sizeConfig = {
  sm: { spinner: "w-6 h-6", dots: "w-2 h-2", bars: "w-1 h-4", text: "text-xs" },
  md: { spinner: "w-10 h-10", dots: "w-3 h-3", bars: "w-1.5 h-6", text: "text-sm" },
  lg: { spinner: "w-14 h-14", dots: "w-4 h-4", bars: "w-2 h-8", text: "text-base" },
  xl: { spinner: "w-20 h-20", dots: "w-5 h-5", bars: "w-2.5 h-10", text: "text-lg" },
};

// Spinner variant - Modern dual ring
const SpinnerLoader: React.FC<{ size: "sm" | "md" | "lg" | "xl" }> = ({ size }) => {
  const sizeClass = sizeConfig[size].spinner;
  return (
    <div className="relative">
      <div className={`${sizeClass} rounded-full border-4 border-brand-100 dark:border-brand-900`}></div>
      <div className={`${sizeClass} rounded-full border-4 border-brand-500 border-t-transparent animate-spin absolute top-0 left-0`}></div>
    </div>
  );
};

// Dots variant - Bouncing dots
const DotsLoader: React.FC<{ size: "sm" | "md" | "lg" | "xl" }> = ({ size }) => {
  const dotSize = sizeConfig[size].dots;
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${dotSize} rounded-full bg-brand-500 animate-bounce`}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
};

// Pulse variant - Pulsing circles
const PulseLoader: React.FC<{ size: "sm" | "md" | "lg" | "xl" }> = ({ size }) => {
  const sizeClass = sizeConfig[size].spinner;
  return (
    <div className="relative flex items-center justify-center">
      <div className={`${sizeClass} rounded-full bg-brand-500/30 animate-ping absolute`}></div>
      <div className={`${sizeClass} rounded-full bg-brand-500/50 animate-pulse absolute scale-75`}></div>
      <div className={`${sizeClass} rounded-full bg-brand-500 scale-50`}></div>
    </div>
  );
};

// Bars variant - Equalizer style
const BarsLoader: React.FC<{ size: "sm" | "md" | "lg" | "xl" }> = ({ size }) => {
  const barSize = sizeConfig[size].bars;
  return (
    <div className="flex items-end gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`${barSize} bg-brand-500 rounded-full animate-pulse`}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: "0.8s",
            height: `${Math.random() * 50 + 50}%`,
          }}
        />
      ))}
    </div>
  );
};

const Loading: React.FC<LoadingProps> = ({
  size = "md",
  variant = "spinner",
  text,
  fullScreen = false,
  className = "",
}) => {
  const renderLoader = () => {
    switch (variant) {
      case "dots":
        return <DotsLoader size={size} />;
      case "pulse":
        return <PulseLoader size={size} />;
      case "bars":
        return <BarsLoader size={size} />;
      default:
        return <SpinnerLoader size={size} />;
    }
  };

  const content = (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {renderLoader()}
      {text && (
        <p className={`${sizeConfig[size].text} font-medium text-gray-500 dark:text-gray-400 animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

// Page loading component - for full page loading states
export const PageLoading: React.FC<{ text?: string; fullScreen?: boolean }> = ({ 
  text = "กำลังโหลดข้อมูล...",
  fullScreen = false 
}) => {
  return (
    <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'min-h-[60vh]'}`}>
      <Loading size="lg" variant="spinner" text={text} />
    </div>
  );
};

// Inline loading component - for buttons, small areas
export const InlineLoading: React.FC<{ size?: "sm" | "md" }> = ({ size = "sm" }) => {
  return <Loading size={size} variant="spinner" />;
};

// Skeleton loading for content placeholders
export const SkeletonLoader: React.FC<{
  rows?: number;
  showAvatar?: boolean;
  className?: string;
}> = ({ rows = 3, showAvatar = false, className = "" }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {showAvatar && (
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
            style={{ width: `${Math.random() * 40 + 60}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
};

// Card skeleton
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] animate-pulse"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Table skeleton
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 4 
}) => {
  return (
    <div className="animate-pulse">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-3 mb-3">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4">
            {Array.from({ length: cols }).map((_, colIndex) => (
              <div
                key={colIndex}
                className="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded"
                style={{ width: `${Math.random() * 30 + 70}%` }}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Loading;
