import { useState, useRef, useEffect, forwardRef } from 'react';
import ReactPhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import 'flag-icons/css/flag-icons.min.css';

function Flag({ country }) {
  if (!country) return <span className="w-6 h-4 bg-gray-200 dark:bg-slate-600 rounded-sm flex-shrink-0 inline-block" />;
  return <span className={`fi fi-${country.toLowerCase()} rounded-sm flex-shrink-0`} style={{ width: 24, height: 16 }} />;
}

function CountryDropdown({ value, onChange, options, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function close(e) { if (!ref.current?.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-gray-300 rounded-xl dark:bg-slate-800 dark:border-slate-600 disabled:opacity-50 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
        aria-label="Select country"
      >
        <Flag country={value} />
        <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-56 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-xl">
          {options?.filter((o) => o.value).map(({ value: v, label }) => (
            <button
              key={v}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onChange(v); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                v === value
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <Flag country={v} />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const CustomInput = forwardRef((props, ref) => (
  <input ref={ref} {...props} className="input-field flex-1 min-w-0" />
));
CustomInput.displayName = 'CustomInput';

export default function PhoneInput({ value = '', onChange, disabled = false, className = '' }) {
  return (
    <ReactPhoneInput
      international
      defaultCountry="IL"
      value={value || undefined}
      onChange={(val) => onChange(val ?? '')}
      disabled={disabled}
      countrySelectComponent={CountryDropdown}
      inputComponent={CustomInput}
      className={`phone-input ${className}`}
    />
  );
}
