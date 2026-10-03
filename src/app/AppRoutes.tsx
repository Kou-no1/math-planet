import { Navigate, Route, Routes } from 'react-router-dom'
import { lazy, Suspense, type ReactNode } from 'react'
import { HomePage } from '../features/home/HomePage'
import { OnboardingPage } from '../features/onboarding/OnboardingPage'
import { PlanetMenuPage } from '../features/planets/PlanetMenuPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { useSaveData } from '../hooks/useSaveData'

const AdvancedPage = lazy(() =>
  import('../features/advanced/AdvancedPage').then((module) => ({
    default: module.AdvancedPage,
  })),
)
const BossBattlePage = lazy(() =>
  import('../features/bosses/BossBattlePage').then((module) => ({
    default: module.BossBattlePage,
  })),
)
const MonsterBookPage = lazy(() =>
  import('../features/book/MonsterBookPage').then((module) => ({
    default: module.MonsterBookPage,
  })),
)
const CustomPage = lazy(() =>
  import('../features/custom/CustomPage').then((module) => ({
    default: module.CustomPage,
  })),
)
const LearnPage = lazy(() =>
  import('../features/learn/LearnPage').then((module) => ({
    default: module.LearnPage,
  })),
)
const MiniGamePage = lazy(() =>
  import('../features/miniGames/MiniGamePage').then((module) => ({
    default: module.MiniGamePage,
  })),
)
const ReviewPage = lazy(() =>
  import('../features/review/ReviewPage').then((module) => ({
    default: module.ReviewPage,
  })),
)
const ResultPage = lazy(() =>
  import('../features/results/ResultPage').then((module) => ({
    default: module.ResultPage,
  })),
)
const ShopPage = lazy(() =>
  import('../features/shop/ShopPage').then((module) => ({
    default: module.ShopPage,
  })),
)
const SpeedPage = lazy(() =>
  import('../features/speed/SpeedPage').then((module) => ({
    default: module.SpeedPage,
  })),
)

function RequireProfile({ children }: { children: ReactNode }) {
  const { saveData } = useSaveData()
  if (!saveData.player) {
    return <Navigate to="/onboarding" replace />
  }
  return children
}

export function AppRoutes() {
  const { saveData } = useSaveData()

  return (
    <Suspense
      fallback={
        <p className="route-loading" role="status">
          よみこみちゅう...
        </p>
      }
    >
      <Routes>
        <Route
          path="/"
          element={<Navigate to={saveData.player ? '/home' : '/onboarding'} replace />}
        />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route
          path="/home"
          element={
            <RequireProfile>
              <HomePage />
            </RequireProfile>
          }
        />
        <Route
          path="/games"
          element={
            <RequireProfile>
              <Navigate to="/planet/multiply" replace />
            </RequireProfile>
          }
        />
        <Route
          path="/planet/:planetId"
          element={
            <RequireProfile>
              <PlanetMenuPage />
            </RequireProfile>
          }
        />
        <Route
          path="/learn"
          element={
            <RequireProfile>
              <LearnPage />
            </RequireProfile>
          }
        />
        <Route
          path="/speed"
          element={
            <RequireProfile>
              <SpeedPage />
            </RequireProfile>
          }
        />
        <Route
          path="/review"
          element={
            <RequireProfile>
              <ReviewPage />
            </RequireProfile>
          }
        />
        <Route
          path="/battle"
          element={
            <RequireProfile>
              <BossBattlePage group="basic" />
            </RequireProfile>
          }
        />
        <Route
          path="/boss/:bossId"
          element={
            <RequireProfile>
              <BossBattlePage />
            </RequireProfile>
          }
        />
        <Route
          path="/monster-battle"
          element={
            <RequireProfile>
              <MiniGamePage variant="battle" />
            </RequireProfile>
          }
        />
        <Route
          path="/treasure"
          element={
            <RequireProfile>
              <MiniGamePage variant="treasure" />
            </RequireProfile>
          }
        />
        <Route
          path="/rocket"
          element={
            <RequireProfile>
              <MiniGamePage variant="rocket" />
            </RequireProfile>
          }
        />
        <Route
          path="/advanced"
          element={
            <RequireProfile>
              <AdvancedPage />
            </RequireProfile>
          }
        />
        <Route
          path="/shop"
          element={
            <RequireProfile>
              <ShopPage />
            </RequireProfile>
          }
        />
        <Route
          path="/custom"
          element={
            <RequireProfile>
              <CustomPage />
            </RequireProfile>
          }
        />
        <Route
          path="/book"
          element={
            <RequireProfile>
              <MonsterBookPage />
            </RequireProfile>
          }
        />
        <Route
          path="/result"
          element={
            <RequireProfile>
              <ResultPage />
            </RequireProfile>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireProfile>
              <SettingsPage />
            </RequireProfile>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
