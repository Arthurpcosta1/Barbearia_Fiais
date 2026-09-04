export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative mx-auto flex aspect-square w-full max-w-[280px] sm:max-w-[320px] items-center justify-center overflow-hidden rounded-2xl border border-[#d1a868]/40 bg-[#072137] shadow-[0_16px_40px_rgba(0,0,0,0.5)] ${className}`}
    >
      <img
        src="/images/logo-fiais.svg"
        alt="Barbearia Fiais Logo"
        className="h-full w-full object-contain"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
