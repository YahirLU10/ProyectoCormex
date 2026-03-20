from pydantic import BaseModel, Field, field_validator, model_validator
from datetime import date
from typing import Optional
import re

# --- CIUDADES ---
class CiudadResponse(BaseModel):
    id_ciudad: int
    nombre_ciudad: str

# --- EMPLEADOS ---
class EmpleadoBase(BaseModel):
    id_ciudad: int
    # Validamos que solo sean letras y espacios
    nombre_empleado: str = Field(..., max_length=15, pattern=r'^[a-zA-Z\s]+$')
    apellido_paterno: str = Field(..., max_length=15, pattern=r'^[a-zA-Z\s]+$')
    apellido_materno: str = Field(..., max_length=15, pattern=r'^[a-zA-Z\s]+$')
    fecha_nacimiento: date
    sueldo: float

    @field_validator('fecha_nacimiento')
    @classmethod
    def validar_mayoria_edad(cls, v):
        hoy = date.today()
        edad = hoy.year - v.year - ((hoy.month, hoy.day) < (v.month, v.day))
        if edad < 18:
            raise ValueError('El empleado debe ser mayor de edad.')
        return v

class EmpleadoCreate(EmpleadoBase):
    pass

class EmpleadoUpdate(BaseModel):
    fecha_nacimiento: date
    sueldo: float

    @field_validator('fecha_nacimiento')
    @classmethod
    def validar_mayoria_edad(cls, v):
        hoy = date.today()
        edad = hoy.year - v.year - ((hoy.month, hoy.day) < (v.month, v.day))
        if edad < 18:
            raise ValueError('El empleado debe ser mayor de edad.')
        return v

class EmpleadoResponse(EmpleadoBase):
    id_empleado: int
    activo: bool

# --- RUTAS ---
class RutaBase(BaseModel):
    id_ciudad: int
    id_empleado: int
    # Validamos que sea alfanumérico
    nombre_ruta: str = Field(..., max_length=15, pattern=r'^[a-zA-Z0-9\s]+$')
    tipo_servicio: str = Field(..., max_length=15)
    capacidad: int = Field(..., gt=0) # Capacidad mayor a cero

    @model_validator(mode='after')
    def validar_capacidad_por_tipo(self):
        tipo = self.tipo_servicio.lower()
        if tipo == 'artículos' and self.capacidad > 100:
            raise ValueError('La capacidad para Artículos no debe superar 100.')
        elif tipo == 'personal' and self.capacidad > 34:
            raise ValueError('La capacidad para Personal no debe superar 34.')
        elif tipo not in ['artículos', 'personal', 'articulos']:
            raise ValueError('El tipo de servicio debe ser Personal o Artículos.')
        return self

class RutaCreate(RutaBase):
    pass

class RutaUpdate(BaseModel):
    id_empleado: int
    tipo_servicio: str = Field(..., max_length=15)
    capacidad: int = Field(..., gt=0)

    @model_validator(mode='after')
    def validar_capacidad_por_tipo(self):
        tipo = self.tipo_servicio.lower()
        if tipo == 'artículos' and self.capacidad > 100:
            raise ValueError('La capacidad para Artículos no debe superar 100.')
        elif tipo == 'personal' and self.capacidad > 34:
            raise ValueError('La capacidad para Personal no debe superar 34.')
        return self

class RutaListResponse(BaseModel):
    id_ruta: int
    nombre_ruta: str
    tipo_servicio: str
    capacidad: int
    nombre_ciudad: str
    nombre_empleado: str
    apellido_paterno: str