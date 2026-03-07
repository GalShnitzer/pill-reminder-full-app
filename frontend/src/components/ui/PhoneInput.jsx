// Country code selector + local number input.
// Value/onChange work with the full E.164-style string (e.g. "+972501234567").

const COUNTRY_CODES = [
  { code: '+972', country: 'Israel',       flag: '🇮🇱' },
  { code: '+1',   country: 'US / Canada',  flag: '🇺🇸' },
  { code: '+44',  country: 'UK',           flag: '🇬🇧' },
  { code: '+49',  country: 'Germany',      flag: '🇩🇪' },
  { code: '+33',  country: 'France',       flag: '🇫🇷' },
  { code: '+39',  country: 'Italy',        flag: '🇮🇹' },
  { code: '+34',  country: 'Spain',        flag: '🇪🇸' },
  { code: '+31',  country: 'Netherlands',  flag: '🇳🇱' },
  { code: '+32',  country: 'Belgium',      flag: '🇧🇪' },
  { code: '+41',  country: 'Switzerland',  flag: '🇨🇭' },
  { code: '+43',  country: 'Austria',      flag: '🇦🇹' },
  { code: '+48',  country: 'Poland',       flag: '🇵🇱' },
  { code: '+7',   country: 'Russia',       flag: '🇷🇺' },
  { code: '+90',  country: 'Turkey',       flag: '🇹🇷' },
  { code: '+971', country: 'UAE',          flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+962', country: 'Jordan',       flag: '🇯🇴' },
  { code: '+20',  country: 'Egypt',        flag: '🇪🇬' },
  { code: '+27',  country: 'South Africa', flag: '🇿🇦' },
  { code: '+91',  country: 'India',        flag: '🇮🇳' },
  { code: '+86',  country: 'China',        flag: '🇨🇳' },
  { code: '+81',  country: 'Japan',        flag: '🇯🇵' },
  { code: '+82',  country: 'South Korea',  flag: '🇰🇷' },
  { code: '+61',  country: 'Australia',    flag: '🇦🇺' },
  { code: '+64',  country: 'New Zealand',  flag: '🇳🇿' },
  { code: '+55',  country: 'Brazil',       flag: '🇧🇷' },
  { code: '+52',  country: 'Mexico',       flag: '🇲🇽' },
  { code: '+54',  country: 'Argentina',    flag: '🇦🇷' },
];

const DEFAULT_CODE = '+972';

/** Try to split a full phone string into { code, local }.
 *  Match longest code first to avoid "+1" eating "+972". */
function splitPhone(full = '') {
  if (!full) return { code: DEFAULT_CODE, local: '' };
  // Sort by code length descending so longer codes match first
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  for (const { code } of sorted) {
    if (full.startsWith(code)) {
      return { code, local: full.slice(code.length) };
    }
  }
  // No match — keep default code, treat whole string as local
  return { code: DEFAULT_CODE, local: full };
}

export default function PhoneInput({ value = '', onChange, disabled = false, className = '' }) {
  const { code, local } = splitPhone(value);

  function handleCodeChange(e) {
    onChange(e.target.value + local);
  }

  function handleLocalChange(e) {
    // Strip spaces/dashes for cleaner storage; keep digits and leading +
    const raw = e.target.value.replace(/[^\d]/g, '');
    onChange(code + raw);
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Country code select */}
      <select
        value={code}
        onChange={handleCodeChange}
        disabled={disabled}
        className="input-field w-36 flex-shrink-0 pr-2"
        aria-label="Country code"
      >
        {COUNTRY_CODES.map(({ code: c, country, flag }) => (
          <option key={c} value={c}>
            {flag} {c}
          </option>
        ))}
      </select>

      {/* Local number */}
      <input
        type="tel"
        value={local}
        onChange={handleLocalChange}
        disabled={disabled}
        placeholder="50 000 0000"
        className="input-field flex-1 min-w-0"
        aria-label="Phone number"
        inputMode="numeric"
      />
    </div>
  );
}
