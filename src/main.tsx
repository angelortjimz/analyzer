import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/space-mono/latin-400.css'
import '@fontsource/ibm-plex-serif/latin-400.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import { preloadFontCatalog } from './visual/fonts'

async function start() {
  await preloadFontCatalog()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void start()
