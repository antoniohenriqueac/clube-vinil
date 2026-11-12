import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AdminCaptacao } from './pages/admin/AdminCaptacao'
import { AdminCuration } from './pages/admin/AdminCuration'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminPartners } from './pages/admin/AdminPartners'
import { AdminSettings } from './pages/admin/AdminSettings'
import { AdminStock } from './pages/admin/AdminStock'
import { AdminSubscribers } from './pages/admin/AdminSubscribers'
import { Checkout } from './pages/Checkout'
import { Flyer } from './pages/Flyer'
import { Landing } from './pages/Landing'
import { Quiz } from './pages/Quiz'
import { SellCollection } from './pages/SellCollection'
import { Preferences } from './pages/subscriber/Preferences'
import { SubscriberHome } from './pages/subscriber/SubscriberHome'
import { AppProvider } from './state/AppContext'

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="quiz" element={<Quiz />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="venda-sua-colecao" element={<SellCollection />} />
            <Route path="flyer" element={<Flyer />} />
            <Route path="assinante" element={<SubscriberHome />} />
            <Route path="assinante/preferencias" element={<Preferences />} />
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="estoque" element={<AdminStock />} />
              <Route path="assinantes" element={<AdminSubscribers />} />
              <Route path="curadoria" element={<AdminCuration />} />
              <Route path="captacao" element={<AdminCaptacao />} />
              <Route path="parceiros" element={<AdminPartners />} />
              <Route path="config" element={<AdminSettings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  )
}
