import React from 'react';

interface ClickableVariableProps {
  children: React.ReactNode;
  title?: string;
  field?: string;
  onOpenSettings?: (field?: string) => void;
}

export const ClickableVariable: React.FC<ClickableVariableProps> = ({ children, title, field, onOpenSettings }) => (
  <span
    className="bg-yellow-200 hover:bg-yellow-300 cursor-pointer px-1 rounded text-yellow-800 font-medium border border-red-500 relative z-[10002]"
    title={title}
    onClick={(e) => {
      e.stopPropagation();
      if (onOpenSettings && field) {
        onOpenSettings(field);
      } else if (field) {
        // This will be handled by the parent component to open settings
        const event = new CustomEvent('highlightSetting', { detail: { field } });
        window.dispatchEvent(event);
      }
    }}
  >
    {children}
  </span>
);
