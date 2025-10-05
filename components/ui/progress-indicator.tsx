"use client";

import React from 'react';

interface ProgressIndicatorProps {
  percentage: number;
  missingFields?: string[];
  showDetails?: boolean;
}

export function ProgressIndicator({ 
  percentage, 
  missingFields = [], 
  showDetails = false 
}: ProgressIndicatorProps) {
  const getColor = (pct: number) => {
    if (pct >= 80) return 'text-green-600 bg-green-100';
    if (pct >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-orange-600 bg-orange-100';
  };

  const getBarColor = (pct: number) => {
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Brief Completion</span>
        <span className={`text-sm font-bold px-2 py-1 rounded-full ${getColor(percentage)}`}>
          {percentage}%
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div
          className={`h-2 rounded-full transition-all duration-500 ease-out ${getBarColor(percentage)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {showDetails && missingFields.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-2">
            Missing required information:
          </p>
          <ul className="space-y-1">
            {missingFields.map((field, index) => (
              <li key={index} className="text-xs text-gray-500 flex items-center">
                <svg className="w-3 h-3 mr-1 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {field}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Circular progress variant
export function CircularProgress({ percentage }: { percentage: number }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = (pct: number) => {
    if (pct >= 80) return '#10b981'; // green-500
    if (pct >= 50) return '#eab308'; // yellow-500
    return '#f97316'; // orange-500
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle
          cx="48"
          cy="48"
          r="40"
          stroke="#e5e7eb"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="48"
          cy="48"
          r="40"
          stroke={getColor(percentage)}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span className="absolute text-xl font-bold text-gray-700">
        {percentage}%
      </span>
    </div>
  );
}
