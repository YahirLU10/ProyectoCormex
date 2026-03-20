from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import obtener_conexion
from routes import router as api_router

app = FastAPI(
    title="API de Control de Rutas - Cormex",
    description="Backend para la gestión de flota y rutas.",
    version="1.0.0"
)

# --- Configuración de CORS ---
# Durante el desarrollo usamos ["*"] para permitir conexiones desde cualquier origen.
# En producción, es recomendable cambiar "*" por la URL exacta del frontend (ej. "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], # Permite GET, POST, PUT, DELETE, etc.
    allow_headers=["*"], 
)

# --- Rutas de la API ---
app.include_router(api_router, prefix="/api")

@app.get("/")
def raiz():
    return {"mensaje": "¡Bienvenido a la API de Cormex!"}

@app.get("/test-db")
def probar_base_datos():
    conexion = obtener_conexion()
    if conexion:
        conexion.close()
        return {"estado": "Éxito", "mensaje": "Conexión a la base de datos exitosa."}
    else:
        return {"estado": "Error", "mensaje": "No se pudo conectar a la base de datos."}