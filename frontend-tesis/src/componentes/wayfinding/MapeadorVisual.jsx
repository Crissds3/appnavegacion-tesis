/**
 * MapeadorVisual.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Herramienta interna de desarrollo para poblar grafoCampus.json.
 * Accede en: http://localhost:5173/mapeador
 *
 * CÓMO USARLO:
 *  1. Modo NODO   → clic en cualquier parte del mapa → crea un nodo (punto rojo)
 *  2. Modo ARISTA → clic en un nodo rojo (queda naranja) → clic en otro nodo →
 *                   se dibuja la arista (línea verde) con distancia calculada
 *  3. Botón "📋 Imprimir JSON" → abre consola del navegador (F12) para copiarlo
 *  4. Botón "↩ Deshacer" → elimina el último nodo o arista agregada
 *
 * ⚠️  Este componente es SOLO para desarrollo. Elimínalo o desregistra la ruta
 *     antes de hacer build de producción.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Tooltip,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Constantes del campus ────────────────────────────────────────────────────
const CAMPUS_CENTER = [-35.002607, -71.230519];
const CAMPUS_ZOOM   = 18;

// Paleta de colores
const COLOR = {
  nodo:           '#ef4444', // rojo
  nodoSeleccionado:'#f97316', // naranja
  nodoHover:      '#fbbf24', // amarillo
  arista:         '#22c55e', // verde
  texto:          '#ffffff',
};

// ─── Subcomponente: captura eventos del mapa ──────────────────────────────────
/**
 * Renderiza los nodos (CircleMarker) y las aristas (Polyline) sobre el mapa,
 * y maneja toda la lógica de clic para crear nodos y conectar aristas.
 */
