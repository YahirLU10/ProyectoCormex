import axios from 'axios';

// Creamos una instancia de axios preconfigurada
const api = axios.create({
    // Esta es la URL base de tu backend en FastAPI
    baseURL: 'http://127.0.0.1:8000/api', 
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;