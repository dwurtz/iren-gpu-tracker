import React, { useState } from 'react';
import { ChevronRight, AlertCircle } from 'lucide-react';
import { useModalBackdrop } from './ModalBackdrop';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  
  useModalBackdrop(isOpen);

  // Reset to step 1 when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setStep(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[10001]">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4">
        {step === 1 ? (
          <>
            {/* Step 1: How it works */}
            <div className="p-8">
              <div className="flex items-center justify-center mb-6">
                <img src="https://iren.com/icons/logo.svg" alt="IREN" className="h-12" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
                Welcome to GPU Tracker
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Add batches of GPUs over time and adjust profitability settings to compute ARR and Net Profit.
                </p>
                <p>
                  Your changes persist locally, but you can reset to defaults anytime.
                </p>
                <p className="text-gray-500 text-sm italic">
                  Have fun exploring!
                </p>
              </div>
            </div>
            <div className="border-t border-gray-200 p-4 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="flex items-center space-x-2 bg-green-400 text-white px-6 py-2 rounded-lg hover:bg-green-500 transition-colors"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Step 2: Disclaimer */}
            <div className="p-8">
              <div className="flex items-center justify-center mb-6 text-amber-500">
                <AlertCircle size={48} />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                Important Notice
              </h2>
              <div className="space-y-4 text-gray-600 text-center">
                <p>
                  This tool is <strong>not affiliated with IREN</strong>.
                </p>
                <p>
                  All data and assumptions are inferred from public company guidance and do not represent official company information.
                </p>
              </div>
            </div>
            <div className="border-t border-gray-200 p-4 flex justify-end">
              <button
                onClick={onClose}
                className="bg-green-400 text-white px-6 py-2 rounded-lg hover:bg-green-500 transition-colors"
              >
                I Understand
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
