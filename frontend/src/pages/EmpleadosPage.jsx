import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

const EmpleadosPage = () => {
  const [ciudades, setCiudades] = useState([]);
  
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState('');
  const [nombre, setNombre] = useState('');
  const [apPaterno, setApPaterno] = useState('');
  const [apMaterno, setApMaterno] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [sueldo, setSueldo] = useState('');

  const [ciudadBusqueda, setCiudadBusqueda] = useState('');
  const [empleadosLista, setEmpleadosLista] = useState([]);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEdicion, setIdEdicion] = useState(null);

  const ciudadRef = useRef(null);
  const nombreRef = useRef(null);
  const apPaternoRef = useRef(null);
  const apMaternoRef = useRef(null);
  const fechaRef = useRef(null);
  const sueldoRef = useRef(null);

  useEffect(() => { cargarCiudades(); }, []);
  useEffect(() => {
    if (ciudadBusqueda) buscarEmpleados(ciudadBusqueda);
    else setEmpleadosLista([]);
  }, [ciudadBusqueda]);

  const cargarCiudades = async () => {
    try {
      const response = await api.get('/ciudades');
      setCiudades(response.data);
    } catch (error) { toast.error('Error al cargar ciudades.'); }
  };

  const buscarEmpleados = async (idCiudad) => {
    try {
      const response = await api.get(`/empleados/ciudad/${idCiudad}`);
      setEmpleadosLista(response.data);
    } catch (error) { toast.error('Error al buscar empleados.'); }
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
    if(ciudadRef.current) ciudadRef.current.focus();
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success("Modo edición activado. Modifique fecha o sueldo.");
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
      limpiarFormulario();
      if (ciudadBusqueda) buscarEmpleados(ciudadBusqueda);
    } catch (error) {
      const mensajeError = error.response?.data?.detail || 'Error al guardar.';
      toast.error(typeof mensajeError === 'string' ? mensajeError : 'Error en la validación.');
    }
  };

const eliminarEmpleado = async (idEmpleado) => {
    // Nueva alerta profesional con SweetAlert2
    const result = await Swal.fire({
      title: '¿Eliminar empleado?',
      text: "Se dará de baja a este chofer del sistema.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545', // Rojo Bootstrap
      cancelButtonColor: '#6c757d', // Gris Bootstrap
      confirmButtonText: '<i class="bi bi-trash"></i> Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    // Si el usuario confirma, hacemos la petición a tu API
    if (result.isConfirmed) {
      try {
        const res = await api.delete(`/empleados/${idEmpleado}`);
        toast.success(res.data.mensaje || 'Empleado dado de baja.');
        buscarEmpleados(ciudadBusqueda);
      } catch (error) {
        const mensajeError = error.response?.data?.detail || 'Error al eliminar.';
        toast.error(typeof mensajeError === 'string' ? mensajeError : 'Error al eliminar');
      }
    }
  };

  return (
    <div className="container mt-4 text-dark mb-5" style={{ maxWidth: '900px' }}>
      
      <div className="card shadow-sm mb-5">
        <div className="card-header text-white" style={{ backgroundColor: modoEdicion ? '#ffc107' : '#0d6efd' }}>
          <span className="fw-bold text-dark">
            {modoEdicion ? <><i className="bi bi-pencil-square me-2"></i>Modificar Empleado</> : <><i className="bi bi-person-plus-fill me-2"></i>Alta de Empleados</>} - Proporcione los datos siguientes:
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
            <label className="col-sm-3 col-form-label text-end fw-semibold">Nombre:</label>
            <div className="col-sm-8">
              <input type="text" className="form-control" value={nombre} onChange={(e) => handleSoloLetras(e, setNombre)} ref={nombreRef} disabled={modoEdicion} />
            </div>
          </div>

          <div className="row mb-3 align-items-center">
            <label className="col-sm-3 col-form-label text-end fw-semibold">AP. Paterno:</label>
            <div className="col-sm-8">
              <input type="text" className="form-control" value={apPaterno} onChange={(e) => handleSoloLetras(e, setApPaterno)} ref={apPaternoRef} disabled={modoEdicion} />
            </div>
          </div>

          <div className="row mb-3 align-items-center">
            <label className="col-sm-3 col-form-label text-end fw-semibold">AP. Materno:</label>
            <div className="col-sm-8">
              <input type="text" className="form-control" value={apMaterno} onChange={(e) => handleSoloLetras(e, setApMaterno)} ref={apMaternoRef} disabled={modoEdicion} />
            </div>
          </div>

          <div className="row mb-3 align-items-center">
            <label className="col-sm-3 col-form-label text-end fw-semibold">Fecha nacimiento:</label>
            <div className="col-sm-4">
              <input type="date" className="form-control" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} ref={fechaRef} />
            </div>
          </div>

          <div className="row mb-4 align-items-center">
            <label className="col-sm-3 col-form-label text-end fw-semibold">Sueldo:</label>
            <div className="col-sm-4 position-relative">
              <span className="position-absolute" style={{ left: '22px', top: '7px' }}>$</span>
              <input type="number" className="form-control ps-4" step="0.01" min="0" value={sueldo} onChange={(e) => setSueldo(e.target.value)} ref={sueldoRef} />
            </div>
          </div>

          <div className="d-flex justify-content-between mt-5">
            <button className={`btn px-4 ${modoEdicion ? 'btn-warning text-dark fw-bold' : 'btn-success'}`} onClick={guardarEmpleado}>
              {modoEdicion ? <><i className="bi bi-floppy me-2"></i>Actualizar Cambios</> : <><i className="bi bi-check-circle me-2"></i>[F10] Aceptar</>}
            </button>
            <button className="btn btn-danger px-4" onClick={limpiarFormulario}>
              <i className="bi bi-x-circle me-2"></i>[ESC] Salir / Cancelar
            </button>
          </div>

        </div>
      </div>

      <hr className="my-5" />

      <h3 className="mb-3"><i className="bi bi-search me-2"></i>Búsqueda de Empleados</h3>
      <div className="row mb-4 align-items-center">
        <label className="col-sm-2 col-form-label fw-semibold">CIUDAD:</label>
        <div className="col-sm-5">
          <select className="form-select" value={ciudadBusqueda} onChange={(e) => setCiudadBusqueda(e.target.value)}>
            <option value="">- SELECCIONE -</option>
            {ciudades.map(c => <option key={c.id_ciudad} value={c.id_ciudad}>{c.nombre_ciudad.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      {empleadosLista.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-bordered table-hover shadow-sm align-middle text-center">
            <thead className="table-primary">
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
                <tr key={emp.id_empleado} className={idEdicion === emp.id_empleado ? 'table-warning' : ''}>
                  <td>{emp.id_empleado}</td>
                  <td>{emp.nombre_empleado}</td>
                  <td>{emp.apellido_paterno}</td>
                  <td>{emp.apellido_materno}</td>
                  <td>{emp.fecha_nacimiento}</td>
                  <td>${emp.sueldo.toFixed(2)}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => cargarParaEdicion(emp)}>
                      <i className="bi bi-pencil-square"></i>
                    </button>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => eliminarEmpleado(emp.id_empleado)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        ciudadBusqueda && <p className="text-muted mt-3 text-center"><i className="bi bi-info-circle me-1"></i>No hay empleados activos en esta ciudad.</p>
      )}

    </div>
  );
};

export default EmpleadosPage;