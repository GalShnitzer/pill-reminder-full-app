// Spinner used when loading prop is true
function Spinner() {
  return (
    <svg
      className="w-4 h-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// Variant → class string
const VARIANT_CLASSES = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost:
    'text-slate-300 hover:text-slate-100 hover:bg-slate-800/60 font-medium rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
};

// Size overrides (padding + text) — btn-* classes already have md sizing,
// so we only need to override for sm and lg.
const SIZE_CLASSES = {
  sm: 'py-1.5 px-3.5 text-xs',
  md: '',   // default from btn-* classes
  lg: 'py-3 px-7 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  ...rest
}) {
  const variantClass = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary;
  const sizeClass = SIZE_CLASSES[size] ?? '';

  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      className={[
        // Base layout
        'inline-flex items-center justify-center gap-2',
        // Variant (includes base styles from index.css utility classes)
        variantClass,
        // Size override when not md
        sizeClass,
        // Consumer className (append last so it can override)
        rest.className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {loading ? (
        <>
          <Spinner />
          <span>Loading…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
