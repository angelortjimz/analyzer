import { useId } from 'react'

interface SliderControlProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  displayValue: string
  onChange: (value: number) => void
}

export function SliderControl({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
}: SliderControlProps) {
  const inputId = useId()

  return (
    <div className="slider-control">
      <div className="slider-label">
        <label htmlFor={inputId}>{label}</label>
        <output htmlFor={inputId}>{displayValue}</output>
      </div>
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </div>
  )
}
