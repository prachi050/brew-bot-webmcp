import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import { SettingsProvider } from './context/SettingsContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import PlayPage from './pages/PlayPage'
import HelpPage from './pages/HelpPage'
import AboutPage from './pages/AboutPage'
import SettingsPage from './pages/SettingsPage'

// HashRouter keeps deep links working on static hosts like GitHub Pages.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="play" element={<PlayPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<HomePage />} />
          </Route>
        </Routes>
      </HashRouter>
    </SettingsProvider>
  </StrictMode>,
)
