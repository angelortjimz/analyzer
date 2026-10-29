import { useId } from 'react'
import { CONFIG_LIMITS, type CharacterSource, type VisualConfig } from '../../visual/config'
import { OptionButtons } from './OptionButtons'

interface CharacterControlsProps {
  config: VisualConfig
  onChange: (patch: Partial<VisualConfig>) => void
}

const sourceOptions = [
  { value: 'pool', label: 'Pool' },
  { value: 'text', label: 'Text' },
] as const satisfies readonly { value: CharacterSource; label: string }[]

export function CharacterControls({ config, onChange }: CharacterControlsProps) {
  const fieldId = useId()
  const isText = config.characterSource === 'text'
  return (
    <div>
      <OptionButtons
        label="Character source"
        value={config.characterSource}
        options={sourceOptions}
        onChange={(characterSource) => onChange({ characterSource })}
      />

      <div className="glyph-control">
        <label htmlFor={fieldId}>{isText ? 'Source text' : 'Character pool'}</label>
        {isText ? (
          <textarea
            id={fieldId}
            value={config.sourceText}
            rows={3}
            maxLength={CONFIG_LIMITS.maxSourceText}
            spellCheck={false}
            onChange={(event) => onChange({ sourceText: event.currentTarget.value })}
          />
        ) : (
          <input
            id={fieldId}
            type="text"
            value={config.glyphs}
            maxLength={CONFIG_LIMITS.maxGlyphs}
            spellCheck={false}
            autoComplete="off"
            onChange={(event) => onChange({ glyphs: event.currentTarget.value })}
          />
        )}
        <span className="control-hint">
          {isText
            ? 'Unique characters in reading order.'
            : 'Characters may repeat to weight selection.'}
        </span>
      </div>
    </div>
  )
}
