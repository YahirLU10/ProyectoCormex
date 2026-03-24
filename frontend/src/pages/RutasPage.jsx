import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';

const RutasPage = () => {
  const [ciudades, setCiudades] = useState([]);
  const [choferesDisponibles, setChoferesDisponibles] = useState([]);
  
  // --- ESTADOS: FORMULARIO ---
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState('');
  const [nombreRuta, setNombreRuta] = useState('');
  const [tipoServicio, setTipoServicio] = useState('');
  const [choferSeleccionado, setChoferSeleccionado] = useState('');
  const [capacidad, setCapacidad] = useState('');

  // --- ESTADOS: BASE DE DATOS Y FILTROS ---
  const [rutasData, setRutasData] = useState([]); // Toda la BD
  const [rutasLista, setRutasLista] = useState([]); // Lo que se muestra
  const [filtroCiudad, setFiltroCiudad] = useState('');
  const [filtroNombre, setFiltroNombre] = useState('');

  // --- ESTADOS: MODAL ---
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEdicion, setIdEdicion] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  // --- REFERENCIAS ---
  const ciudadRef = useRef(null);
  const nombreRef = useRef(null);
  const tipoRef = useRef(null);
  const choferRef = useRef(null);
  const capacidadRef = useRef(null);

  // Al cargar, traemos TODAS las ciudades y TODAS las rutas
  useEffect(() => { 
    cargarCiudades(); 
    cargarTodasLasRutas();
  }, []);

  // Lógica para filtrar rutas localmente
  useEffect(() => {
    let filtrados = rutasData;

    if (filtroCiudad) {
      filtrados = filtrados.filter(ruta => ruta.id_ciudad === parseInt(filtroCiudad) || ruta.nombre_ciudad.toLowerCase() === ciudades.find(c => c.id_ciudad === parseInt(filtroCiudad))?.nombre_ciudad.toLowerCase());
    }

    if (filtroNombre) {
      const busqueda = filtroNombre.toLowerCase();
      filtrados = filtrados.filter(ruta => ruta.nombre_ruta.toLowerCase().includes(busqueda));
    }

    setRutasLista(filtrados);
  }, [rutasData, filtroCiudad, filtroNombre, ciudades]);

  // Cargar choferes dinámicamente en el formulario al elegir ciudad
  useEffect(() => {
    if (ciudadSeleccionada) {
      cargarChoferesPorCiudad(ciudadSeleccionada);
    } else {
      setChoferesDisponibles([]);
      setChoferSeleccionado('');
    }
  }, [ciudadSeleccionada]);

  const cargarCiudades = async () => {
    try {
      const response = await api.get('/ciudades');
      setCiudades(response.data);
    } catch (error) { toast.error('Error al cargar ciudades.'); }
  };

  const cargarTodasLasRutas = async () => {
    try {
      const response = await api.get('/rutas');
      setRutasData(response.data);
    } catch (error) { toast.error('Error al cargar la base de datos de rutas.'); }
  };

  const cargarChoferesPorCiudad = async (idCiudad) => {
    try {
      const response = await api.get(`/empleados/ciudad/${idCiudad}`);
      setChoferesDisponibles(response.data);
      if (response.data.length === 0) {
        toast.error('No hay choferes disponibles en esta ciudad.', { icon: '⚠️' });
      }
    } catch (error) { toast.error('Error al cargar choferes.'); }
  };

  const handleAlfanumerico = (e, setter) => {
    const valor = e.target.value;
    if (/^[a-zA-Z0-9\s]*$/.test(valor)) {
      if (valor.length <= 15) setter(valor);
      else toast.error('Máximo 15 caracteres permitidos.');
    } else {
      toast.error('Solo se permiten caracteres alfanuméricos.');
    }
  };

  const limpiarFormulario = () => {
    setCiudadSeleccionada('');
    setNombreRuta('');
    setTipoServicio('');
    setChoferSeleccionado('');
    setCapacidad('');
    setModoEdicion(false);
    setIdEdicion(null);
  };

  const abrirModalNuevo = () => {
    limpiarFormulario();
    setMostrarModal(true);
    setTimeout(() => { if(ciudadRef.current) ciudadRef.current.focus(); }, 100);
  };

  const cerrarModal = () => {
    limpiarFormulario();
    setMostrarModal(false);
  };

  const cargarParaEdicion = (ruta) => {
    setModoEdicion(true);
    setIdEdicion(ruta.id_ruta);
    
    // Si la ruta no tiene id_ciudad (porque viene del JOIN), buscamos su ID por el nombre
    let ciudadId = ruta.id_ciudad;
    if (!ciudadId) {
      const c = ciudades.find(ciu => ciu.nombre_ciudad.toLowerCase() === ruta.nombre_ciudad.toLowerCase());
      if (c) ciudadId = c.id_ciudad;
    }

    setCiudadSeleccionada(ciudadId ? ciudadId.toString() : ''); 
    setNombreRuta(ruta.nombre_ruta);
    setTipoServicio(ruta.tipo_servicio);
    setCapacidad(ruta.capacidad);
    
    setTimeout(() => {
        setChoferSeleccionado(ruta.id_empleado ? ruta.id_empleado.toString() : '');
    }, 300);

    setMostrarModal(true);
  };

  const guardarRuta = async () => {
    if (!ciudadSeleccionada) { toast.error('Falta seleccionar la ciudad.'); return ciudadRef.current.focus(); }
    if (!nombreRuta) { toast.error('Falta capturar el nombre de la ruta.'); return nombreRef.current.focus(); }
    if (!tipoServicio) { toast.error('Falta seleccionar el tipo de servicio.'); return tipoRef.current.focus(); }
    if (!choferSeleccionado) { toast.error('Falta seleccionar un chofer.'); return choferRef.current.focus(); }
    if (!capacidad || capacidad <= 0) { toast.error('La capacidad debe ser mayor a cero.'); return capacidadRef.current.focus(); }

    const capNum = parseInt(capacidad);
    if (tipoServicio === 'Artículos' && capNum > 100) {
        toast.error('La capacidad para Artículos no debe superar 100.');
        return capacidadRef.current.focus();
    }
    if (tipoServicio === 'Personal' && capNum > 34) {
        toast.error('La capacidad para Personal no debe superar 34.');
        return capacidadRef.current.focus();
    }

    try {
      if (modoEdicion) {
        await api.put(`/rutas/${idEdicion}`, {
          id_empleado: parseInt(choferSeleccionado),
          tipo_servicio: tipoServicio,
          capacidad: capNum
        });
        toast.success('Ruta actualizada correctamente.');
      } else {
        await api.post('/rutas', {
          id_ciudad: parseInt(ciudadSeleccionada),
          id_empleado: parseInt(choferSeleccionado),
          nombre_ruta: nombreRuta.trim(),
          tipo_servicio: tipoServicio,
          capacidad: capNum
        });
        toast.success('Ruta registrada correctamente.');
      }
      
      cerrarModal();
      cargarTodasLasRutas(); // Recargar la tabla completa
      
    } catch (error) {
      const mensajeError = error.response?.data?.detail || 'Error al guardar.';
      toast.error(typeof mensajeError === 'string' ? mensajeError : 'Error en la validación.');
    }
  };

  const eliminarRuta = async (idRuta) => {
    const result = await Swal.fire({
      title: '¿Eliminar ruta?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545', 
      cancelButtonColor: '#6c757d', 
      confirmButtonText: '<i class="bi bi-trash"></i> Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const res = await api.delete(`/rutas/${idRuta}`);
        toast.success(res.data.mensaje || 'Ruta eliminada.');
        cargarTodasLasRutas();
      } catch (error) {
        const mensajeError = error.response?.data?.detail || 'Error al eliminar.';
        toast.error(typeof mensajeError === 'string' ? mensajeError : 'Error al eliminar');
      }
    }
  };

  return (
    <div className="container mt-4 mb-5" style={{ maxWidth: '1000px' }}>
      
      {/* --- CABECERA --- */}
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <h2 className="mb-0 text-dark fw-bold"><i className="bi bi-signpost-split text-primary me-2"></i>Catálogo de Rutas</h2>
        <button className="btn btn-primary fw-bold px-4 shadow-sm btn-nav-animado" onClick={abrirModalNuevo}>
          <i className="bi bi-plus-lg me-2"></i>Nueva Ruta
        </button>
      </div>

      {/* --- SECCIÓN DE FILTROS --- */}
      <div className="row mb-4 bg-light p-3 rounded shadow-sm mx-0">
        <div className="col-md-5 mb-3 mb-md-0">
          <label className="fw-bold text-secondary mb-2"><i className="bi bi-geo-alt me-2"></i>FILTRAR POR CIUDAD:</label>
          <select className="form-select border-primary" value={filtroCiudad} onChange={(e) => setFiltroCiudad(e.target.value)}>
            <option value="">-- TODAS LAS CIUDADES --</option>
            {ciudades.map(c => <option key={c.id_ciudad} value={c.id_ciudad}>{c.nombre_ciudad.toUpperCase()}</option>)}
          </select>
        </div>
        <div className="col-md-7">
          <label className="fw-bold text-secondary mb-2"><i className="bi bi-search me-2"></i>BUSCAR POR NOMBRE:</label>
          <input type="text" className="form-control border-primary" placeholder="Escribe el nombre de la ruta..." value={filtroNombre} onChange={(e) => setFiltroNombre(e.target.value)} />
        </div>
      </div>

      {/* --- TABLA DE RESULTADOS --- */}
      {rutasLista.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-bordered table-hover shadow-sm align-middle text-center bg-white">
            <thead className="table-primary text-dark">
              <tr>
                <th>ID</th>
                <th>Ciudad</th>
                <th>Nombre de Ruta</th>
                <th>Capacidad</th>
                <th>Tipo</th>
                <th>Chofer Asignado</th>
                <th>Modificar</th>
                <th>Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {rutasLista.map((ruta) => (
                <tr key={ruta.id_ruta}>
                  <td>{ruta.id_ruta}</td>
                  <td>{ruta.nombre_ciudad?.toUpperCase()}</td>
                  <td className="fw-bold">{ruta.nombre_ruta}</td>
                  <td>{ruta.capacidad}</td>
                  <td>
                    <span className={`badge ${ruta.tipo_servicio === 'Personal' ? 'bg-info text-dark' : 'bg-secondary'}`}>
                      {ruta.tipo_servicio}
                    </span>
                  </td>
                  <td>{ruta.nombre_empleado} {ruta.apellido_paterno}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => cargarParaEdicion(ruta)} title="Modificar">
                      <i className="bi bi-pencil-square"></i>
                    </button>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => eliminarRuta(ruta.id_ruta)} title="Eliminar">
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="alert alert-secondary text-center mt-4 shadow-sm text-dark">
          <i className="bi bi-info-circle fs-4 d-block mb-2"></i>
          No se encontraron rutas con los filtros aplicados.
        </div>
      )}

      {/* --- MODAL DE ALTA/EDICIÓN --- */}
      {mostrarModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              
              <div className="modal-header bg-light border-bottom">
                <h5 className="modal-title fw-bold text-dark">
                  {modoEdicion ? <><i className="bi bi-pencil-square text-warning me-2"></i>Modificar Ruta</> : <><i className="bi bi-signpost-split text-primary me-2"></i>Alta de Rutas</>}
                </h5>
                <button type="button" className="btn-close" onClick={cerrarModal}></button>
              </div>
              
              <div className="modal-body px-5 py-4">
                <p className="text-muted mb-4">Proporcione los datos siguientes:</p>

                <div className="row mb-3 align-items-center">
                  <label className="col-sm-4 col-form-label text-end fw-semibold text-dark">Ciudad:</label>
                  <div className="col-sm-8">
                    <select className="form-select" value={ciudadSeleccionada} onChange={(e) => setCiudadSeleccionada(e.target.value)} ref={ciudadRef} disabled={modoEdicion}>
                      <option value="">SELECCIONE</option>
                      {ciudades.map(c => <option key={c.id_ciudad} value={c.id_ciudad}>{c.nombre_ciudad.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>

                <div className="row mb-3 align-items-center">
                  <label className="col-sm-4 col-form-label text-end fw-semibold text-dark">Nombre de la Ruta:</label>
                  <div className="col-sm-8">
                    <input type="text" className="form-control" value={nombreRuta} onChange={(e) => handleAlfanumerico(e, setNombreRuta)} ref={nombreRef} disabled={modoEdicion} />
                  </div>
                </div>

                <div className="row mb-3 align-items-center">
                  <label className="col-sm-4 col-form-label text-end fw-semibold text-dark">Tipo:</label>
                  <div className="col-sm-8">
                    <select className="form-select" value={tipoServicio} onChange={(e) => setTipoServicio(e.target.value)} ref={tipoRef}>
                      <option value="">SELECCIONE</option>
                      <option value="Personal">Personal</option>
                      <option value="Artículos">Artículos</option>
                    </select>
                  </div>
                </div>

                <div className="row mb-3 align-items-center">
                  <label className="col-sm-4 col-form-label text-end fw-semibold text-dark">Chofer:</label>
                  <div className="col-sm-8">
                    <select className="form-select" value={choferSeleccionado} onChange={(e) => setChoferSeleccionado(e.target.value)} ref={choferRef}>
                      <option value="">SELECCIONE</option>
                      {choferesDisponibles.map(chofer => (
                        <option key={chofer.id_empleado} value={chofer.id_empleado}>
                          {`${chofer.nombre_empleado} ${chofer.apellido_paterno} ${chofer.apellido_materno}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="row mb-4 align-items-center">
                  <label className="col-sm-4 col-form-label text-end fw-semibold text-dark">Capacidad:</label>
                  <div className="col-sm-4">
                    <input type="number" className="form-control" min="1" value={capacidad} onChange={(e) => setCapacidad(e.target.value)} ref={capacidadRef} />
                  </div>
                </div>
              </div>

              <div className="modal-footer justify-content-between bg-light">
                <button className="btn btn-outline-danger px-4" onClick={cerrarModal}>
                  <i className="bi bi-x-circle me-2"></i>[ESC] Salir
                </button>
                <button className={`btn px-4 ${modoEdicion ? 'btn-warning text-dark fw-bold' : 'btn-success'}`} onClick={guardarRuta}>
                  {modoEdicion ? <><i className="bi bi-floppy me-2"></i>Actualizar</> : <><i className="bi bi-check-circle me-2"></i>[F10] Aceptar</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RutasPage;