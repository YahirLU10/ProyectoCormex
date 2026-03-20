# 🚚 Sistema de Control de Rutas y Gestión de Flota - Cormex

Este repositorio contiene la solución a la prueba técnica para **Cormex**. El sistema permite la gestión de empleados (choferes) y el control de altas, bajas y modificaciones de rutas de transporte (Personal y Artículos), asegurando la integridad de los datos y las reglas de negocio solicitadas.

## 🛠️ Stack Tecnológico
* **Backend:** Python, FastAPI, Pydantic, MySQL (`mysql-connector-python`).
* **Frontend:** React (Vite), Axios, React Router, TailwindCSS / Bootstrap (opcional).
* **Base de Datos:** MySQL.

## ✨ Características y Valor Agregado
Además de cumplir estrictamente con los requerimientos base del documento, se implementaron las siguientes mejoras proactivas en la arquitectura:
1. **Baja Lógica (Soft Delete):** Implementación de un *Stored Procedure* (`sp_eliminar_empleado`) que verifica si el empleado tiene rutas asignadas antes de proceder. En lugar de una eliminación física, se cambia su estatus a inactivo, preservando la integridad histórica de la base de datos.
2. **Validación Estricta:** Uso de modelos `Pydantic` con expresiones regulares (`Regex`) para interceptar errores de captura (mayoría de edad, caracteres alfanuméricos, límites de capacidad exactos por tipo) antes de tocar la base de datos, devolviendo códigos HTTP claros (400/422).
3. **Consultas Enriquecidas:** Los endpoints `GET` utilizan sentencias `JOIN` para devolver información descriptiva (nombres de ciudades y empleados) facilitando el consumo por parte del frontend.
4. **Seguridad y Entornos:** Separación de credenciales mediante el uso de variables de entorno (`.env`).

---

## 🚀 Instrucciones de Instalación y Ejecución

### 1. Clonar el repositorio
```bash
git clone [https://github.com/TU_USUARIO/TU_REPOSITORIO.git](https://github.com/TU_USUARIO/TU_REPOSITORIO.git)
cd TU_REPOSITORIO