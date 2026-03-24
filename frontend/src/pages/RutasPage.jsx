import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

const RutasPage = () => {
  const [ciudades, setCiudades] = useState([]);
  const [choferesDisponibles, setChoferesDisponibles] = useState([]);
  
  // --- ESTADOS: FORMULARIO ---
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState('');
  const [nombreRuta, setNombreRuta] = useState('');
  const [tipoServicio, setTipoServicio] = useState('');
  const [choferSeleccionado, setChoferSeleccionado] = useState('');
  const [capacidad, setCapacidad] = useState('');

  // --- ESTADOS: BÚSQUEDA Y EDICIÓN ---
  const [ciudadBusqueda, setCiudadBusqueda] = useState('');
  const [rutasLista, setRutasLista] = useState([]);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEdicion, setIdEdicion] = useState(null);

  // --- REFERENCIAS PARA EL CURSOR ---
  const ciudadRef = useRef(null);
  const nombreRef = useRef(null);
  const tipoRef = useRef(null);
  const choferRef = useRef(null);
  const capacidadRef = useRef(null);

  useEffect(() => {
    cargarCiudades();
  }, []);

  // Cargar rutas de la tabla cuando cambia la ciudad de búsqueda
  useEffect(() => {
    if (ciudadBusqueda) buscarRutas(ciudadBusqueda);
    else setRutasLista([]);
  }, [ciudadBusqueda]);

  // Cargar choferes dinámicamente cuando se selecciona una ciudad en el formulario
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

  const cargarChoferesPorCiudad = async (idCiudad) => {
    try {
      const response = await api.get(`/empleados/ciudad/${idCiudad}`);
      setChoferesDisponibles(response.data);
      if (response.data.length === 0) {
        toast.error('No hay choferes disponibles en esta ciudad.', { icon: '⚠️' });
      }
    } catch (error) {
      toast.error('Error al cargar choferes.');
    }
  };

  const buscarRutas = async (idCiudad) => {
    try {
      const response = await api.get(`/rutas/ciudad/${idCiudad}`);
      setRutasLista(response.data);
    } catch (error) { toast.error('Error al buscar rutas.'); }
  };

  // --- VALIDACIONES DE CAPTURA ---
  const handleAlfanumerico = (e, setter) => {
    const valor = e.target.value;
    // Solo letras, números y espacios
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
    if(ciudadRef.current) ciudadRef.current.focus();
  };

  const cargarParaEdicion = (ruta) => {
    setModoEdicion(true);
    setIdEdicion(ruta.id_ruta);
    
    setCiudadSeleccionada(ruta.id_ciudad ? ruta.id_ciudad.toString() : ciudadBusqueda); 
    setNombreRuta(ruta.nombre_ruta);
    setTipoServicio(ruta.tipo_servicio);
    setCapacidad(ruta.capacidad);
    
    // Un pequeño timeout para asegurar que los choferes se cargaron antes de setear el valor
    setTimeout(() => {
        setChoferSeleccionado(ruta.id_empleado ? ruta.id_empleado.toString() : '');
    }, 300);

    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success("Modo edición activado. Modifique Chofer, Tipo o Capacidad.");
  };

  // --- CRUD ---
  const guardarRuta = async () => {
    // 1. Validar campos vacíos
    if (!ciudadSeleccionada) { toast.error('Falta seleccionar la ciudad.'); return ciudadRef.current.focus(); }
    if (!nombreRuta) { toast.error('Falta capturar el nombre de la ruta.'); return nombreRef.current.focus(); }
    if (!tipoServicio) { toast.error('Falta seleccionar el tipo de servicio.'); return tipoRef.current.focus(); }
    if (!choferSeleccionado) { toast.error('Falta seleccionar un chofer.'); return choferRef.current.focus(); }
    if (!capacidad || capacidad <= 0) { toast.error('La capacidad debe ser mayor a cero.'); return capacidadRef.current.focus(); }

    // 2. Validar reglas de negocio del PDF
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
      
      limpiarFormulario();
      if (ciudadBusqueda) buscarRutas(ciudadBusqueda);
      
    } catch (error) {
      const mensajeError = error.response?.data?.detail || 'Error al guardar.';
      toast.error(typeof mensajeError === 'string' ? mensajeError : 'Error en la validación.');
    }
  };

