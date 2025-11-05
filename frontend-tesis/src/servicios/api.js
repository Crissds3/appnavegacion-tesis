import axios from 'axios';

// Configurar la URL base del backend
const API_URL = 'http://localhost:5000/api';

// Crear instancia de axios
const api = axios.create({
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

export default api;
