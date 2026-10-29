import { CONFIG_LIMITS, type AssignmentMode, type VisualConfig } from '../../visual/config'
import { FONT_CATALOG, type FontId } from '../../visual/fonts'
import { OptionButtons } from './OptionButtons'
import { SliderControl } from './SliderControl'

interface FontControlsProps {
  config: VisualConfig
  onChange: (patch: Partial<VisualConfig>) => void
}

const assignmentOptions = [
  { value: 'column', label: 'By column' },
  { value: 'random', label: 'Random' },
] as const satisfies readonly { value: AssignmentMode; label: string }[]

export function FontControls({ config, onChange }: FontControlsProps) {
  const toggleFont = (fontId: FontId, enabled: boolean) => {
    const fontIds = enabled
      ? [...config.fontIds, fontId]
      : config.fontIds.filter((id) => id !== fontId)

    if (fontIds.length > 0) {
      onChange({ fontIds })
    }
  }

  return (
    <div>
      <fieldset className="choice-fieldset">
        <legend>Enabled fonts</legend>
        <div className="choice-list">
          {FONT_CATALOG.map((font) => {
            const checked = config.fontIds.includes(font.id)
            return (
              <label key={font.id} className="check-row">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={checked && config.fontIds.length === 1}
                  onChange={(event) => toggleFont(font.id, event.currentTarget.checked)}
                />
                <span style={{ fontFamily: font.stack }}>{font.label}</span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <OptionButtons
        label="Font assignment"
        value={config.fontAssignment}
        options={assignmentOptions}
        onChange={(fontAssignment) => onChange({ fontAssignment })}
      />

      <SliderControl
        label="Font size"
        value={config.fontSize}
        min={CONFIG_LIMITS.fontSize.min}
        max={CONFIG_LIMITS.fontSize.max}
        step={1}
        displayValue={`${config.fontSize}px`}
        onChange={(fontSize) => onChange({ fontSize })}
      />
      <SliderControl
        label="Density"
        value={config.density}
        min={CONFIG_LIMITS.density.min}
        max={CONFIG_LIMITS.density.max}
        step={0.05}
        displayValue={`${config.density.toFixed(2)}×`}
        onChange={(density) => onChange({ density })}
      />

      <span className="control-hint">Random fonts change with the column&apos;s character.</span>
    </div>
  )
}
