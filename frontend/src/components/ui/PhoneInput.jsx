// Country code selector + local number input.
// Value/onChange work with the full E.164-style string (e.g. "+972501234567").

const COUNTRY_CODES = [
  { code: '+972', country: 'Israel',       iso: 'IL' },
  { code: '+1',   country: 'US / Canada',  iso: 'US' },
  { code: '+44',  country: 'UK',           iso: 'GB' },
  { code: '+49',  country: 'Germany',      iso: 'DE' },
  { code: '+33',  country: 'France',       iso: 'FR' },
  { code: '+39',  country: 'Italy',        iso: 'IT' },
  { code: '+34',  country: 'Spain',        iso: 'ES' },
  { code: '+31',  country: 'Netherlands',  iso: 'NL' },
  { code: '+32',  country: 'Belgium',      iso: 'BE' },
  { code: '+41',  country: 'Switzerland',  iso: 'CH' },
  { code: '+43',  country: 'Austria',      iso: 'AT' },
  { code: '+48',  country: 'Poland',       iso: 'PL' },
  { code: '+7',   country: 'Russia',       iso: 'RU' },
  { code: '+90',  country: 'Turkey',       iso: 'TR' },
  { code: '+971', country: 'UAE',          iso: 'AE' },
  { code: '+966', country: 'Saudi Arabia', iso: 'SA' },
  { code: '+962', country: 'Jordan',       iso: 'JO' },
  { code: '+20',  country: 'Egypt',        iso: 'EG' },
  { code: '+27',  country: 'South Africa', iso: 'ZA' },
  { code: '+91',  country: 'India',        iso: 'IN' },
  { code: '+86',  country: 'China',        iso: 'CN' },
  { code: '+81',  country: 'Japan',        iso: 'JP' },
  { code: '+82',  country: 'South Korea',  iso: 'KR' },
  { code: '+61',  country: 'Australia',    iso: 'AU' },
  { code: '+64',  country: 'New Zealand',  iso: 'NZ' },
  { code: '+55',  country: 'Brazil',       iso: 'BR' },
  { code: '+52',  country: 'Mexico',       iso: 'MX' },
  { code: '+54',  country: 'Argentina',    iso: 'AR' },
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
        {COUNTRY_CODES.map(({ code: c, country, iso }) => (
          <option key={c} value={c}>
            {iso} {c} — {country}
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
