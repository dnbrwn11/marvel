// SegmentedToggle — a row of mutually-exclusive options. Active option fills teal.
// Generic over the option value type so it binds cleanly to typed Inputs unions.

interface Option<T> {
  value: T;
  label: string;
}

interface SegmentedToggleProps<T extends string | number> {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}

export function SegmentedToggle<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: SegmentedToggleProps<T>) {
  return (
    <div>
      <div className="mb-1.5 text-sm font-medium text-ink">{label}</div>
      <div className="inline-flex w-full rounded-lg border border-card bg-panel p-1">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(opt.value)}
              className={[
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-all duration-150",
                active
                  ? "bg-teal text-white shadow-sm"
                  : "text-muted hover:text-ink",
              ].join(" ")}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
