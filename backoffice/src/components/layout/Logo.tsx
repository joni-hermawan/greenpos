import Image from 'next/image';

// Same mark + wordmark treatment as GreenPos/src/components/Logo.tsx (the
// mobile app) — "green" regular + "pos" bold-accent — using the identical
// PNG asset so the brand looks the same on mobile and web.
export function Logo({ size = 32, variant = 'dark', showText = true }: { size?: number; variant?: 'dark' | 'light'; showText?: boolean }) {
  const baseColor = variant === 'light' ? 'text-paper' : 'text-ink';
  const accentColor = variant === 'light' ? 'text-leaf-light' : 'text-leaf';
  return (
    <div className="flex items-center gap-2">
      <Image src="/logo-mark.png" alt="" width={size} height={size} style={{ width: size, height: size, objectFit: 'contain' }} />
      {showText && (
        <span style={{ fontSize: size * 0.42 }} className="tracking-wide">
          <span className={`${baseColor} font-normal`}>green</span>{' '}
          <span className={`${accentColor} font-extrabold`}>pos</span>
        </span>
      )}
    </div>
  );
}
