import { useState, useEffect } from 'react';

/**
 * Custom Hook para gestionar la geolocalización reactiva del usuario
 * Se suscribe automáticamente a los cambios de posición del dispositivo
 * Gestiona permisos del navegador y maneja errores de precisión
 */
const useGeolocation = (opciones = {}) => {
  const [ubicacion, setUbicacion] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [permisosConcedidos, setPermisosConcedidos] = useState(false);
  const [precision, setPrecision] = useState(null);

  useEffect(() => {
    // Verificar si el navegador soporta geolocalización
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }

    let watchId;

    // Callback cuando se obtiene la posición exitosamente
    const handleExito = (position) => {
      const nuevaUbicacion = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        precision: position.coords.accuracy, // Precisión en metros
        altitud: position.coords.altitude,
        timestamp: position.timestamp
      };

      setUbicacion(nuevaUbicacion);
      setPrecision(position.coords.accuracy);
      setCargando(false);
      setPermisosConcedidos(true);
      setError(null);
    };

    // Callback cuando ocurre un error
    const handleError = (err) => {
      setCargando(false);
      
      let mensajeError;
      switch(err.code) {
        case err.PERMISSION_DENIED:
          mensajeError = 'Permiso de geolocalización denegado. Por favor, habilita la ubicación en tu navegador.';
          setPermisosConcedidos(false);
          break;
        case err.POSITION_UNAVAILABLE:
          mensajeError = 'Información de ubicación no disponible. Verifica tu conexión GPS.';
          break;
        case err.TIMEOUT:
          mensajeError = 'La solicitud de ubicación ha excedido el tiempo límite.';
          break;
        default:
          mensajeError = 'Error desconocido al obtener la ubicación.';
      }

      setError(mensajeError);
      console.error('❌ Error de geolocalización:', mensajeError);
    };

    // Configuración para watchPosition (seguimiento reactivo)
    const config = {
      enableHighAccuracy: true, // Máxima precisión (usa GPS si está disponible)
      timeout: 10000, // 10 segundos máximo de espera
      maximumAge: 5000, // Cache de posición válida por 5 segundos
      ...opciones // Permitir sobrescribir opciones
    };

    // Iniciar seguimiento de posición en tiempo real
    setCargando(true);
    
    watchId = navigator.geolocation.watchPosition(
      handleExito,
      handleError,
      config
    );

    // Cleanup: detener el seguimiento al desmontar el componente
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [opciones.enableHighAccuracy, opciones.timeout, opciones.maximumAge]);

  // Función para solicitar ubicación una sola vez (no reactiva)
  const solicitarUbicacion = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }

    setCargando(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nuevaUbicacion = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          precision: position.coords.accuracy,
          altitud: position.coords.altitude,
          timestamp: position.timestamp
        };

        setUbicacion(nuevaUbicacion);
        setPrecision(position.coords.accuracy);
        setCargando(false);
        setPermisosConcedidos(true);
      },
      (err) => {
        let mensajeError;
        switch(err.code) {
          case err.PERMISSION_DENIED:
            mensajeError = 'Permiso de geolocalización denegado.';
            setPermisosConcedidos(false);
            break;
          case err.POSITION_UNAVAILABLE:
            mensajeError = 'Información de ubicación no disponible.';
            break;
          case err.TIMEOUT:
            mensajeError = 'Tiempo de espera excedido.';
            break;
          default:
            mensajeError = 'Error desconocido.';
        }
        setError(mensajeError);
        setCargando(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0 // No usar cache
      }
    );
  };

  return {
    ubicacion,          // Objeto con lat, lng, precision, etc.
    error,              // Mensaje de error si ocurre
    cargando,           // Estado de carga
    permisosConcedidos, // Si el usuario dio permisos
    precision,          // Precisión en metros
    solicitarUbicacion  // Función para solicitar ubicación manual
  };
};

export default useGeolocation;
