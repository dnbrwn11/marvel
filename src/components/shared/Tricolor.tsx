// The GAP signature: teal → magenta → orange rule in equal thirds. Used beneath
// the header and as a deliberate section divider — not everywhere.

export function Tricolor({ className = "" }: { className?: string }) {
  return <div className={`gap-tricolor ${className}`} role="presentation" />;
}
