interface Option<T extends string> {
  value: T
  label: string
}

interface OptionButtonsProps<T extends string> {
  label: string
  value: T
  options: readonly Option<T>[]
  onChange: (value: T) => void
}

export function OptionButtons<T extends string>({
  label,
  value,
  options,
  onChange,
}: OptionButtonsProps<T>) {
  return (
    <div className="option-control">
      <span className="option-label">{label}</span>
      <div className="option-buttons" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className="option-button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
