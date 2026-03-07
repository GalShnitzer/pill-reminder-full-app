import { forwardRef } from 'react';
import ReactPhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

// Injects our input-field style into the library's text input
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
      inputComponent={CustomInput}
      className={`phone-input ${className}`}
    />
  );
}
