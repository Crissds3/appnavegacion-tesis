/**
 * calculadorRutas.js
 * Motor de enrutamiento peatonal offline basado en el algoritmo A*.
 * No depende de ninguna API externa ni de leaflet-routing-machine.
 */

const VELOCIDAD_PEATONAL_MS = 1.3;
const RADIO_TIERRA_M        = 6_371_000; 

// ---------------------------------------------------------------------------
// Utilidades geométricas
// ---------------------------------------------------------------------------

function haversine(lat1, lng1, lat2, lng2) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  return RADIO_TIERRA_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Construcción del grafo en memoria
// ---------------------------------------------------------------------------

/**
 * Transforma el JSON del grafo en un mapa de adyacencia (Map<id, vecinos[]>)
 * para que la búsqueda A* sea O(1) en acceso a vecinos.
 *
 * @param {Object} grafoJSON - Contenido de grafoCampus.json
 * @returns {{ nodosMap: Map, adyacencia: Map }}
 */
function construirGrafo(grafoJSON) {
  // Índice de nodos por id para acceso O(1)
  const nodosMap = new Map();
  for (const nodo of grafoJSON.nodos) {
    nodosMap.set(nodo.id, nodo);
  }

  // Lista de adyacencia bidireccional
  const adyacencia = new Map();
  for (const nodo of grafoJSON.nodos) {
    adyacencia.set(nodo.id, []);
  }

  for (const arista of grafoJSON.aristas) {
    const { desde, hasta, distancia } = arista;

    // Validar que ambos nodos existen
    if (!nodosMap.has(desde) || !nodosMap.has(hasta)) {
      console.warn(
        `[calculadorRutas] Arista ignorada: nodo "${desde}" o "${hasta}" no existe en el grafo.`
      );
      continue;
    }

    // Bidireccional: A→B y B→A
    adyacencia.get(desde).push({ vecino: hasta, coste: distancia });
    adyacencia.get(hasta).push({ vecino: desde, coste: distancia });
  }

  return { nodosMap, adyacencia };
}

// ---------------------------------------------------------------------------
// Algoritmo A*
// ---------------------------------------------------------------------------

/**
 * Cola de prioridad mínima simple (min-heap binario).
 * Evita la dependencia de librerías externas.
 */
class ColaPrioridad {
  constructor() { this._heap = []; }

  encolar(item, prioridad) {
    this._heap.push({ item, prioridad });
    this._subir(this._heap.length - 1);
  }

  desencolar() {
    if (this._heap.length === 0) return null;
    this._intercambiar(0, this._heap.length - 1);
    const min = this._heap.pop();
    this._bajar(0);
    return min.item;
  }

  estaVacia() { return this._heap.length === 0; }

  _subir(i) {
    while (i > 0) {
      const padre = Math.floor((i - 1) / 2);
      if (this._heap[padre].prioridad <= this._heap[i].prioridad) break;
      this._intercambiar(i, padre);
      i = padre;
    }
  }

  _bajar(i) {
    const n = this._heap.length;
    while (true) {
      let menor = i;
      const iz = 2 * i + 1, der = 2 * i + 2;
      if (iz < n && this._heap[iz].prioridad < this._heap[menor].prioridad) menor = iz;
      if (der < n && this._heap[der].prioridad < this._heap[menor].prioridad) menor = der;
      if (menor === i) break;
      this._intercambiar(i, menor);
      i = menor;
    }
  }

  _intercambiar(a, b) {
    [this._heap[a], this._heap[b]] = [this._heap[b], this._heap[a]];
  }
}

/**
 * Ejecuta A* entre dos nodos del grafo.
 *
 * @param {string}  inicioId   - ID del nodo de inicio
 * @param {string}  finId      - ID del nodo de destino
 * @param {Map}     nodosMap   - Mapa id → nodo
 * @param {Map}     adyacencia - Mapa id → [{vecino, coste}]
 * @returns {string[] | null}  - Array de IDs de nodos en orden, o null si no hay ruta
 */
function aStar(inicioId, finId, nodosMap, adyacencia) {
  const nodoFin = nodosMap.get(finId);

  // g(n): coste real acumulado desde el inicio
  const gCost = new Map();
  gCost.set(inicioId, 0);

  // Mapa de predecesores para reconstruir el camino
  const proveedor = new Map();

  const abiertos = new ColaPrioridad();
  abiertos.encolar(inicioId, 0);

  const cerrados = new Set();

  while (!abiertos.estaVacia()) {
    const actual = abiertos.desencolar();

    if (actual === finId) {
      // Reconstruir camino
      const camino = [];
      let cursor = finId;
      while (cursor !== undefined) {
        camino.unshift(cursor);
        cursor = proveedor.get(cursor);
      }
      return camino;
    }

    if (cerrados.has(actual)) continue;
    cerrados.add(actual);

    const vecinos = adyacencia.get(actual) || [];
    for (const { vecino, coste } of vecinos) {
      if (cerrados.has(vecino)) continue;

      const gTentativo = (gCost.get(actual) ?? Infinity) + coste;

      if (gTentativo < (gCost.get(vecino) ?? Infinity)) {
        gCost.set(vecino, gTentativo);
        proveedor.set(vecino, actual);

        // h(n): heurística admisible — distancia euclidiana hasta el destino
        const nodoVecino = nodosMap.get(vecino);
        const h = haversine(nodoVecino.lat, nodoVecino.lng, nodoFin.lat, nodoFin.lng);
        abiertos.encolar(vecino, gTentativo + h);
      }
    }
  }

  return null; // Sin ruta
}