const eliminarRuta = async (idRuta) => {
    // Nueva alerta profesional con SweetAlert2
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
        buscarRutas(ciudadBusqueda);
      } catch (error) {
        const mensajeError = error.response?.data?.detail || 'Error al eliminar.';
        toast.error(typeof mensajeError === 'string' ? mensajeError : 'Error al eliminar');
      }
    }
  };

  return (
    <div className="container mt-4 text-dark mb-5" style={{ maxWidth: '900px' }}>
      
      {/* FORMULARIO DE ALTA / EDICIÓN */}
      <div className="card shadow-sm mb-5">
        <div className="card-header text-white" style={{ backgroundColor: modoEdicion ? '#ffc107' : '#0d6efd' }}>
          <span className="fw-bold text-dark">
            {modoEdicion ? <><i className="bi bi-pencil-square me-2"></i>Modificar Ruta</> : <><i className="bi bi-signpost-split me-2"></i>Alta de Rutas</>} - Proporcione los datos siguientes:
          </span>
        </div>
        <div className="card-body px-5 py-4">
          
          <div className="row mb-3 align-items-center">
            <label className="col-sm-3 col-form-label text-end fw-semibold">Ciudad:</label>
            <div className="col-sm-8">
              <select className="form-select" value={ciudadSeleccionada} onChange={(e) => setCiudadSeleccionada(e.target.value)} ref={ciudadRef} disabled={modoEdicion}>
                <option value="">SELECCIONE</option>
                {ciudades.map(c => <option key={c.id_ciudad} value={c.id_ciudad}>{c.nombre_ciudad.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          <div className="row mb-3 align-items-center">
            <label className="col-sm-3 col-form-label text-end fw-semibold">Nombre de la Ruta:</label>
            <div className="col-sm-8">
              <input type="text" className="form-control" value={nombreRuta} onChange={(e) => handleAlfanumerico(e, setNombreRuta)} ref={nombreRef} disabled={modoEdicion} />
            </div>
          </div>

          <div className="row mb-3 align-items-center">
            <label className="col-sm-3 col-form-label text-end fw-semibold">Tipo:</label>
            <div className="col-sm-8">
              <select className="form-select" value={tipoServicio} onChange={(e) => setTipoServicio(e.target.value)} ref={tipoRef}>
                <option value="">SELECCIONE</option>
                <option value="Personal">Personal</option>
                <option value="Artículos">Artículos</option>
              </select>
            </div>
          </div>

          <div className="row mb-3 align-items-center">
            <label className="col-sm-3 col-form-label text-end fw-semibold">Chofer:</label>
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
            <label className="col-sm-3 col-form-label text-end fw-semibold">Capacidad:</label>
            <div className="col-sm-4">
              <input type="number" className="form-control" min="1" value={capacidad} onChange={(e) => setCapacidad(e.target.value)} ref={capacidadRef} />
            </div>
          </div>

          <div className="d-flex justify-content-between mt-5">
            <button className={`btn px-4 ${modoEdicion ? 'btn-warning text-dark fw-bold' : 'btn-success'}`} onClick={guardarRuta}>
              {modoEdicion ? <><i className="bi bi-floppy me-2"></i>Actualizar Cambios</> : <><i className="bi bi-check-circle me-2"></i>[F10] Aceptar</>}
            </button>
            <button className="btn btn-danger px-4" onClick={limpiarFormulario}>
              <i className="bi bi-x-circle me-2"></i>[ESC] Salir / Cancelar
            </button>
          </div>

        </div>
      </div>

      <hr className="my-5" />

      {/* BÚSQUEDA Y TABLA */}
      <h3 className="mb-3"><i className="bi bi-search me-2"></i>Búsqueda de Rutas</h3>
      <div className="row mb-4 align-items-center">
        <label className="col-sm-2 col-form-label fw-semibold">CIUDAD:</label>
        <div className="col-sm-5">
          <select className="form-select" value={ciudadBusqueda} onChange={(e) => setCiudadBusqueda(e.target.value)}>
            <option value="">- SELECCIONE -</option>
            {ciudades.map(c => <option key={c.id_ciudad} value={c.id_ciudad}>{c.nombre_ciudad.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      {rutasLista.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-bordered table-hover shadow-sm align-middle text-center">
            <thead className="table-primary">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Capacidad</th>
                <th>Tipo</th>
                <th>Chofer</th>
                <th>Modificar</th>
                <th>Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {rutasLista.map((ruta) => (
                <tr key={ruta.id_ruta} className={idEdicion === ruta.id_ruta ? 'table-warning' : ''}>
                  <td>{ruta.id_ruta}</td>
                  <td>{ruta.nombre_ruta}</td>
                  <td>{ruta.capacidad}</td>
                  <td>{ruta.tipo_servicio}</td>
                  <td>{ruta.nombre_empleado} {ruta.apellido_paterno}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => cargarParaEdicion(ruta)}>
                      <i className="bi bi-pencil-square"></i>
                    </button>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => eliminarRuta(ruta.id_ruta)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        ciudadBusqueda && <p className="text-muted mt-3 text-center"><i className="bi bi-info-circle me-1"></i>No hay rutas asignadas en esta ciudad.</p>
      )}

    </div>
  );
};

export default RutasPage;