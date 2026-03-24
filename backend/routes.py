from fastapi import APIRouter, HTTPException
from typing import List
from datetime import date
from database import obtener_conexion
# IMPORTANTE: Asegúrate de que models.py tenga definidos EmpleadoUpdate y RutaUpdate
from models import CiudadResponse, EmpleadoCreate, EmpleadoResponse, EmpleadoUpdate, RutaCreate, RutaListResponse, RutaUpdate

router = APIRouter()

@router.get("/ciudades", response_model=List[CiudadResponse])
def obtener_ciudades():
    conexion = obtener_conexion()
    if not conexion:
        raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
    
    try:
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("SELECT id_ciudad, nombre_ciudad FROM ciudades")
        ciudades = cursor.fetchall()
        return ciudades
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        if conexion.is_connected():
            cursor.close()
            conexion.close()

@router.post("/empleados")
def crear_empleado(empleado: EmpleadoCreate):
    # La validación de edad ya está en el modelo EmpleadoCreate si usaste Pydantic, 
    # pero está bien dejarla aquí como doble validación si lo prefieres.
    hoy = date.today()
    edad = hoy.year - empleado.fecha_nacimiento.year - ((hoy.month, hoy.day) < (empleado.fecha_nacimiento.month, empleado.fecha_nacimiento.day))
    
    if edad < 18:
        raise HTTPException(status_code=400, detail="El empleado debe ser mayor de edad.")
    
    conexion = obtener_conexion()
    if not conexion:
        raise HTTPException(status_code=500, detail="Error de conexión a la BD")
        
    try:
        cursor = conexion.cursor()
        sql = """
            INSERT INTO empleados 
            (id_ciudad, nombre_empleado, apellido_paterno, apellido_materno, fecha_nacimiento, sueldo, activo) 
            VALUES (%s, %s, %s, %s, %s, %s, TRUE)
        """
        valores = (
            empleado.id_ciudad,
            empleado.nombre_empleado,
            empleado.apellido_paterno,
            empleado.apellido_materno,
            empleado.fecha_nacimiento,
            empleado.sueldo
        )
        cursor.execute(sql, valores)
        conexion.commit() 
        
        return {"estado": "Éxito", "mensaje": "Empleado registrado correctamente", "id_empleado": cursor.lastrowid}
        
    except Exception as e:
        conexion.rollback() 
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conexion.is_connected():
            cursor.close()
            conexion.close()

@router.delete("/empleados/{id_empleado}")
def eliminar_empleado(id_empleado: int):
    conexion = obtener_conexion()
    if not conexion:
        raise HTTPException(status_code=500, detail="Error de conexión a la BD")
        
    try:
        cursor = conexion.cursor()
        resultado = cursor.callproc('sp_eliminar_empleado', (id_empleado, 0, ''))
        
        p_exito = resultado[1]
        p_mensaje = resultado[2]
        
        conexion.commit() 
        
        if not p_exito:
            raise HTTPException(status_code=400, detail=p_mensaje)
            
        return {"estado": "Éxito", "mensaje": p_mensaje}
        
    except Exception as e:
        conexion.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conexion.is_connected():
            cursor.close()
            conexion.close()

@router.get("/empleados", response_model=List[EmpleadoResponse])
def obtener_empleados_activos():
    conexion = obtener_conexion()
    if not conexion:
        raise HTTPException(status_code=500, detail="Error de conexión a la BD")
    
    try:
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("SELECT * FROM empleados WHERE activo = TRUE")
        empleados = cursor.fetchall()
        return empleados
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        if conexion.is_connected():
            cursor.close()
            conexion.close()

