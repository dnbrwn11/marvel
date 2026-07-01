// Slider — labeled range input with a live value readout. Teal accent thumb/track
// via accent-color. Smooth visual feedback on drag.

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** Formats the live readout (defaults to locale integer). */
  format?: (value: number) => string;
  unit?: string;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (v) => v.toLocaleString("en-US"),
  unit,
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="font-display text-sm font-medium tabular-nums text-teal">
          {format(value)}
          {unit ? <span className="ml-0.5 text-muted">{unit}</span> : null}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full outline-none transition-[background] duration-150 accent-teal"
        style={{
          background: `linear-gradient(to right, var(--color-teal) 0%, var(--color-teal) ${pct}%, var(--color-card) ${pct}%, var(--color-card) 100%)`,
        }}
      />
    </label>
  );
}
