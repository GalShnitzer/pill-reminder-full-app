import { useId } from 'react';

export default function Input({ label, error, hint, className = '', ...rest }) {
  // Generate a stable unique id to link label and input for accessibility
  const generatedId = useId();
  const inputId = rest.id ?? generatedId;

  return (
    <div className="flex flex-col gap-1 w-full">
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-slate-300"
        >
          {label}
        </label>
      )}

      {/* Input */}
      <input
        {...rest}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
        }
        className={[
          'input-field',
          // Red border when there is an error
          error
            ? 'border-red-500 focus:ring-red-500'
            : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      />

      {/* Error message */}
      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="text-xs text-red-400 mt-0.5"
        >
          {error}
        </p>
      )}

      {/* Hint (only shown when there is no error) */}
      {hint && !error && (
        <p
          id={`${inputId}-hint`}
          className="text-xs text-slate-500 mt-0.5"
        >
          {hint}
        </p>
      )}
    </div>
  );
}