@router.post("/rutas")
def crear_ruta(ruta: RutaCreate):
    conexion = obtener_conexion()
    if not conexion:
        raise HTTPException(status_code=500, detail="Error de conexión a la BD")
        
    try:
        cursor = conexion.cursor()
        sql = """
            INSERT INTO rutas 
            (id_ciudad, id_empleado, nombre_ruta, tipo_servicio, capacidad) 
            VALUES (%s, %s, %s, %s, %s)
        """
        valores = (
            ruta.id_ciudad,
            ruta.id_empleado,
            ruta.nombre_ruta,
            ruta.tipo_servicio,
            ruta.capacidad
        )
        cursor.execute(sql, valores)
        conexion.commit() 
        
        return {
            "estado": "Éxito", 
            "mensaje": "Ruta registrada correctamente", 
            "id_ruta": cursor.lastrowid
        }
        
    except Exception as e:
        conexion.rollback() 
        raise HTTPException(
            status_code=400, 
            detail=f"Error al registrar ruta. Verifica los datos enviados. Detalle: {str(e)}"
        )
    finally:
        if conexion.is_connected():
            cursor.close()
            conexion.close()

@router.get("/rutas", response_model=List[RutaListResponse])
def obtener_rutas():
    conexion = obtener_conexion()
    if not conexion:
        raise HTTPException(status_code=500, detail="Error de conexión a la BD")
    
    try:
        cursor = conexion.cursor(dictionary=True)
        sql = """
            SELECT 
                r.id_ruta, 
                r.nombre_ruta, 
                r.tipo_servicio, 
                r.capacidad,
                c.nombre_ciudad, 
                e.nombre_empleado, 
                e.apellido_paterno
            FROM rutas r
            INNER JOIN ciudades c ON r.id_ciudad = c.id_ciudad
            INNER JOIN empleados e ON r.id_empleado = e.id_empleado
        """
        cursor.execute(sql)
        rutas = cursor.fetchall()
        return rutas
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        if conexion.is_connected():
            cursor.close()
            conexion.close()

# --- ENDPOINT ACTUALIZADO PARA EMPLEADOS (Solo fecha de nacimiento y sueldo) ---
@router.put("/empleados/{id_empleado}")
def actualizar_empleado(id_empleado: int, empleado: EmpleadoUpdate):
    
    # Si pusiste la validación en el modelo Pydantic, esta parte es opcional, 
    # pero la dejamos para doble chequeo.
    hoy = date.today()
    edad = hoy.year - empleado.fecha_nacimiento.year - ((hoy.month, hoy.day) < (empleado.fecha_nacimiento.month, empleado.fecha_nacimiento.day))
    
    if edad < 18:
        raise HTTPException(status_code=400, detail="El empleado debe ser mayor de edad.")

    conexion = obtener_conexion()
    if not conexion:
        raise HTTPException(status_code=500, detail="Error de conexión a la BD")
        
    try:
        cursor = conexion.cursor()
        # Solo actualizamos fecha de nacimiento y sueldo
        sql = """
            UPDATE empleados 
            SET fecha_nacimiento = %s, 
                sueldo = %s
            WHERE id_empleado = %s AND activo = TRUE
        """
        valores = (
            empleado.fecha_nacimiento,
            empleado.sueldo,
            id_empleado
        )
        cursor.execute(sql, valores)
        conexion.commit() 
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Empleado no encontrado o está dado de baja.")
            
        return {"estado": "Éxito", "mensaje": "Empleado actualizado correctamente"}
        
    except Exception as e:
        conexion.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conexion.is_connected():
            cursor.close()
            conexion.close()

# --- ENDPOINT ACTUALIZADO PARA RUTAS (Solo chofer, tipo y capacidad) ---
@router.put("/rutas/{id_ruta}")
def actualizar_ruta(id_ruta: int, ruta: RutaUpdate):
    conexion = obtener_conexion()
    if not conexion:
        raise HTTPException(status_code=500, detail="Error de conexión a la BD")
        
    try:
        cursor = conexion.cursor()
        # Solo actualizamos id_empleado, tipo_servicio y capacidad
        sql = """
            UPDATE rutas 
            SET id_empleado = %s, 
                tipo_servicio = %s, 
                capacidad = %s
            WHERE id_ruta = %s
        """
        valores = (
            ruta.id_empleado,
            ruta.tipo_servicio,
            ruta.capacidad,
            id_ruta
        )
        cursor.execute(sql, valores)
        conexion.commit() 
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Ruta no encontrada.")
            
        return {"estado": "Éxito", "mensaje": "Ruta actualizada correctamente"}
        
    except Exception as e:
        conexion.rollback()
        raise HTTPException(status_code=400, detail=f"Error al actualizar la ruta: {str(e)}")
    finally:
        if conexion.is_connected():
            cursor.close()
            conexion.close()

