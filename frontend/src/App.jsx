import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import EmpleadosPage from './pages/EmpleadosPage';
import RutasPage from './pages/RutasPage';

// --- NUEVA PANTALLA DE BIENVENIDA ---
const HomePage = () => (
  <div className="container mt-5 pt-4 text-center">
    <div className="card shadow border-0 rounded-4 mx-auto" style={{ maxWidth: '750px' }}>
      <div className="card-body p-5">
        <i className="bi bi-truck display-1 text-primary mb-3 d-block"></i>
        <h1 className="fw-bolder text-dark mb-2">Sistema de Control de Flota</h1>
        <h3 className="text-secondary mb-4">Cormex Logística</h3>
        <p className="lead text-muted mb-5 px-3">
          Plataforma centralizada para la contratación, renta y gestión de servicios de logística. 
          Administre de manera eficiente las rutas de transporte de personal y artículos, junto con el padrón de choferes activos.
        </p>
        <div className="d-grid gap-3 d-sm-flex justify-content-sm-center">
          <Link to="/rutas" className="btn btn-primary btn-lg px-4 shadow-sm">
            <i className="bi bi-signpost-split me-2"></i> Gestión de Rutas
          </Link>
          <Link to="/empleados" className="btn btn-outline-secondary btn-lg px-4 shadow-sm">
            <i className="bi bi-people-fill me-2"></i> Gestión de Empleados
          </Link>
        </div>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      {/* BARRA DE NAVEGACIÓN */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-4 shadow-sm">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">
            <i className="bi bi-truck me-2"></i>Cormex
          </Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="nav-link text-white" to="/rutas">
                  <i className="bi bi-signpost-split me-1"></i> Rutas
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-white" to="/empleados">
                  <i className="bi bi-people-fill me-1"></i> Empleados
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* CONTENEDOR DE PANTALLAS */}
      <div className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/empleados" element={<EmpleadosPage />} />
          <Route path="/rutas" element={<RutasPage />} />
        </Routes>
      </div>

      {/* NOTIFICACIONES */}
      <Toaster position="top-right" />
    </Router>
  );
}

export default App;