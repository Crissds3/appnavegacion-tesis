import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useCompass
 * ──────────
 * Devuelve el rumbo magnético del dispositivo en grados (0 = Norte, 90 = Este…).
 *
 * @returns {{
 *   heading: number|null,
 *   supported: boolean,
 *   permissionState: 'idle'|'pending'|'granted'|'denied'|'unavailable',
 *   requestCompassPermission: () => Promise<void>
 * }}
 */
const useCompass = () => {
  const [heading, setHeading]               = useState(null);
  const [supported, setSupported]           = useState(false);
  const [permissionState, setPermission]    = useState('idle');
  const listenerAttached                    = useRef(false);

  // ── Determina si es iOS 13+ (necesita permiso explícito) ──────────────────
  const isIOS = () =>
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function';

  // ── Handler del evento de orientación ─────────────────────────────────────
  const handleOrientation = useCallback((event) => {
    let deg = null;

    if (typeof event.webkitCompassHeading === 'number') {
      // ── iOS: webkitCompassHeading ya da grados desde el Norte (0–360) ──
      deg = event.webkitCompassHeading;
    } else if (event.absolute && typeof event.alpha === 'number') {
      // ── Android (absolute): el Norte está en 360 - alpha ──────────────
      deg = (360 - event.alpha + 360) % 360;
    } else if (typeof event.alpha === 'number') {
      // ── Fallback Android sin absolute: menos preciso pero funcional ───
      deg = (360 - event.alpha + 360) % 360;
    }

    if (deg !== null) {
      setHeading(Math.round(deg));
    }
  }, []);

  // ── Adjunta el listener ────────────────────────────────────────────────────
  const attachListener = useCallback(() => {
    if (listenerAttached.current) return;

    // Preferir el evento absoluto (más preciso en Android)
    const eventName = 'ondeviceorientationabsolute' in window
      ? 'deviceorientationabsolute'
      : 'deviceorientation';

    window.addEventListener(eventName, handleOrientation, true);
    listenerAttached.current = true;
    setPermission('granted');
  }, [handleOrientation]);

  // ── Pedir permiso (público, para llamar desde el botón "Navegar") ─────────
  const requestCompassPermission = useCallback(async () => {
    if (listenerAttached.current) return; // ya escuchando

    if (isIOS()) {
      // iOS 13+: debe llamarse desde un gesto del usuario
      setPermission('pending');
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === 'granted') {
          attachListener();
        } else {
          setPermission('denied');
          console.warn('[useCompass] Permiso de orientación denegado en iOS.');
        }
      } catch (err) {
        setPermission('denied');
        console.error('[useCompass] Error al pedir permiso iOS:', err);
      }
    } else if (typeof DeviceOrientationEvent !== 'undefined') {
      // Android / desktop — sin barrera de permiso
      attachListener();
    } else {
      setPermission('unavailable');
      console.warn('[useCompass] DeviceOrientationEvent no disponible.');
    }
  }, [attachListener]);

  // ── Comprobar soporte al montar ────────────────────────────────────────────
  useEffect(() => {
    const hasSupport = typeof DeviceOrientationEvent !== 'undefined';
    setSupported(hasSupport);

    // Android no necesita permiso explícito → adjuntar directamente
    if (hasSupport && !isIOS()) {
      attachListener();
    }

    return () => {
      if (listenerAttached.current) {
        const eventName = 'ondeviceorientationabsolute' in window
          ? 'deviceorientationabsolute'
          : 'deviceorientation';
        window.removeEventListener(eventName, handleOrientation, true);
        listenerAttached.current = false;
      }
    };
  }, [attachListener, handleOrientation]);

  return { heading, supported, permissionState, requestCompassPermission };
};

export default useCompass;