@router.delete("/rutas/{id_ruta}")
def eliminar_ruta(id_ruta: int):
    conexion = obtener_conexion()
    if not conexion:
        raise HTTPException(status_code=500, detail="Error de conexión a la BD")
        
    try:
        cursor = conexion.cursor()
        sql = "DELETE FROM rutas WHERE id_ruta = %s"
        cursor.execute(sql, (id_ruta,))
        conexion.commit() 
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Ruta no encontrada.")
            
        return {"estado": "Éxito", "mensaje": "Ruta eliminada correctamente"}
        
    except Exception as e:
        conexion.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conexion.is_connected():
            cursor.close()
            conexion.close()

    # --- ENDPOINT: Obtener Ciudad por ID ---
@router.get("/ciudades/{id_ciudad}", response_model=CiudadResponse)
def obtener_ciudad(id_ciudad: int):
    conexion = obtener_conexion()
    if not conexion:
        raise HTTPException(status_code=500, detail="Error de conexión a la BD")
    
    try:
        cursor = conexion.cursor(dictionary=True)
        cursor.execute("SELECT id_ciudad, nombre_ciudad FROM ciudades WHERE id_ciudad = %s", (id_ciudad,))
        ciudad = cursor.fetchone()
        
        if not ciudad:
            raise HTTPException(status_code=404, detail="Ciudad no encontrada.")
            
        return ciudad
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conexion.is_connected():
            cursor.close()
            conexion.close()

# --- ENDPOINT: Obtener Empleados Activos por Ciudad ---
@router.get("/empleados/ciudad/{id_ciudad}", response_model=List[EmpleadoResponse])
def obtener_empleados_por_ciudad(id_ciudad: int):
    conexion = obtener_conexion()
    if not conexion:
        raise HTTPException(status_code=500, detail="Error de conexión a la BD")
    
    try:
        cursor = conexion.cursor(dictionary=True)
        # Filtramos por ciudad y nos aseguramos de que no estén dados de baja
        sql = "SELECT * FROM empleados WHERE id_ciudad = %s AND activo = TRUE"
        cursor.execute(sql, (id_ciudad,))
        empleados = cursor.fetchall()
        return empleados
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conexion.is_connected():
            cursor.close()
            conexion.close()

# --- ENDPOINT: Obtener Rutas por Ciudad ---
@router.get("/rutas/ciudad/{id_ciudad}", response_model=List[RutaListResponse])
def obtener_rutas_por_ciudad(id_ciudad: int):
    conexion = obtener_conexion()
    if not conexion:
        raise HTTPException(status_code=500, detail="Error de conexión a la BD")
    
    try:
        cursor = conexion.cursor(dictionary=True)
        sql = """
            SELECT 
                r.id_ruta, 
                r.nombre_ruta, 
                r.tipo_servicio, 
                r.capacidad,
                c.nombre_ciudad, 
                e.nombre_empleado, 
                e.apellido_paterno
            FROM rutas r
            INNER JOIN ciudades c ON r.id_ciudad = c.id_ciudad
            INNER JOIN empleados e ON r.id_empleado = e.id_empleado
            WHERE r.id_ciudad = %s
        """
        cursor.execute(sql, (id_ciudad,))
        rutas = cursor.fetchall()
        return rutas
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conexion.is_connected():
            cursor.close()
            conexion.close()