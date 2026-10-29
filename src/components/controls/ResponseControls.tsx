import { CONFIG_LIMITS, type VisualConfig } from '../../visual/config'
import { SliderControl } from './SliderControl'

interface ResponseControlsProps {
  config: VisualConfig
  onChange: (patch: Partial<VisualConfig>) => void
}

export function ResponseControls({ config, onChange }: ResponseControlsProps) {
  return (
    <div>
      <SliderControl
        label="Reactivity"
        value={config.gain}
        min={CONFIG_LIMITS.gain.min}
        max={CONFIG_LIMITS.gain.max}
        step={0.1}
        displayValue={`${config.gain.toFixed(1)}×`}
        onChange={(gain) => onChange({ gain })}
      />
      <SliderControl
        label="Attack"
        value={config.attack}
        min={CONFIG_LIMITS.attack.min}
        max={CONFIG_LIMITS.attack.max}
        step={0.01}
        displayValue={`${Math.round(config.attack * 1_000)}ms`}
        onChange={(attack) => onChange({ attack })}
      />
      <SliderControl
        label="Decay"
        value={config.decay}
        min={CONFIG_LIMITS.decay.min}
        max={CONFIG_LIMITS.decay.max}
        step={0.01}
        displayValue={`${Math.round(config.decay * 1_000)}ms`}
        onChange={(decay) => onChange({ decay })}
      />
      <SliderControl
        label="Chaos"
        value={config.chaos}
        min={CONFIG_LIMITS.chaos.min}
        max={CONFIG_LIMITS.chaos.max}
        step={0.05}
        displayValue={config.chaos === 0 ? 'Fixed' : `${Math.round(config.chaos * 100)}%`}
        onChange={(chaos) => onChange({ chaos })}
      />
    </div>
  )
}
