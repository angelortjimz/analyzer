import { useId } from 'react'
import { CONFIG_LIMITS, type AssignmentMode, type VisualConfig } from '../../visual/config'
import { OptionButtons } from './OptionButtons'

interface ColorControlsProps {
  config: VisualConfig
  onChange: (patch: Partial<VisualConfig>) => void
}

const assignmentOptions = [
  { value: 'column', label: 'By column' },
  { value: 'random', label: 'Random' },
] as const satisfies readonly { value: AssignmentMode; label: string }[]

const ADDITIONAL_COLORS = ['#c4452c', '#2f6b8a', '#367a58', '#6b4c8a']

export function ColorControls({ config, onChange }: ColorControlsProps) {
  const inputId = useId()

  const updateColor = (index: number, color: string) => {
    const colors = [...config.colors]
    colors[index] = color
    onChange({ colors })
  }

  const removeColor = (index: number) => {
    if (config.colors.length <= 1) {
      return
    }

    onChange({ colors: config.colors.filter((_, colorIndex) => colorIndex !== index) })
  }

  const addColor = () => {
    if (config.colors.length >= CONFIG_LIMITS.maxColors) {
      return
    }

    const color =
      ADDITIONAL_COLORS.find((candidate) => !config.colors.includes(candidate)) ??
      ADDITIONAL_COLORS[0]
    onChange({ colors: [...config.colors, color] })
  }

  return (
    <div>
      <div className="color-setting">
        <label htmlFor={`${inputId}-background`}>Background</label>
        <input
          id={`${inputId}-background`}
          type="color"
          value={config.backgroundColor}
          onChange={(event) => onChange({ backgroundColor: event.currentTarget.value })}
        />
      </div>

      <fieldset className="choice-fieldset">
        <legend>Glyph palette</legend>
        <div className="palette-list">
          {config.colors.map((color, index) => (
            <div className="palette-row" key={index}>
              <input
                type="color"
                value={color}
                aria-label={`Palette color ${index + 1}`}
                onChange={(event) => updateColor(index, event.currentTarget.value)}
              />
              <span>{color}</span>
              <button
                type="button"
                className="text-button compact"
                disabled={config.colors.length === 1}
                onClick={() => removeColor(index)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="text-button compact"
          disabled={config.colors.length >= CONFIG_LIMITS.maxColors}
          onClick={addColor}
        >
          Add color
        </button>
      </fieldset>

      <OptionButtons
        label="Color assignment"
        value={config.colorAssignment}
        options={assignmentOptions}
        onChange={(colorAssignment) => onChange({ colorAssignment })}
      />
      <span className="control-hint">Random colors change with the column&apos;s character.</span>
    </div>
  )
}
