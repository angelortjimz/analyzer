import { useId } from 'react'
import { CONFIG_LIMITS, type VisualConfig } from '../../visual/config'

interface CharacterControlsProps {
  config: VisualConfig
  onChange: (patch: Partial<VisualConfig>) => void
}

export function CharacterControls({ config, onChange }: CharacterControlsProps) {
  const fieldId = useId()

  return (
    <div className="glyph-control">
      <label htmlFor={fieldId}>Character pool</label>
      <input
        id={fieldId}
        type="text"
        value={config.glyphs}
        maxLength={CONFIG_LIMITS.maxGlyphs}
        spellCheck={false}
        autoComplete="off"
        onChange={(event) => onChange({ glyphs: event.currentTarget.value })}
      />
      <span className="control-hint">Characters may repeat to weight selection.</span>
    </div>
  )
}
