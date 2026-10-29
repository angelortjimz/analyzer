import type { ReactNode } from 'react'
import type { VisualConfig } from '../visual/config'
import { CharacterControls } from './controls/CharacterControls'
import { ColorControls } from './controls/ColorControls'
import { FontControls } from './controls/FontControls'
import { ResponseControls } from './controls/ResponseControls'

interface VisualControlsProps {
  config: VisualConfig
  onChange: (patch: Partial<VisualConfig>) => void
  onGenerate: () => void
  onReset: () => void
}

function ControlSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="control-group">
      <h3>{title}</h3>
      <div className="control-group-body">{children}</div>
    </section>
  )
}

export function VisualControls({ config, onChange, onGenerate, onReset }: VisualControlsProps) {
  return (
    <aside className="visual-controls" aria-labelledby="composition-heading">
      <h2 id="composition-heading">Composition</h2>

      <ControlSection title="Characters">
        <CharacterControls config={config} onChange={onChange} />
      </ControlSection>

      <ControlSection title="Typography">
        <FontControls config={config} onChange={onChange} />
      </ControlSection>

      <ControlSection title="Color">
        <ColorControls config={config} onChange={onChange} />
      </ControlSection>

      <ControlSection title="Response">
        <ResponseControls config={config} onChange={onChange} />
      </ControlSection>

      <div className="generation-actions">
        <button type="button" className="action-button" onClick={onGenerate}>
          Generate
        </button>
        <button type="button" className="text-button" onClick={onReset}>
          Reset
        </button>
      </div>
    </aside>
  )
}
