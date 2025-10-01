import React, { useEffect, useState } from 'react';

let backdropCount = 0;
let setBackdropVisible: ((visible: boolean) => void) | null = null;

export const useModalBackdrop = (isOpen: boolean) => {
  useEffect(() => {
    if (isOpen) {
      backdropCount++;
      setBackdropVisible?.(true);
    }

    return () => {
      if (isOpen) {
        backdropCount--;
        if (backdropCount === 0) {
          setBackdropVisible?.(false);
        }
      }
    };
  }, [isOpen]);
};

export const ModalBackdrop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setBackdropVisible = setVisible;
    return () => {
      setBackdropVisible = null;
    };
  }, []);

  if (!visible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 pointer-events-none"
      style={{ zIndex: 9998 }}
    />
  );
};

