'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const sizes = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-xl',
    lg: 'sm:max-w-3xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center p-0 sm:p-4">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div 
        className={`relative w-full rounded-t-2xl bg-zinc-900 border-x border-t border-zinc-800 sm:rounded-2xl sm:border shadow-2xl transition-all animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 ${sizes[size]}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-xl font-semibold text-zinc-100">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="!p-1 h-auto rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="max-h-[85vh] overflow-y-auto px-6 py-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex flex-col sm:flex-row justify-end gap-3 border-t border-zinc-800 px-6 py-4 bg-zinc-900/50">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
