import { useState, type ReactNode } from 'react'
import type { VisualConfig } from '../visual/config'
import type { BuiltinPreset, UserPreset } from '../visual/presets'
import { CharacterControls } from './controls/CharacterControls'
import { ColorControls } from './controls/ColorControls'
import { FontControls } from './controls/FontControls'
import { PresetControls } from './controls/PresetControls'
import { ResponseControls } from './controls/ResponseControls'

interface VisualControlsProps {
  config: VisualConfig
  builtInPresets: BuiltinPreset[]
  userPresets: UserPreset[]
  storageMessage: string | null
  onChange: (patch: Partial<VisualConfig>) => void
  onApplyBuiltIn: (id: string) => void
  onApplyUser: (id: string) => void
  onSavePreset: (name: string) => boolean
  onGenerate: () => void
  onReset: () => void
}

function ControlGroup({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <details
      className="control-group"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>{title}</summary>
      <div className="control-group-body">{children}</div>
    </details>
  )
}

export function VisualControls({
  config,
  builtInPresets,
  userPresets,
  storageMessage,
  onChange,
  onApplyBuiltIn,
  onApplyUser,
  onSavePreset,
  onGenerate,
  onReset,
}: VisualControlsProps) {
  return (
    <aside className="visual-controls" aria-labelledby="composition-heading">
      <h2 id="composition-heading">Composition</h2>

      <ControlGroup title="Presets" defaultOpen>
        <PresetControls
          builtInPresets={builtInPresets}
          userPresets={userPresets}
          storageMessage={storageMessage}
          onApplyBuiltIn={onApplyBuiltIn}
          onApplyUser={onApplyUser}
          onSave={onSavePreset}
          onGenerate={onGenerate}
          onReset={onReset}
        />
      </ControlGroup>

      <ControlGroup title="Characters" defaultOpen>
        <CharacterControls config={config} onChange={onChange} />
      </ControlGroup>

      <ControlGroup title="Typography">
        <FontControls config={config} onChange={onChange} />
      </ControlGroup>

      <ControlGroup title="Color">
        <ColorControls config={config} onChange={onChange} />
      </ControlGroup>

      <ControlGroup title="Response">
        <ResponseControls config={config} onChange={onChange} />
      </ControlGroup>
    </aside>
  )
}