// ---------------------------------------------------------------------------
// Función de snapping: punto más cercano al grafo
// ---------------------------------------------------------------------------

/**
 * Dado un par de coordenadas (lat, lng) libre, devuelve el ID del nodo
 * más cercano dentro del grafo. Se usa para "anclar" al grafo los puntos
 * de origen/destino que vienen de los marcadores del mapa.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {Map}    nodosMap
 * @returns {string} id del nodo más cercano
 */
function nodoMasCercano(lat, lng, nodosMap) {
  let mejorId   = null;
  let mejorDist = Infinity;

  for (const [id, nodo] of nodosMap) {
    const d = haversine(lat, lng, nodo.lat, nodo.lng);
    if (d < mejorDist) {
      mejorDist = d;
      mejorId   = id;
    }
  }

  return mejorId;
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Calcula la ruta peatonal óptima entre dos puntos del campus.
 *
 * @param {number} origenLat
 * @param {number} origenLng
 * @param {number} destinoLat
 * @param {number} destinoLng
 * @param {Object} grafoJSON  - Contenido de grafoCampus.json
 *
 * @returns {{
 *   coordenadas: [number, number][],
 *   summary: { totalDistance: number, totalTime: number }
 * } | null}
 *
 * Retorna null si no existe ninguna ruta posible entre los nodos.
 */
export function calcularRuta(origenLat, origenLng, destinoLat, destinoLng, grafoJSON) {
  // 1. Construir grafo en memoria
  const { nodosMap, adyacencia } = construirGrafo(grafoJSON);

  // 2. Encontrar nodos del grafo más cercanos al origen y destino reales
  const idInicio = nodoMasCercano(origenLat, origenLng, nodosMap);
  const idFin    = nodoMasCercano(destinoLat, destinoLng, nodosMap);

  console.log(
    `[calcularRuta] Snap origen → "${idInicio}" | Snap destino → "${idFin}"`
  );

  // Caso degenerado: mismo nodo
  if (idInicio === idFin) {
    const distDirecta = haversine(origenLat, origenLng, destinoLat, destinoLng);
    return {
      coordenadas: [[origenLat, origenLng], [destinoLat, destinoLng]],
      summary: {
        totalDistance: distDirecta,
        totalTime: distDirecta / VELOCIDAD_PEATONAL_MS,
      },
    };
  }

  // 3. Ejecutar A*
  const caminoIds = aStar(idInicio, idFin, nodosMap, adyacencia);

  if (!caminoIds) {
    console.warn('[calcularRuta] No se encontró ruta entre los nodos seleccionados.');
    return null;
  }

  // 4. Convertir IDs a coordenadas [lat, lng]
  //    Incluimos el punto real de origen y destino (sin snapping visual)
  const coordenadas = [
    [origenLat, origenLng],                         // Punto real de inicio
    ...caminoIds.map(id => {
      const n = nodosMap.get(id);
      return [n.lat, n.lng];
    }),
    [destinoLat, destinoLng],                        // Punto real de destino
  ];

  // 5. Calcular distancia total del camino por el grafo
  let totalDistance = 0;

  // Segmento origen → primer nodo del grafo
  totalDistance += haversine(origenLat, origenLng, coordenadas[1][0], coordenadas[1][1]);

  // Segmentos internos del grafo
  for (let i = 1; i < coordenadas.length - 2; i++) {
    const [la, lo]  = coordenadas[i];
    const [lb, lob] = coordenadas[i + 1];
    totalDistance += haversine(la, lo, lb, lob);
  }

  // Segmento último nodo → destino real
  const last = coordenadas[coordenadas.length - 2];
  totalDistance += haversine(last[0], last[1], destinoLat, destinoLng);

  const totalTime = totalDistance / VELOCIDAD_PEATONAL_MS;

  console.log(
    `[calcularRuta] ✅ ${caminoIds.length} nodos | ${totalDistance.toFixed(0)}m | ${(totalTime / 60).toFixed(1)} min`
  );

  return {
    coordenadas,
    summary: { totalDistance, totalTime },
  };
}
