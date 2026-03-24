import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';

const EmpleadosPage = () => {
  const [ciudades, setCiudades] = useState([]);
  
  // --- ESTADOS: FORMULARIO ---
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState('');
  const [nombre, setNombre] = useState('');
  const [apPaterno, setApPaterno] = useState('');
  const [apMaterno, setApMaterno] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [sueldo, setSueldo] = useState('');

  // --- ESTADOS: BASE DE DATOS Y FILTROS ---
  const [empleadosData, setEmpleadosData] = useState([]); // Toda la BD
  const [empleadosLista, setEmpleadosLista] = useState([]); // Lo que se muestra en la tabla
  const [filtroCiudad, setFiltroCiudad] = useState('');
  const [filtroNombre, setFiltroNombre] = useState('');
  
  // --- ESTADOS: MODAL ---
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEdicion, setIdEdicion] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  // --- REFERENCIAS PARA EL CURSOR ---
  const ciudadRef = useRef(null);
  const nombreRef = useRef(null);
  const apPaternoRef = useRef(null);
  const apMaternoRef = useRef(null);
  const fechaRef = useRef(null);
  const sueldoRef = useRef(null);

  // Al cargar la pantalla, traemos TODAS las ciudades y TODOS los empleados
  useEffect(() => { 
    cargarCiudades(); 
    cargarTodosLosEmpleados();
  }, []);

  // Lógica para filtrar la tabla en tiempo real
  useEffect(() => {
    let filtrados = empleadosData;

    if (filtroCiudad) {
      filtrados = filtrados.filter(emp => emp.id_ciudad === parseInt(filtroCiudad));
    }

    if (filtroNombre) {
      const busqueda = filtroNombre.toLowerCase();
      filtrados = filtrados.filter(emp => {
        const nombreCompleto = `${emp.nombre_empleado} ${emp.apellido_paterno} ${emp.apellido_materno}`.toLowerCase();
        return nombreCompleto.includes(busqueda);
      });
    }

    setEmpleadosLista(filtrados);
  }, [empleadosData, filtroCiudad, filtroNombre]);

  const cargarCiudades = async () => {
    try {
      const response = await api.get('/ciudades');
      setCiudades(response.data);
    } catch (error) { toast.error('Error al cargar ciudades.'); }
  };

  const cargarTodosLosEmpleados = async () => {
    try {
      const response = await api.get('/empleados');
      setEmpleadosData(response.data);
    } catch (error) { toast.error('Error al cargar la base de datos de empleados.'); }
  };

  const handleSoloLetras = (e, setter) => {
    const valor = e.target.value;
    if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(valor)) {
      if (valor.length <= 15) setter(valor);
      else toast.error('Máximo 15 caracteres permitidos.');
    } else {
      toast.error('Solo se permiten caracteres alfabéticos.');
    }
  };

  const limpiarFormulario = () => {
    setCiudadSeleccionada('');
    setNombre('');
    setApPaterno('');
    setApMaterno('');
    setFechaNacimiento('');
    setSueldo('');
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

  const cargarParaEdicion = (emp) => {
    setModoEdicion(true);
    setIdEdicion(emp.id_empleado);
    setCiudadSeleccionada(emp.id_ciudad.toString());
    setNombre(emp.nombre_empleado);
    setApPaterno(emp.apellido_paterno);
    setApMaterno(emp.apellido_materno);
    setFechaNacimiento(emp.fecha_nacimiento);
    setSueldo(emp.sueldo);
    setMostrarModal(true);
  };

  const guardarEmpleado = async () => {
    if (!ciudadSeleccionada) { toast.error('Falta seleccionar la ciudad.'); return ciudadRef.current.focus(); }
    if (!nombre) { toast.error('Falta capturar el nombre.'); return nombreRef.current.focus(); }
    if (!apPaterno) { toast.error('Falta capturar el apellido paterno.'); return apPaternoRef.current.focus(); }
    if (!apMaterno) { toast.error('Falta capturar el apellido materno.'); return apMaternoRef.current.focus(); }
    if (!fechaNacimiento) { toast.error('Falta la fecha de nacimiento.'); return fechaRef.current.focus(); }
    if (!sueldo) { toast.error('Falta capturar el sueldo.'); return sueldoRef.current.focus(); }

    try {
      if (modoEdicion) {
        await api.put(`/empleados/${idEdicion}`, { fecha_nacimiento: fechaNacimiento, sueldo: parseFloat(sueldo) });
        toast.success('Empleado actualizado correctamente.');
      } else {
        await api.post('/empleados', {
          id_ciudad: parseInt(ciudadSeleccionada),
          nombre_empleado: nombre.trim(),
          apellido_paterno: apPaterno.trim(),
          apellido_materno: apMaterno.trim(),
          fecha_nacimiento: fechaNacimiento,
          sueldo: parseFloat(sueldo)
        });
        toast.success('Empleado registrado correctamente.');
      }
      cerrarModal();
      cargarTodosLosEmpleados(); // Recargar toda la BD
    } catch (error) {
      const mensajeError = error.response?.data?.detail || 'Error al guardar.';
      toast.error(typeof mensajeError === 'string' ? mensajeError : 'Error en la validación.');
    }
  };

  const eliminarEmpleado = async (idEmpleado) => {
    const result = await Swal.fire({
      title: '¿Eliminar empleado?',
      text: "Se dará de baja a este chofer del sistema.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="bi bi-trash"></i> Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const res = await api.delete(`/empleados/${idEmpleado}`);
        toast.success(res.data.mensaje || 'Empleado dado de baja.');
        cargarTodosLosEmpleados(); // Recargar toda la BD
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
        <h2 className="mb-0 text-dark fw-bold"><i className="bi bi-people-fill text-primary me-2"></i>Padrón de Empleados</h2>
        <button className="btn btn-primary fw-bold px-4 shadow-sm btn-nav-animado" onClick={abrirModalNuevo}>
          <i className="bi bi-plus-lg me-2"></i>Nuevo Chofer
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
          <input type="text" className="form-control border-primary" placeholder="Escribe el nombre o apellido del chofer..." value={filtroNombre} onChange={(e) => setFiltroNombre(e.target.value)} />
        </div>
      </div>

      {/* --- TABLA DE RESULTADOS --- */}
      {empleadosLista.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-bordered table-hover shadow-sm align-middle text-center bg-white">
            <thead className="table-primary text-dark">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Ap.Paterno</th>
                <th>Ap.Materno</th>
                <th>Fecha nacimiento</th>
                <th>Sueldo</th>
                <th>Modificar</th>
                <th>Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {empleadosLista.map((emp) => (
                <tr key={emp.id_empleado}>
                  <td>{emp.id_empleado}</td>
                  <td className="fw-semibold">{emp.nombre_empleado}</td>
                  <td>{emp.apellido_paterno}</td>
                  <td>{emp.apellido_materno}</td>
                  <td>{emp.fecha_nacimiento}</td>
                  <td className="text-success fw-bold">${emp.sueldo.toFixed(2)}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => cargarParaEdicion(emp)} title="Modificar">
                      <i className="bi bi-pencil-square"></i>
                    </button>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => eliminarEmpleado(emp.id_empleado)} title="Eliminar">
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
          No se encontraron empleados con los filtros aplicados.
        </div>
      )}

      {/* --- MODAL DE ALTA/EDICIÓN --- */}
      {mostrarModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              
              {/* Título negro con fondo claro para corregir el contraste */}
              <div className="modal-header bg-light border-bottom">
                <h5 className="modal-title fw-bold text-dark">
                  {modoEdicion ? <><i className="bi bi-pencil-square text-warning me-2"></i>Modificar Empleado</> : <><i className="bi bi-person-plus-fill text-primary me-2"></i>Alta de Empleados</>}
                </h5>
                <button type="button" className="btn-close" onClick={cerrarModal}></button>
              </div>
              
              <div className="modal-body px-5 py-4">
                <p className="text-muted mb-4">Proporcione los datos siguientes:</p>

                <div className="row mb-3 align-items-center">
                  <label className="col-sm-3 col-form-label text-end fw-semibold text-dark">Ciudad:</label>
                  <div className="col-sm-9">
                    <select className="form-select" value={ciudadSeleccionada} onChange={(e) => setCiudadSeleccionada(e.target.value)} ref={ciudadRef} disabled={modoEdicion}>
                      <option value="">SELECCIONE</option>
                      {ciudades.map(c => <option key={c.id_ciudad} value={c.id_ciudad}>{c.nombre_ciudad.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>

                <div className="row mb-3 align-items-center">
                  <label className="col-sm-3 col-form-label text-end fw-semibold text-dark">Nombre:</label>
                  <div className="col-sm-9">
                    <input type="text" className="form-control" value={nombre} onChange={(e) => handleSoloLetras(e, setNombre)} ref={nombreRef} disabled={modoEdicion} />
                  </div>
                </div>

                <div className="row mb-3 align-items-center">
                  <label className="col-sm-3 col-form-label text-end fw-semibold text-dark">AP. Paterno:</label>
                  <div className="col-sm-9">
                    <input type="text" className="form-control" value={apPaterno} onChange={(e) => handleSoloLetras(e, setApPaterno)} ref={apPaternoRef} disabled={modoEdicion} />
                  </div>
                </div>

                <div className="row mb-3 align-items-center">
                  <label className="col-sm-3 col-form-label text-end fw-semibold text-dark">AP. Materno:</label>
                  <div className="col-sm-9">
                    <input type="text" className="form-control" value={apMaterno} onChange={(e) => handleSoloLetras(e, setApMaterno)} ref={apMaternoRef} disabled={modoEdicion} />
                  </div>
                </div>

                <div className="row mb-3 align-items-center">
                  <label className="col-sm-3 col-form-label text-end fw-semibold text-dark">Fecha nacimiento:</label>
                  <div className="col-sm-5">
                    <input type="date" className="form-control" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} ref={fechaRef} />
                  </div>
                </div>

                <div className="row mb-4 align-items-center">
                  <label className="col-sm-3 col-form-label text-end fw-semibold text-dark">Sueldo:</label>
                  <div className="col-sm-5 position-relative">
                    <span className="position-absolute text-muted" style={{ left: '22px', top: '7px' }}>$</span>
                    <input type="number" className="form-control ps-4" step="0.01" min="0" value={sueldo} onChange={(e) => setSueldo(e.target.value)} ref={sueldoRef} />
                  </div>
                </div>
              </div>

              <div className="modal-footer justify-content-between bg-light">
                <button className="btn btn-outline-danger px-4" onClick={cerrarModal}>
                  <i className="bi bi-x-circle me-2"></i>[ESC] Salir
                </button>
                <button className={`btn px-4 ${modoEdicion ? 'btn-warning text-dark fw-bold' : 'btn-success'}`} onClick={guardarEmpleado}>
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

export default EmpleadosPage;