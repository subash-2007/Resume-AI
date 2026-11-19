import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-mocha-950/80 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full ${maxWidth} bg-mocha-900 border border-silver/20 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-silver/15 flex items-center justify-between bg-mocha-850">
          <div>
            <h3 className="font-serif text-lg font-bold text-silver">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-lavender/80 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-mocha-800 hover:bg-mocha-700 text-silver hover:text-lavender flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};

