import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CoachPage } from './pages/CoachPage'
import { HomePage } from './pages/HomePage'
import { ImportPage } from './pages/ImportPage'
import { ResultsPage } from './pages/ResultsPage'
import { RoutineEditPage } from './pages/RoutineEditPage'
import { RoutinesPage } from './pages/RoutinesPage'
import { StatsPage } from './pages/StatsPage'
import { WorkoutPage } from './pages/WorkoutPage'
import { StoreProvider } from './store'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter basename={basename || undefined}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="routines" element={<RoutinesPage />} />
            <Route path="routines/new" element={<RoutineEditPage />} />
            <Route path="routines/:id" element={<RoutineEditPage />} />
            <Route path="stats" element={<StatsPage />} />
            <Route path="workout" element={<WorkoutPage />} />
            <Route path="coach" element={<CoachPage />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="results/:id" element={<ResultsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}
