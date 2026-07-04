// Módulo central de comunicación con el backend SIGAT.
// La URL del backend se toma de una variable de entorno de Vite para que
// funcione tanto en desarrollo como al desplegar (ver nota .env más abajo).
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const TOKEN_KEY = 'sigat_token';
const ROL_KEY = 'sigat_rol';

// --- Manejo del token (sessionStorage: dura mientras la pestaña esté abierta) ---
export const guardarToken = (token) => sessionStorage.setItem(TOKEN_KEY, token);
export const obtenerToken = () => sessionStorage.getItem(TOKEN_KEY);
export const borrarToken = () => sessionStorage.removeItem(TOKEN_KEY);
export const haySesion = () => !!obtenerToken();

// --- Rol de la sesión actual (el backend lo devuelve como "ROLE_USER" / "ROLE_ADMIN") ---
export const guardarRol = (rol) => sessionStorage.setItem(ROL_KEY, rol || '');
export const obtenerRol = () => sessionStorage.getItem(ROL_KEY) || '';
export const esAdmin = () => obtenerRol().includes('ADMIN');
export const borrarRol = () => sessionStorage.removeItem(ROL_KEY);

// Helper central: agrega la URL base, el token y maneja errores de forma uniforme.
async function apiFetch(path, { method = 'GET', body, auth = true, isForm = false } = {}) {
    const headers = {};
    if (auth) {
        const token = obtenerToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    let payload;
    if (isForm) {
        payload = body; // FormData: el navegador pone el Content-Type con boundary
    } else if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
        payload = JSON.stringify(body);
    }

    const resp = await fetch(`${BASE_URL}${path}`, { method, headers, body: payload });

    if (!resp.ok) {
        let msg = 'Error en la solicitud';
        try {
            const data = await resp.json();
            msg = data.message || data || msg;
        } catch {
            // la respuesta de error no traía JSON
        }
        const error = new Error(typeof msg === 'string' ? msg : 'Error en la solicitud');
        error.status = resp.status;
        throw error;
    }

    // Algunas respuestas no tienen cuerpo (201 CREATED, 200 vacío)
    const text = await resp.text();
    return text ? JSON.parse(text) : null;
}

// ---------- AUTENTICACIÓN ----------
export async function login(email, password) {
    const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { email, password },
        auth: false,
    });
    if (data?.token) guardarToken(data.token);
    if (data?.rol) guardarRol(data.rol);
    return data; // { token, correo, rol }
}

export function logout() {
    borrarToken();
    borrarRol();
}

// datos debe traer las claves que espera RegisterRequest (snake_case):
// { email, confirmation_email, names, surnames, password, phone_number,
//   rut, country, region, city, institution }
export function register(datos) {
    return apiFetch('/api/auth/register', {
        method: 'POST',
        body: datos,
        auth: false,
    });
}

// ---------- PUNTOS DEL MAPA ----------
export function getPuntosActivos() {
    return apiFetch('/api/user/map/points/active/all');
}

export function getPuntosPorEnfermedad(diseaseId) {
    return apiFetch(`/api/user/map/points/active?disease=${diseaseId}`);
}

// pcr debe traer las claves que espera PointCreationRequest (snake_case):
// { rut, disease_id, city, address, in_treatment, treatment_start, next_control }
export function crearPunto(pcr) {
    return apiFetch('/api/user/map/points/new', { method: 'POST', body: pcr });
}

export function desactivarPunto(id) {
    return apiFetch(`/api/user/map/points/${id}/deactivate`, { method: 'PUT' });
}

// ---------- ENFERMEDADES ----------
export function getEnfermedades() {
    return apiFetch('/api/diseases');
}

// ---------- CARGA MASIVA ----------
export function subirCargaMasiva(file) {
    const form = new FormData();
    form.append('file', file);
    return apiFetch('/api/data/upload', { method: 'POST', body: form, isForm: true });
}

// ---------- ADMIN: USUARIOS Y SOLICITUDES ----------
export function getUsuarios() {
    return apiFetch('/api/admin/users');
}

export function getSolicitudesPendientes() {
    return apiFetch('/api/admin/users/approval-pending');
}

export function aprobarUsuario(id) {
    return apiFetch(`/api/admin/users/${id}/approve`, { method: 'PUT' });
}

export function activarUsuario(id) {
    return apiFetch(`/api/admin/users/${id}/activate`, { method: 'PUT' });
}

export function desactivarUsuario(id) {
    return apiFetch(`/api/admin/users/${id}/deactivate`, { method: 'PUT' });
}

export function cambiarRolUsuario(id, admin) {
    return apiFetch(`/api/admin/users/${id}/role`, { method: 'PUT', body: { admin } });
}

export function eliminarUsuario(id) {
    return apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
}

// ---------- ADMIN: HISTORIAL ----------
export function getHistorialGlobal() {
    return apiFetch('/api/admin/history');
}
