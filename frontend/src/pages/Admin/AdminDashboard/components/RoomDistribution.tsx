import React from 'react';

export const RoomDistribution: React.FC = () => {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm p-6 flex flex-col h-full items-center justify-center relative">
      <h3 className="text-headline-md text-base text-on-surface absolute top-6 left-6">Room Distribution</h3>
      <div className="relative w-48 h-48 mt-8">
        <div
          className="w-full h-full rounded-full"
          style={{
            background:
              'conic-gradient(var(--color-primary-container) 0% 65%, var(--color-secondary-container) 65% 100%)',
          }}
        ></div>
        <div className="absolute inset-4 bg-surface-container-lowest rounded-full flex flex-col items-center justify-center">
          <span className="text-headline-lg text-primary">42</span>
          <span className="text-label-bold text-on-surface-variant uppercase text-xs tracking-wider">Active</span>
        </div>
      </div>
      <div className="flex justify-center gap-6 mt-6 w-full">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary-container"></div>
          <span className="text-body-md text-sm text-on-surface font-medium">
            Game Mode <span className="text-on-surface-variant ml-1">65%</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-secondary-container"></div>
          <span className="text-body-md text-sm text-on-surface font-medium">
            Exam Mode <span className="text-on-surface-variant ml-1">35%</span>
          </span>
        </div>
      </div>
    </div>
  );
};
