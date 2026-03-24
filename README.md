# Cormex Logística - Sistema de Control de Rutas y Flota

Este proyecto es una plataforma centralizada para la gestión de rutas de transporte y el padrón de choferes activos de Cormex Logística. Fue desarrollado como parte de la prueba técnica, separando la lógica de negocio en un backend robusto y una interfaz de usuario moderna y reactiva.

## Tecnologías Utilizadas
* **Backend:** Python, FastAPI, Pydantic, MySQL Connector.
* **Frontend:** React, Vite, Bootstrap, SweetAlert2, React Hot Toast, Axios.
* **Base de Datos:** MySQL.

---

## Requisitos Previos
Para ejecutar este proyecto en un entorno local, asegúrese de tener instalado:
* Python 3.8+
* Node.js v18+ y npm
* Servidor MySQL en ejecución (Localhost)

---

## 1. Configuración de la Base de Datos
1. Abra su cliente de MySQL (MySQL Workbench, DBeaver, etc.).
2. Ejecute el script SQL que se encuentra en `sql/init.sql`. Este script creará la base de datos `cormex_db`, las tablas necesarias, el procedimiento almacenado para bajas lógicas y poblará la base de datos con información de prueba (datos semilla).

---

## 2. Levantamiento del Backend (FastAPI)
El backend está construido con FastAPI para garantizar un alto rendimiento y validación estricta de datos.

1. Abra una terminal y navegue a la carpeta raíz del proyecto.
2. Cree un entorno virtual para aislar las dependencias:
   ```bash
   python -m venv venv
   ```
3. Active el entorno virtual:
   * **Windows:** `venv\Scripts\activate`
   * **Mac/Linux:** `source venv/bin/activate`
4. Instale las dependencias necesarias:
   ```bash
   pip install fastapi uvicorn mysql-connector-python pydantic
   ```
5. Configure sus variables de entorno:
   * Copie el archivo `.env.example` y renómbrelo a `.env`.
   * Sustituya los valores genéricos por las credenciales reales de su servidor MySQL local.
6. Inicie el servidor backend:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```
El servidor backend estará corriendo en: `http://127.0.0.1:8000`

---

## 3. Levantamiento del Frontend (React + Vite)
La interfaz de usuario es una Single Page Application (SPA) optimizada con Vite.

1. Abra una **nueva** terminal (manteniendo el backend corriendo en la otra).
2. Navegue a la carpeta del frontend:
   ```bash
   cd frontend
   ```
3. Instale las dependencias y librerías del proyecto:
   ```bash
   npm install
   ```
4. Inicie el servidor de desarrollo:
   ```bash
   npm run dev
   ```
El sistema abrirá automáticamente la aplicación en su navegador (usualmente en `http://localhost:5173`).

---

## Puntos a Destacar (Valor Agregado)
* **Baja Lógica:** La eliminación de empleados no borra el registro físicamente de la base de datos, sino que cambia su estado a inactivo (Soft Delete) mediante un Procedimiento Almacenado, manteniendo la integridad referencial.
* **Validación en Tiempo Real:** Implementación de modales y alertas amigables con SweetAlert2 para evitar el envío de formularios incompletos o con formatos incorrectos.
* **Filtros Dinámicos:** Búsqueda en tiempo real por ciudad y coincidencia de texto en las tablas de visualización.