const EditorLayer = ({
  nodos,
  aristas,
  modo,
  nodoSeleccionado,
  onClickMapa,
  onClickNodo,
  onHoverNodo,
  nodoHoverId,
  onRenombrarNodo,  // nuevo: abre el modal de renombrado
}) => {
  // Captura clics en el fondo del mapa (tierra/tiles)
  useMapEvents({
    click(e) {
      onClickMapa(e);
    },
  });

  return (
    <>
      {/* ── Aristas (Polylines verdes) ─────────────────────────────────── */}
      {aristas.map((arista) => {
        const nA = nodos.find((n) => n.id === arista.desde);
        const nB = nodos.find((n) => n.id === arista.hasta);
        if (!nA || !nB) return null;

        return (
          <Polyline
            key={arista._key}
            positions={[
              [nA.lat, nA.lng],
              [nB.lat, nB.lng],
            ]}
            pathOptions={{
              color: COLOR.arista,
              weight: 3,
              opacity: 0.85,
              dashArray: '6 4',
            }}
          >
            <Tooltip sticky direction="center" offset={[0, 0]} opacity={0.9}>
              <span style={{ fontSize: 12 }}>
                {arista.desde} ↔ {arista.hasta}
                <br />
                <strong>{arista.distancia} m</strong>
              </span>
            </Tooltip>
          </Polyline>
        );
      })}

      {/* ── Nodos (CircleMarkers rojos) ────────────────────────────────── */}
      {nodos.map((nodo) => {
        const isSelected = nodo.id === nodoSeleccionado;
        const isHovered  = nodo.id === nodoHoverId;

        const color = isSelected
          ? COLOR.nodoSeleccionado
          : isHovered
          ? COLOR.nodoHover
          : COLOR.nodo;

        return (
          <CircleMarker
            key={nodo.id}
            center={[nodo.lat, nodo.lng]}
            radius={isSelected ? 11 : 8}
            pathOptions={{
              color:       '#ffffff',
              weight:      2,
              fillColor:   color,
              fillOpacity: 1,
            }}
            eventHandlers={{
              click(e) {
                // Detener propagación para que no dispare el clic del mapa
                e.originalEvent.stopPropagation();
                onClickNodo(nodo);
              },
              dblclick(e) {
                // Doble clic → abrir modal de renombrado
                e.originalEvent.stopPropagation();
                onRenombrarNodo(nodo);
              },
              mouseover() { onHoverNodo(nodo.id); },
              mouseout()  { onHoverNodo(null); },
            }}
          >
            <Tooltip
              direction="top"
              offset={[0, -10]}
              opacity={1}
              permanent={isSelected}
            >
              <span style={{ fontSize: 11 }}>
                <strong>{nodo.nombre || nodo.id}</strong>
                <br />
                <span style={{ color: '#94a3b8' }}>{nodo.id}</span>
                <br />
                {nodo.lat.toFixed(6)}, {nodo.lng.toFixed(6)}
              </span>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
};

// ─── Subcomponente: acceso a la instancia del mapa para calcular distancias ──
// Usamos un ref + un componente puente porque useMap() solo funciona dentro
// de <MapContainer>.
const MapRefCaptura = ({ mapRef }) => {
  const map = useMapEvents({}); // hook para obtener la instancia del mapa
  mapRef.current = map;
  return null;
};

// ─── Componente principal ─────────────────────────────────────────────────────
const MapeadorVisual = () => {
  const [nodos,           setNodos]           = useState([]);
  const [aristas,         setAristas]         = useState([]);
  const [nodoSeleccionado,setNodoSeleccionado]= useState(null);
  const [nodoHoverId,     setNodoHoverId]     = useState(null);
  const [modo,            setModo]            = useState('nodo');
  const [contadorNodos,   setContadorNodos]   = useState(1);
  const [contadorAristas, setContadorAristas] = useState(1);
  const [log,             setLog]             = useState('Listo. Haz clic en el mapa.');
  // Estado para el modal de renombrado
  const [nodoEditando,    setNodoEditando]    = useState(null);  // nodo completo
  const [borrador,        setBorrador]        = useState('');    // texto del input
  const inputRenombreRef = useRef(null);

  const mapRef = useRef(null); // instancia nativa de Leaflet

  // ── Crear nodo en la posición clicada ──────────────────────────────────────
  const handleClickMapa = useCallback((e) => {
    if (modo !== 'nodo') return;
    // Ignorar clics mientras hay un modal abierto
    if (nodoEditando) return;

    const id = `nodo_${contadorNodos}`;
    const nuevoNodo = {
      id,
      nombre: id,
      lat: parseFloat(e.latlng.lat.toFixed(8)),
      lng: parseFloat(e.latlng.lng.toFixed(8)),
    };

    setNodos((prev) => [...prev, nuevoNodo]);
    setContadorNodos((c) => c + 1);
    setLog(`✅ Nodo creado: ${id} [${nuevoNodo.lat}, ${nuevoNodo.lng}]`);
  }, [modo, contadorNodos, nodoEditando]);

  // ── Abrir modal de renombrado ──────────────────────────────────────────────
  const abrirRenombrado = useCallback((nodo) => {
    setNodoEditando(nodo);
    setBorrador(nodo.nombre || nodo.id);
    // Enfocar el input en el siguiente tick
    setTimeout(() => inputRenombreRef.current?.focus(), 50);
    setLog(`✏️ Editando: ${nodo.id}`);
  }, []);

  // ── Confirmar renombrado ───────────────────────────────────────────────────
  // Actualiza id + nombre del nodo Y propaga el cambio de id a todas las aristas
  const confirmarRenombre = useCallback(() => {
    if (!nodoEditando) return;

    const nuevoId = borrador.trim();
    if (!nuevoId) {
      setLog('⚠️ El nombre no puede estar vacío.');
      return;
    }
    // Verificar que el nuevo id no colisione con otro nodo existente
    const colision = nodos.some(
      (n) => n.id === nuevoId && n.id !== nodoEditando.id
    );
    if (colision) {
      setLog(`⚠️ Ya existe un nodo con el ID "${nuevoId}". Elige otro nombre.`);
      return;
    }

    const viejoId = nodoEditando.id;

    // Actualizar el nodo
    setNodos((prev) =>
      prev.map((n) =>
        n.id === viejoId
          ? { ...n, id: nuevoId, nombre: nuevoId }
          : n
      )
    );

    // Propagar el cambio de id a todas las aristas que lo referencian
    setAristas((prev) =>
      prev.map((a) => ({
        ...a,
        desde: a.desde === viejoId ? nuevoId : a.desde,
        hasta: a.hasta === viejoId ? nuevoId : a.hasta,
      }))
    );

    // Si el nodo renombrado estaba seleccionado para arista, actualizar
    if (nodoSeleccionado === viejoId) setNodoSeleccionado(nuevoId);

    setLog(`✅ Nodo renombrado: "${viejoId}" → "${nuevoId}"`);
    setNodoEditando(null);
    setBorrador('');
  }, [nodoEditando, borrador, nodos, nodoSeleccionado]);

  // ── Cancelar renombrado ────────────────────────────────────────────────────
  const cancelarRenombre = useCallback(() => {
    setNodoEditando(null);
    setBorrador('');
    setLog('ℹ️ Renombrado cancelado.');
  }, []);

  // ── Clic sobre un nodo existente ───────────────────────────────────────────
  const handleClickNodo = useCallback((nodo) => {
    if (modo !== 'arista') {
      setLog(`ℹ️ Cambia a modo ARISTA para conectar nodos.`);
      return;
    }

    // Primer clic → seleccionar
    if (!nodoSeleccionado) {
      setNodoSeleccionado(nodo.id);
      setLog(`🔵 Primer nodo seleccionado: ${nodo.id}. Ahora haz clic en el segundo nodo.`);
      return;
    }

    // Mismo nodo → deseleccionar
    if (nodoSeleccionado === nodo.id) {
      setNodoSeleccionado(null);
      setLog(`ℹ️ Selección cancelada.`);
      return;
    }

    // Ya existe esa arista?
    const existe = aristas.some(
      (a) =>
        (a.desde === nodoSeleccionado && a.hasta === nodo.id) ||
        (a.desde === nodo.id && a.hasta === nodoSeleccionado)
    );
    if (existe) {
      setLog(`⚠️ Esa arista ya existe. Selección cancelada.`);
      setNodoSeleccionado(null);
      return;
    }

    // Calcular distancia con el método nativo de Leaflet
    const nA = nodos.find((n) => n.id === nodoSeleccionado);
    const nB = nodo;
    let distancia = 0;

    if (mapRef.current && nA && nB) {
      distancia = Math.round(
        mapRef.current.distance([nA.lat, nA.lng], [nB.lat, nB.lng])
      );
    }

    const nuevaArista = {
      _key:      `arista_${contadorAristas}`, // clave interna React, no va al JSON
      desde:     nodoSeleccionado,
      hasta:     nodo.id,
      distancia,
    };

    setAristas((prev) => [...prev, nuevaArista]);
    setContadorAristas((c) => c + 1);
    setNodoSeleccionado(null);
    setLog(`✅ Arista creada: ${nodoSeleccionado} ↔ ${nodo.id} = ${distancia} m`);
  }, [modo, nodoSeleccionado, nodos, aristas, contadorAristas]);

  // ── Deshacer el último elemento agregado ───────────────────────────────────
  const deshacer = () => {
    if (aristas.length > 0) {
      const ultima = aristas[aristas.length - 1];
      setAristas((prev) => prev.slice(0, -1));
      setLog(`↩ Arista eliminada: ${ultima.desde} ↔ ${ultima.hasta}`);
      return;
    }
    if (nodos.length > 0) {
      const ultimo = nodos[nodos.length - 1];
      setNodos((prev) => prev.slice(0, -1));
      setLog(`↩ Nodo eliminado: ${ultimo.id}`);
    }
  };

  // ── Limpiar todo ───────────────────────────────────────────────────────────
  const limpiarTodo = () => {
    if (!window.confirm('¿Seguro que quieres borrar TODOS los nodos y aristas?')) return;
    setNodos([]);
    setAristas([]);
    setNodoSeleccionado(null);
    setContadorNodos(1);
    setContadorAristas(1);
    setLog('🗑️ Mapa limpiado.');
  };

  // ── Exportar JSON a consola (F12) ──────────────────────────────────────────
  const imprimirJSON = () => {
    // Eliminar el campo _key interno antes de exportar
    const exportAristas = aristas.map(({ _key, ...rest }) => rest);

    const grafo = { nodos, aristas: exportAristas };

    console.clear();
    console.log('═══════════════════════════════════════════════');
    console.log('  📋 grafoCampus.json — exportación MapeadorVisual');
    console.log('═══════════════════════════════════════════════');
    console.log(JSON.stringify(grafo, null, 2));
    console.log('═══════════════════════════════════════════════');
    console.info(`ℹ️  ${nodos.length} nodos | ${exportAristas.length} aristas`);

    setLog(`📋 JSON impreso en consola (F12). ${nodos.length} nodos, ${exportAristas.length} aristas.`);
    alert('✅ JSON exportado a la consola del navegador.\nAbre DevTools (F12) → pestaña "Console" para copiarlo.');
  };

  // ── Cambiar modo ───────────────────────────────────────────────────────────
  const cambiarModo = (nuevoModo) => {
    setModo(nuevoModo);
    setNodoSeleccionado(null);
    setLog(
      nuevoModo === 'nodo'
        ? '🟡 Modo NODO: haz clic en el mapa para agregar un nodo.'
        : '🟢 Modo ARISTA: haz clic en dos nodos para conectarlos.'
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.wrapper}>

      {/* ── Barra de herramientas superior ─────────────────────────────── */}
      <div style={styles.toolbar}>
        <span style={styles.toolbarTitle}>🗺️ Mapeador Visual — Campus UTalca Curicó</span>

        <div style={styles.toolbarGroup}>
          <span style={styles.label}>Modo:</span>
          <button
            style={{ ...styles.btn, ...(modo === 'nodo' ? styles.btnActive : {}) }}
            onClick={() => cambiarModo('nodo')}
          >
            📍 Nodo
          </button>
          <button
            style={{ ...styles.btn, ...(modo === 'arista' ? styles.btnActiveGreen : {}) }}
            onClick={() => cambiarModo('arista')}
          >
            🔗 Arista
          </button>
        </div>

        <div style={styles.toolbarGroup}>
          <span style={styles.stat}>Nodos: <strong>{nodos.length}</strong></span>
          <span style={styles.stat}>Aristas: <strong>{aristas.length}</strong></span>
        </div>

        <div style={styles.toolbarGroup}>
          <button style={{ ...styles.btn, ...styles.btnUndo }} onClick={deshacer}>
            ↩ Deshacer
          </button>
          <button style={{ ...styles.btn, ...styles.btnDanger }} onClick={limpiarTodo}>
            🗑️ Limpiar
          </button>
          <button style={{ ...styles.btn, ...styles.btnExport }} onClick={imprimirJSON}>
            📋 Exportar JSON
          </button>
        </div>
      </div>

      {/* ── Log de estado ──────────────────────────────────────────────── */}
      <div style={styles.logBar}>{log}</div>

      {/* ── Mapa ───────────────────────────────────────────────────────── */}
      <div style={styles.mapWrapper}>
        <MapContainer
          center={CAMPUS_CENTER}
          zoom={CAMPUS_ZOOM}
          minZoom={16}
          maxZoom={22}
          style={{ height: '100%', width: '100%' }}
          // Cursor tipo crosshair en modo nodo
          className={modo === 'nodo' ? 'cursor-crosshair' : ''}
        >
          {/* Captura referencia nativa del mapa para calcular distancias */}
          <MapRefCaptura mapRef={mapRef} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={22}
            maxNativeZoom={19}
          />

          <EditorLayer
            nodos={nodos}
            aristas={aristas}
            modo={modo}
            nodoSeleccionado={nodoSeleccionado}
            onClickMapa={handleClickMapa}
            onClickNodo={handleClickNodo}
            onHoverNodo={setNodoHoverId}
            nodoHoverId={nodoHoverId}
            onRenombrarNodo={abrirRenombrado}
          />
        </MapContainer>
      </div>

      {/* ── Panel lateral: lista de nodos ──────────────────────────────── */}
      <div style={styles.panel}>
        <div style={styles.panelSection}>
          <p style={styles.panelTitle}>📍 Nodos ({nodos.length})</p>
          <div style={styles.scrollList}>
            {nodos.length === 0 && (
              <p style={styles.emptyMsg}>Sin nodos aún.</p>
            )}
            {nodos.map((n) => (
              <div key={n.id} style={styles.listItem}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.listId}>{n.nombre || n.id}</div>
                  {n.nombre !== n.id && (
                    <div style={{ ...styles.listCoord, color: '#475569', fontSize: 9 }}>
                      id: {n.id}
                    </div>
                  )}
                  <div style={styles.listCoord}>
                    {n.lat.toFixed(6)}, {n.lng.toFixed(6)}
                  </div>
                </div>
                <button
                  title="Renombrar nodo"
                  style={styles.btnEdit}
                  onClick={() => abrirRenombrado(n)}
                >
                  ✏️
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.panelSection}>
          <p style={styles.panelTitle}>🔗 Aristas ({aristas.length})</p>
          <div style={styles.scrollList}>
            {aristas.length === 0 && (
              <p style={styles.emptyMsg}>Sin aristas aún.</p>
            )}
            {aristas.map((a) => (
              <div key={a._key} style={styles.listItem}>
                <span style={styles.listId}>{a.desde} ↔ {a.hasta}</span>
                <span style={styles.listDist}>{a.distancia} m</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leyenda */}
        <div style={styles.leyenda}>
          <p style={styles.panelTitle}>Leyenda</p>
          <div style={styles.leyendaItem}><span style={{...styles.dot, background: COLOR.nodo}} /> Nodo</div>
          <div style={styles.leyendaItem}><span style={{...styles.dot, background: COLOR.nodoSeleccionado}} /> Nodo seleccionado</div>
          <div style={styles.leyendaItem}><span style={{...styles.dot, background: COLOR.arista}} /> Arista</div>
        </div>
      </div>

      {/* ─── Modal de renombrado ──────────────────────────────────────────── */}
      {nodoEditando && (
        <div style={styles.modalOverlay} onClick={cancelarRenombre}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p style={styles.modalTitle}>✏️ Renombrar nodo</p>
            <p style={styles.modalSubtitle}>
              ID actual: <code style={{ color: '#93c5fd' }}>{nodoEditando.id}</code>
            </p>
            <input
              ref={inputRenombreRef}
              style={styles.modalInput}
              value={borrador}
              onChange={(e) => setBorrador(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter')  confirmarRenombre();
                if (e.key === 'Escape') cancelarRenombre();
              }}
              placeholder="Nuevo nombre / ID..."
            />
            <p style={styles.modalHint}>
              Tip: usa nombres sin espacios, p.ej. <code>entrada_principal</code>
            </p>
            <div style={styles.modalBtns}>
              <button style={{ ...styles.btn, ...styles.btnExport }} onClick={confirmarRenombre}>
                ✅ Confirmar
              </button>
              <button style={{ ...styles.btn, ...styles.btnUndo }} onClick={cancelarRenombre}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilo global para cursor crosshair dentro del mapa */}
      <style>{`
        .cursor-crosshair { cursor: crosshair !important; }
        .cursor-crosshair .leaflet-interactive { cursor: pointer !important; }
      `}</style>
    </div>
  );
};

// ─── Estilos inline (sin dependencia de CSS externo) ─────────────────────────
const styles = {
  wrapper: {
    display: 'grid',
    gridTemplateRows:    'auto auto 1fr',
    gridTemplateColumns: '1fr 280px',
    gridTemplateAreas:   `"toolbar toolbar" "log log" "map panel"`,
    height: '100dvh',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    background: '#0f172a',
    color: '#f1f5f9',
  },
  toolbar: {
    gridArea: 'toolbar',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 16px',
    background: '#1e293b',
    borderBottom: '1px solid #334155',
    flexWrap: 'wrap',
  },
  toolbarTitle: {
    fontWeight: 700,
    fontSize: 15,
    color: '#e2e8f0',
    marginRight: 'auto',
  },
  toolbarGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  label: { fontSize: 13, color: '#94a3b8' },
  stat:  { fontSize: 13, color: '#94a3b8' },
  btn: {
    padding: '6px 14px',
    borderRadius: 8,
    border: '1px solid #334155',
    background: '#1e293b',
    color: '#cbd5e1',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all .15s',
  },
  btnActive: {
    background: '#ef4444',
    borderColor: '#ef4444',
    color: '#fff',
    fontWeight: 600,
  },
  btnActiveGreen: {
    background: '#22c55e',
    borderColor: '#22c55e',
    color: '#fff',
    fontWeight: 600,
  },
  btnUndo: {
    background: '#334155',
    borderColor: '#475569',
  },
  btnDanger: {
    background: '#7f1d1d',
    borderColor: '#991b1b',
    color: '#fca5a5',
  },
  btnExport: {
    background: '#1d4ed8',
    borderColor: '#2563eb',
    color: '#fff',
    fontWeight: 700,
  },
  logBar: {
    gridArea: 'log',
    padding: '6px 16px',
    background: '#0f172a',
    borderBottom: '1px solid #1e293b',
    fontSize: 13,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  mapWrapper: {
    gridArea: 'map',
    overflow: 'hidden',
  },
  panel: {
    gridArea: 'panel',
    background: '#1e293b',
    borderLeft: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  panelSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    borderBottom: '1px solid #334155',
    overflow: 'hidden',
    minHeight: 0,
  },
  panelTitle: {
    margin: 0,
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#64748b',
    borderBottom: '1px solid #334155',
  },
  scrollList: {
    overflowY: 'auto',
    flex: 1,
    padding: '4px 0',
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 12px',
    fontSize: 11,
    borderBottom: '1px solid #0f172a',
    gap: 8,
  },
  listId: {
    color: '#93c5fd',
    fontFamily: 'monospace',
    wordBreak: 'break-all',
  },
  listCoord: {
    color: '#64748b',
    fontSize: 10,
    whiteSpace: 'nowrap',
  },
  listDist: {
    color: '#4ade80',
    fontFamily: 'monospace',
    whiteSpace: 'nowrap',
    fontSize: 11,
  },
  emptyMsg: {
    color: '#475569',
    fontSize: 12,
    padding: '8px 12px',
    margin: 0,
  },
  btnEdit: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    padding: '2px 4px',
    borderRadius: 4,
    flexShrink: 0,
    lineHeight: 1,
    opacity: 0.7,
    transition: 'opacity .15s',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modal: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 12,
    padding: '24px 28px',
    minWidth: 340,
    maxWidth: 420,
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  modalTitle: {
    margin: '0 0 4px',
    fontSize: 16,
    fontWeight: 700,
    color: '#f1f5f9',
  },
  modalSubtitle: {
    margin: '0 0 14px',
    fontSize: 12,
    color: '#64748b',
  },
  modalInput: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #475569',
    background: '#0f172a',
    color: '#f1f5f9',
    fontSize: 14,
    fontFamily: 'monospace',
    outline: 'none',
    boxSizing: 'border-box',
  },
  modalHint: {
    margin: '8px 0 16px',
    fontSize: 11,
    color: '#64748b',
  },
  modalBtns: {
    display: 'flex',
    gap: 10,
    justifyContent: 'flex-end',
  },
  leyenda: {
    padding: '8px 12px 12px',
    borderTop: '1px solid #334155',
  },
  leyendaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  dot: {
    display: 'inline-block',
    width: 12,
    height: 12,
    borderRadius: '50%',
    border: '1.5px solid #fff',
    flexShrink: 0,
  },
};

export default MapeadorVisual;
