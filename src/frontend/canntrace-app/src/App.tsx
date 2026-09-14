import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense } from 'react'
import { Toaster } from 'sonner'
import { useAuth } from './hooks/useAuth'
import Layout from './components/layout/Layout'
import PaginaLogin from './pages/PaginaLogin'
import PaginaPanel from './pages/PaginaPanel'
import ErrorBoundary from './components/ErrorBoundary'
import { ConfirmProvider } from './hooks/useConfirm'
import { lazyWithRetry } from './lib/lazyWithRetry'

// Lazy load con retry — si el chunk falla (post-deploy hash mismatch), recarga index.html.
// Fix del bug "en /operacion hay que apretar F5 siempre": los chunks viejos se borran del
// CDN y el browser con index.html cacheado no puede importarlos.
const PaginaOperacion = lazyWithRetry(() => import('./pages/PaginaOperacion'), 'PaginaOperacion')
const PaginaStock = lazyWithRetry(() => import('./pages/PaginaStock'), 'PaginaStock')
const PaginaHistorial = lazyWithRetry(() => import('./pages/PaginaHistorial'), 'PaginaHistorial')
const PaginaTrazabilidad = lazyWithRetry(() => import('./pages/PaginaTrazabilidad'), 'PaginaTrazabilidad')
const PaginaEscaner = lazyWithRetry(() => import('./pages/PaginaEscaner'), 'PaginaEscaner')
const PaginaConsultas = lazyWithRetry(() => import('./pages/PaginaConsultas'), 'PaginaConsultas')
const PaginaConfiguracion = lazyWithRetry(() => import('./pages/PaginaConfiguracion'), 'PaginaConfiguracion')
const PaginaRegistros = lazyWithRetry(() => import('./pages/PaginaRegistros'), 'PaginaRegistros')
const PaginaChecklistCUMCS = lazyWithRetry(() => import('./pages/PaginaChecklistCUMCS'), 'PaginaChecklistCUMCS')
const PaginaGAMP5 = lazyWithRetry(() => import('./pages/PaginaGAMP5'), 'PaginaGAMP5')
const PaginaAutoAuditoria = lazyWithRetry(() => import('./pages/PaginaAutoAuditoria'), 'PaginaAutoAuditoria')
const PaginaTrazaPublica = lazyWithRetry(() => import('./pages/PaginaTrazaPublica'), 'PaginaTrazaPublica')
const PaginaDashboard = lazyWithRetry(() => import('./pages/PaginaDashboard'), 'PaginaDashboard')
const PaginaCalendario = lazyWithRetry(() => import('./pages/PaginaCalendario'), 'PaginaCalendario')
const PaginaEtiquetasQR = lazyWithRetry(() => import('./pages/PaginaEtiquetasQR'), 'PaginaEtiquetasQR')
const PaginaReprocann = lazyWithRetry(() => import('./pages/PaginaReprocann'), 'PaginaReprocann')
const PaginaAlertas = lazyWithRetry(() => import('./pages/PaginaAlertas'), 'PaginaAlertas')
const PaginaAuditTrail = lazyWithRetry(() => import('./pages/PaginaAuditTrail'), 'PaginaAuditTrail')
const PaginaArbol = lazyWithRetry(() => import('./pages/PaginaArbol'), 'PaginaArbol')
const PaginaMapa = lazyWithRetry(() => import('./pages/PaginaMapa'), 'PaginaMapa')
const PaginaMetricas = lazyWithRetry(() => import('./pages/PaginaMetricas'), 'PaginaMetricas')
const PaginaSOPs = lazyWithRetry(() => import('./pages/PaginaSOPs'), 'PaginaSOPs')
const PaginaTrazInversa = lazyWithRetry(() => import('./pages/PaginaTrazInversa'), 'PaginaTrazInversa')
const PaginaImportador = lazyWithRetry(() => import('./pages/PaginaImportador'), 'PaginaImportador')
const PaginaProcesos = lazyWithRetry(() => import('./pages/PaginaProcesos'), 'PaginaProcesos')
const PaginaFormsCumcs = lazyWithRetry(() => import('./pages/PaginaFormsCumcs'), 'PaginaFormsCumcs')
const PaginaCultivoCalc = lazyWithRetry(() => import('./pages/PaginaCultivoCalc'), 'PaginaCultivoCalc')
const PaginaCoAParser = lazyWithRetry(() => import('./pages/PaginaCoAParser'), 'PaginaCoAParser')
const PaginaExploradorRegistros = lazyWithRetry(() => import('./pages/PaginaExploradorRegistros'), 'PaginaExploradorRegistros')
const PaginaCuadernoAnmat = lazyWithRetry(() => import('./pages/PaginaCuadernoAnmat'), 'PaginaCuadernoAnmat')
const PaginaForecasting = lazyWithRetry(() => import('./pages/PaginaForecasting'), 'PaginaForecasting')
const PaginaChangeControl = lazyWithRetry(() => import('./pages/PaginaChangeControl'), 'PaginaChangeControl')
const PaginaCAPA = lazyWithRetry(() => import('./pages/PaginaCAPA'), 'PaginaCAPA')
const PaginaModelosIA = lazyWithRetry(() => import('./pages/PaginaModelosIA'), 'PaginaModelosIA')
const PaginaLanding = lazyWithRetry(() => import('./pages/PaginaLanding'), 'PaginaLanding')
const PaginaContacto = lazyWithRetry(() => import('./pages/PaginaContacto'), 'PaginaContacto')
const PaginaDocs = lazyWithRetry(() => import('./pages/PaginaDocs'), 'PaginaDocs')
const PaginaOlvideContrasena = lazyWithRetry(() => import('./pages/PaginaOlvideContrasena'), 'PaginaOlvideContrasena')
const PaginaResetContrasena = lazyWithRetry(() => import('./pages/PaginaResetContrasena'), 'PaginaResetContrasena')
const Pagina404 = lazyWithRetry(() => import('./pages/Pagina404'), 'Pagina404')
const PaginaPitch = lazyWithRetry(() => import('./pages/PaginaPitch'), 'PaginaPitch')
const PaginaLegal = lazyWithRetry(() => import('./pages/PaginaLegal'), 'PaginaLegal')

