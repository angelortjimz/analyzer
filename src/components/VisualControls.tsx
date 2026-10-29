import { useId } from 'react'
import type { VisualConfig } from '../visual/config'

interface VisualControlsProps {
  config: VisualConfig
  onChange: (patch: Partial<VisualConfig>) => void
}

interface SliderControlProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  displayValue: string
  onChange: (value: number) => void
}

function SliderControl({
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

export function VisualControls({ config, onChange }: VisualControlsProps) {
  const glyphsId = useId()

  return (
    <aside className="visual-controls" aria-labelledby="composition-heading">
      <h2 id="composition-heading">Composition</h2>

      <div className="glyph-control">
        <label htmlFor={glyphsId}>Character pool</label>
        <input
          id={glyphsId}
          type="text"
          value={config.glyphs}
          maxLength={160}
          spellCheck={false}
          autoComplete="off"
          onChange={(event) => onChange({ glyphs: event.currentTarget.value })}
        />
      </div>

      <SliderControl
        label="Density"
        value={config.density}
        min={0.65}
        max={1.5}
        step={0.05}
        displayValue={`${config.density.toFixed(2)}×`}
        onChange={(density) => onChange({ density })}
      />
      <SliderControl
        label="Font size"
        value={config.fontSize}
        min={12}
        max={36}
        step={1}
        displayValue={`${config.fontSize}px`}
        onChange={(fontSize) => onChange({ fontSize })}
      />
      <SliderControl
        label="Reactivity"
        value={config.gain}
        min={0.4}
        max={4}
        step={0.1}
        displayValue={`${config.gain.toFixed(1)}×`}
        onChange={(gain) => onChange({ gain })}
      />
      <SliderControl
        label="Attack"
        value={config.attack}
        min={0.01}
        max={0.3}
        step={0.01}
        displayValue={`${Math.round(config.attack * 1_000)}ms`}
        onChange={(attack) => onChange({ attack })}
      />
      <SliderControl
        label="Decay"
        value={config.decay}
        min={0.05}
        max={1}
        step={0.05}
        displayValue={`${Math.round(config.decay * 1_000)}ms`}
        onChange={(decay) => onChange({ decay })}
      />
      <SliderControl
        label="Chaos"
        value={config.chaos}
        min={0}
        max={1}
        step={0.05}
        displayValue={config.chaos === 0 ? 'Fixed' : `${Math.round(config.chaos * 100)}%`}
        onChange={(chaos) => onChange({ chaos })}
      />
    </aside>
  )
}
