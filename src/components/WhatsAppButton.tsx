import React from 'react';
import { MessageCircle } from 'lucide-react';

type WhatsAppButtonProps = {
  href: string;
  children?: React.ReactNode;
  className?: string;
  floating?: boolean;
  onClick?: () => void;
};

export function WhatsAppButton({
  href,
  children = 'Agendar no WhatsApp',
  className = '',
  floating = false,
  onClick,
}: WhatsAppButtonProps) {
  if (floating) {
    return (
      <a
        id="btn-floating-whatsapp"
        aria-label="Agendar no WhatsApp"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#08a71f] text-white shadow-[0_12px_32px_rgba(8,167,31,0.45)] transition duration-200 hover:scale-105 hover:bg-[#12bf2c] active:scale-95"
      >
        <MessageCircle className="h-7 w-7" />
        <span className="sr-only">Conversar no WhatsApp</span>
      </a>
    );
  }

  return (
    <a
      id="btn-whatsapp-action"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-md bg-[#08a71f] px-6 py-3.5 text-sm font-black uppercase tracking-wide text-white shadow-[0_12px_32px_rgba(8,167,31,0.28)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#12bf2c] hover:shadow-[0_16px_36px_rgba(8,167,31,0.38)] active:translate-y-0 ${className}`}
    >
      <MessageCircle className="h-5 w-5" />
      <span>{children}</span>
    </a>
  );
}