function SpinnerCarga({ texto }: { texto: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-sm text-surface-500">{texto}</p>
      </div>
    </div>
  )
}

/** Home: landing publica si no hay sesion, Layout (Panel) si hay sesion. */
function RutaRaiz() {
  const { autenticado, cargando } = useAuth()
  if (cargando) return <SpinnerCarga texto="Cargando CannTrace..." />
  if (!autenticado) return (
    <Suspense fallback={<SpinnerCarga texto="Cargando..." />}>
      <PaginaLanding />
    </Suspense>
  )
  return <Layout />
}

// Verifica permiso PERO espera a que el usuario se cargue
function RutaConPermiso({ permiso, children }: { permiso: string; children: React.ReactNode }) {
  const { tienePermiso, cargando, usuario } = useAuth()

  // Mientras carga el perfil, no redirigir (mostrar nada, el layout ya tiene spinner)
  if (cargando || !usuario) return null

  if (!tienePermiso(permiso)) return <Navigate to="/" replace />
  return <>{children}</>
}

function App() {
  const { login, autenticado, cargando } = useAuth()

  if (cargando) return <SpinnerCarga texto="Iniciando CannTrace..." />

  return (
    <ErrorBoundary>
    <ConfirmProvider>
    <Toaster richColors position="top-right" closeButton theme="system" />
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={autenticado ? <Navigate to="/" replace /> : <PaginaLogin onLogin={login} />}
        />
        <Route path="/olvide-contrasena" element={<Suspense fallback={<SpinnerCarga texto="Cargando..." />}><PaginaOlvideContrasena /></Suspense>} />
        <Route path="/reset-contrasena" element={<Suspense fallback={<SpinnerCarga texto="Cargando..." />}><PaginaResetContrasena /></Suspense>} />

        {/* Rutas PUBLICAS - docs, contacto, CoA */}
        <Route path="/inicio" element={<Suspense fallback={<SpinnerCarga texto="Cargando..." />}><PaginaLanding /></Suspense>} />
        <Route path="/contacto" element={<Suspense fallback={<SpinnerCarga texto="Cargando..." />}><PaginaContacto /></Suspense>} />
        <Route path="/docs" element={<Suspense fallback={<SpinnerCarga texto="Cargando..." />}><PaginaDocs /></Suspense>} />
        <Route path="/pitch" element={<Suspense fallback={<SpinnerCarga texto="Cargando pitch..." />}><PaginaPitch /></Suspense>} />
        <Route path="/terminos" element={<Suspense fallback={<SpinnerCarga texto="Cargando..." />}><PaginaLegal /></Suspense>} />
        <Route path="/privacidad" element={<Suspense fallback={<SpinnerCarga texto="Cargando..." />}><PaginaLegal /></Suspense>} />
        <Route path="/traza/:codigo" element={<Suspense fallback={<SpinnerCarga texto="Cargando certificado..." />}><PaginaTrazaPublica /></Suspense>} />

        <Route path="/" element={<RutaRaiz />}>
          <Route index element={<PaginaPanel />} />
          <Route path="operacion" element={
            <RutaConPermiso permiso="crear_operacion"><PaginaOperacion /></RutaConPermiso>
          } />
          <Route path="escaner" element={
            <RutaConPermiso permiso="crear_operacion"><PaginaEscaner /></RutaConPermiso>
          } />
          <Route path="consultas" element={<PaginaConsultas />} />
          <Route path="stock" element={<PaginaStock />} />
          <Route path="historial" element={<PaginaHistorial />} />
          <Route path="trazabilidad" element={<PaginaTrazabilidad />} />
          <Route path="dashboard" element={<PaginaDashboard />} />
          <Route path="calendario" element={<PaginaCalendario />} />
          <Route path="etiquetas" element={<PaginaEtiquetasQR />} />
          <Route path="registros" element={<PaginaRegistros />} />
          <Route path="checklist-cumcs" element={<PaginaChecklistCUMCS />} />
          <Route path="auto-auditoria" element={<PaginaAutoAuditoria />} />
          <Route path="configuracion" element={
            <RutaConPermiso permiso="ver_configuracion"><PaginaConfiguracion /></RutaConPermiso>
          } />
          <Route path="gamp5" element={<PaginaGAMP5 />} />
          <Route path="gamp5/:docId" element={<PaginaGAMP5 />} />
          <Route path="reprocann" element={<PaginaReprocann />} />
          <Route path="alertas" element={<PaginaAlertas />} />
          <Route path="audit-trail/:id" element={<PaginaAuditTrail />} />
          <Route path="arbol" element={<PaginaArbol />} />
          <Route path="mapa" element={<PaginaMapa />} />
          <Route path="metricas" element={<PaginaMetricas />} />
          <Route path="sops" element={<PaginaSOPs />} />
          <Route path="inversa" element={<PaginaTrazInversa />} />
          <Route path="importador" element={<PaginaImportador />} />
          <Route path="procesos" element={<PaginaProcesos />} />
          <Route path="forms-cumcs" element={<PaginaFormsCumcs />} />
          <Route path="cultivo" element={<PaginaCultivoCalc />} />
          <Route path="coa-parser" element={<PaginaCoAParser />} />
          <Route path="admin/registros" element={
            <RutaConPermiso permiso="ver_configuracion"><PaginaExploradorRegistros /></RutaConPermiso>
          } />
          <Route path="cuaderno-campo" element={<PaginaCuadernoAnmat />} />
          <Route path="forecasting" element={<PaginaForecasting />} />
          <Route path="change-control" element={<PaginaChangeControl />} />
          <Route path="capa" element={<PaginaCAPA />} />
          <Route path="modelos-ia" element={<PaginaModelosIA />} />
        </Route>

        <Route path="*" element={<Suspense fallback={<SpinnerCarga texto="Cargando..." />}><Pagina404 /></Suspense>} />
      </Routes>
    </BrowserRouter>
    </ConfirmProvider>
    </ErrorBoundary>
  )
}

export default App
