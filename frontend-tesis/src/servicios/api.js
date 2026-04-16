import axios from 'axios';

// En desarrollo: http://localhost:5000/api
// En producción: la variable de entorno VITE_API_URL que configuras en Vercel
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

// Crear instancia de axios
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authService = {
  // Registrar usuario
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.success && response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al registrar' };
    }
  },

  // Login
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.success && response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al iniciar sesión' };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Obtener usuario actual
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Obtener perfil
  getProfile: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al obtener perfil' };
    }
  },

  // Actualizar perfil
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/auth/me', userData);
      if (response.data.success) {
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const updatedUser = { ...currentUser, ...response.data.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al actualizar perfil' };
    }
  },

  // Crear nuevo administrador (solo admin)
  crearAdministrador: async (adminData) => {
    try {
      const response = await api.post('/auth/crear-admin', adminData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al crear administrador' };
    }
  },

  // Obtener lista de administradores (solo superadmin)
  getAdministradores: async () => {
    try {
      const response = await api.get('/auth/administradores');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al obtener administradores' };
    }
  },

  // Editar usuario (solo superadmin)
  editarUsuario: async (id, userData) => {
    try {
      const response = await api.put(`/auth/usuarios/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al editar usuario' };
    }
  },

  // Activar/Desactivar usuario (solo superadmin)
  toggleEstadoUsuario: async (id) => {
    try {
      const response = await api.patch(`/auth/usuarios/${id}/toggle-estado`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al cambiar estado' };
    }
  },

  // Resetear contraseña por admin (solo superadmin)
  resetearPasswordPorAdmin: async (id, passwordData) => {
    try {
      const response = await api.patch(`/auth/usuarios/${id}/resetear-password`, passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al resetear contraseña' };
    }
  },

  // Eliminar administrador (solo superadmin)
  eliminarAdministrador: async (id) => {
    try {
      const response = await api.delete(`/auth/administradores/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al eliminar administrador' };
    }
  },
};

// Servicios de noticias
export const noticiasService = {
  // Obtener noticias públicas (con filtros opcionales)
  getNoticias: async (filtros = {}) => {
    try {
      const params = new URLSearchParams();
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.categoria) params.append('categoria', filtros.categoria);
      if (filtros.destacado !== undefined) params.append('destacado', filtros.destacado);
      
      const queryString = params.toString();
      const url = queryString ? `/noticias/publicas?${queryString}` : '/noticias/publicas';
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al obtener noticias' };
    }
  },

  // Obtener una noticia por ID
  getNoticiaById: async (id) => {
    try {
      const response = await api.get(`/noticias/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al obtener noticia' };
    }
  },

  // Obtener todas las noticias (admin)
  getAllNoticias: async () => {
    try {
      const response = await api.get('/noticias');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al obtener noticias' };
    }
  },

  // Crear noticia (admin)
  createNoticia: async (noticiaData) => {
    try {
      const response = await api.post('/noticias', noticiaData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al crear noticia' };
    }
  },

  // Actualizar noticia (admin)
  updateNoticia: async (id, noticiaData) => {
    try {
      const response = await api.put(`/noticias/${id}`, noticiaData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al actualizar noticia' };
    }
  },

  // Eliminar noticia (admin)
  deleteNoticia: async (id) => {
    try {
      const response = await api.delete(`/noticias/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al eliminar noticia' };
    }
  },
};

// Servicios de información universitaria
export const infoService = {
  // Obtener toda la información pública
  getInfo: async () => {
    try {
      const response = await api.get('/info/publica');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al obtener información' };
    }
  },

  // Obtener información por sección
  getInfoBySeccion: async (seccion) => {
    try {
      const response = await api.get(`/info/publica/${seccion}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al obtener información' };
    }
  },

  // Obtener todas las secciones (admin)
  getAllSecciones: async () => {
    try {
      const response = await api.get('/info');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al obtener secciones' };
    }
  },

  // Actualizar información (admin)
  updateInfo: async (infoData) => {
    try {
      const response = await api.put('/info', infoData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al actualizar información' };
    }
  },
};

// Servicios de carreras
export const carrerasService = {
  // Obtener todas las carreras públicas
  getCarreras: async () => {
    try {
      const response = await api.get('/carreras/publicas');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al obtener carreras' };
    }
  },

  // Obtener una carrera por ID
  getCarreraById: async (id) => {
    try {
      const response = await api.get(`/carreras/publica/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al obtener carrera' };
    }
  },

  // Obtener todas las carreras (admin)
  getAllCarreras: async () => {
    try {
      const response = await api.get('/carreras');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al obtener carreras' };
    }
  },

  // Crear carrera (admin)
  createCarrera: async (carreraData) => {
    try {
      const response = await api.post('/carreras', carreraData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al crear carrera' };
    }
  },

  // Actualizar carrera (admin)
  updateCarrera: async (id, carreraData) => {
    try {
      const response = await api.put(`/carreras/${id}`, carreraData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al actualizar carrera' };
    }
  },

  // Eliminar carrera (admin)
  deleteCarrera: async (id) => {
    try {
      const response = await api.delete(`/carreras/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al eliminar carrera' };
    }
  },
};

// Servicios de ubicaciones
export const ubicacionesService = {
  // Obtener todas las ubicaciones públicas
  getUbicacionesPublicas: async () => {
    try {
      const response = await api.get('/ubicaciones/publicas');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error al obtener ubicaciones' };
    }
  },
};

export default api;
