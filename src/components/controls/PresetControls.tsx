import { useState } from 'react'
import type { BuiltinPreset, UserPreset } from '../../visual/presets'

interface PresetControlsProps {
  builtInPresets: BuiltinPreset[]
  userPresets: UserPreset[]
  storageMessage: string | null
  onApplyBuiltIn: (id: string) => void
  onApplyUser: (id: string) => void
  onSave: (name: string) => boolean
  onGenerate: () => void
  onReset: () => void
}

export function PresetControls({
  builtInPresets,
  userPresets,
  storageMessage,
  onApplyBuiltIn,
  onApplyUser,
  onSave,
  onGenerate,
  onReset,
}: PresetControlsProps) {
  const [name, setName] = useState('')

  return (
    <div>
      <select
        className="preset-select"
        aria-label="Apply preset"
        value=""
        onChange={(event) => {
          const value = event.currentTarget.value
          if (value.startsWith('builtin:')) {
            onApplyBuiltIn(value.slice('builtin:'.length))
          } else if (value.startsWith('user:')) {
            onApplyUser(value.slice('user:'.length))
          }
        }}
      >
        <option value="" disabled>
          Apply preset…
        </option>
        <optgroup label="Curated">
          {builtInPresets.map((preset) => (
            <option key={preset.id} value={`builtin:${preset.id}`}>
              {preset.name}
            </option>
          ))}
        </optgroup>
        {userPresets.length > 0 && (
          <optgroup label="Saved">
            {userPresets.map((preset) => (
              <option key={preset.id} value={`user:${preset.id}`}>
                {preset.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>

      <form
        className="preset-save"
        onSubmit={(event) => {
          event.preventDefault()
          if (onSave(name)) {
            setName('')
          }
        }}
      >
        <input
          type="text"
          value={name}
          maxLength={60}
          placeholder="Preset name"
          aria-label="Preset name"
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <button type="submit" className="text-button compact" disabled={name.trim().length === 0}>
          Save
        </button>
      </form>

      <div className="preset-actions">
        <button type="button" className="action-button" onClick={onGenerate}>
          Generate
        </button>
        <button type="button" className="text-button" onClick={onReset}>
          Reset
        </button>
      </div>

      {storageMessage && (
        <p className="preset-message" role="status">
          {storageMessage}
        </p>
      )}
    </div>
  )
}
