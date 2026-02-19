import { forwardRef, SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className = '', id, placeholder, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-zinc-100 transition-colors focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-50 appearance-none ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
          } ${className}`}
          {...props}
          defaultValue={props.defaultValue || ""}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
