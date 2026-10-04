import { HashRouter } from 'react-router-dom'
import { AppRoutes } from './app/AppRoutes'
import { ScrollToTop } from './components/common/ScrollToTop'
import { SpaceBackgroundEffects } from './components/common/SpaceBackgroundEffects'
import { DailyUsageProvider } from './hooks/useDailyUsage'
import { SaveDataProvider } from './hooks/useSaveData'
import { SaveProtectionNotice } from './components/common/SaveProtectionNotice'
import { RouteErrorBoundary } from './components/common/RouteErrorBoundary'

export default function App() {
  return (
    <HashRouter>
      <SaveDataProvider>
        <DailyUsageProvider>
          <ScrollToTop />
          <SpaceBackgroundEffects />
          <SaveProtectionNotice />
          <RouteErrorBoundary><AppRoutes /></RouteErrorBoundary>
        </DailyUsageProvider>
      </SaveDataProvider>
    </HashRouter>
  )
}
