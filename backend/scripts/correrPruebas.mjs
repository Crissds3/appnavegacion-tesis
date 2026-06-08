// Script temporal de ejecución de pruebas funcionales contra la API local.
const BASE = 'http://localhost:5000/api';
const resultados = [];

async function probar(id, hu, modulo, descripcion, fn) {
  try {
    const { entradas, esperado, obtenido, exito } = await fn();
    resultados.push({ id, hu, modulo, descripcion, entradas, esperado, obtenido, estado: exito ? 'Éxito' : 'Falló' });
  } catch (err) {
    resultados.push({ id, hu, modulo, descripcion, entradas: '-', esperado: '-', obtenido: `Error: ${err.message}`, estado: 'Falló' });
  }
}

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  let body;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, body };
}

await probar(1, 'HU013', 'Autenticación', 'Login con credenciales incorrectas', async () => {
  const r = await req('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'noexiste@utalca.cl', password: 'claveIncorrecta123' }) });
  return {
    entradas: 'email: noexiste@utalca.cl / password: claveIncorrecta123',
    esperado: 'HTTP 401 o 400, sin token',
    obtenido: `HTTP ${r.status} — ${r.body?.message ?? JSON.stringify(r.body)}`,
    exito: (r.status === 401 || r.status === 400) && !r.body?.token,
  };
});

await probar(2, 'HU013', 'Autenticación', 'Acceso a perfil sin token', async () => {
  const r = await req('/auth/me');
  return {
    entradas: 'GET /api/auth/me sin header Authorization',
    esperado: 'HTTP 401 - No autorizado',
    obtenido: `HTTP ${r.status} — ${r.body?.message ?? JSON.stringify(r.body)}`,
    exito: r.status === 401,
  };
});

await probar(3, 'HU013', 'Autenticación', 'Acceso a perfil con token inválido', async () => {
  const r = await req('/auth/me', { headers: { Authorization: 'Bearer token.falso.invalido' } });
  return {
    entradas: 'GET /api/auth/me con Authorization: Bearer token.falso.invalido',
    esperado: 'HTTP 401 - Token inválido',
    obtenido: `HTTP ${r.status} — ${r.body?.message ?? JSON.stringify(r.body)}`,
    exito: r.status === 401,
  };
});

await probar(4, 'HU016', 'Gestión de usuarios', 'Crear administrador sin sesión', async () => {
  const r = await req('/auth/crear-admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: 'Prueba', email: 'prueba@utalca.cl' }) });
  return {
    entradas: 'POST /api/auth/crear-admin sin token, body con nombre y correo',
    esperado: 'HTTP 401 - acceso denegado antes de llegar al controlador',
    obtenido: `HTTP ${r.status} — ${r.body?.message ?? JSON.stringify(r.body)}`,
    exito: r.status === 401,
  };
});

await probar(5, 'HU017', 'Gestión de contenidos', 'Listar noticias públicas activas', async () => {
  const r = await req('/noticias/publicas');
  const arr = Array.isArray(r.body?.data) ? r.body.data : [];
  const todasActivas = arr.every(n => n.activo !== false);
  return {
    entradas: 'GET /api/noticias/publicas',
    esperado: 'HTTP 200, listado de noticias con activo=true únicamente',
    obtenido: `HTTP ${r.status} — ${arr.length} noticia(s) recibidas, todas activas: ${todasActivas}`,
    exito: r.status === 200 && todasActivas,
  };
});

await probar(6, 'HU017', 'Gestión de contenidos', 'Listar noticias completas sin sesión', async () => {
  const r = await req('/noticias');
  return {
    entradas: 'GET /api/noticias sin token (ruta de administración)',
    esperado: 'HTTP 401 - requiere autenticación',
    obtenido: `HTTP ${r.status} — ${r.body?.message ?? JSON.stringify(r.body)}`,
    exito: r.status === 401,
  };
});

await probar(7, 'HU019', 'Información institucional', 'Consultar información pública de la universidad', async () => {
  const r = await req('/info/publica');
  const arr = Array.isArray(r.body?.data) ? r.body.data : [];
  return {
    entradas: 'GET /api/info/publica',
    esperado: 'HTTP 200, listado de secciones activas',
    obtenido: `HTTP ${r.status} — ${arr.length} sección(es) recibidas`,
    exito: r.status === 200,
  };
});

await probar(8, 'HU020', 'Wayfinding / Ubicaciones', 'Listar ubicaciones públicas', async () => {
  const r = await req('/ubicaciones/publicas');
  const arr = Array.isArray(r.body?.data) ? r.body.data : [];
  return {
    entradas: 'GET /api/ubicaciones/publicas',
    esperado: 'HTTP 200, listado de nodos del campus',
    obtenido: `HTTP ${r.status} — ${arr.length} ubicación(es) recibidas`,
    exito: r.status === 200,
  };
});

await probar(9, 'HU020', 'Wayfinding / Ubicaciones', 'Búsqueda de ubicaciones cercanas con coordenadas', async () => {
  const r = await req('/ubicaciones/cercanas?latitud=-34.9847&longitud=-71.2356&distanciaMaxima=500');
  const arr = Array.isArray(r.body?.data) ? r.body.data : [];
  return {
    entradas: 'GET /api/ubicaciones/cercanas?latitud=-34.9847&longitud=-71.2356&distanciaMaxima=500',
    esperado: 'HTTP 200, listado de nodos dentro del radio especificado',
    obtenido: `HTTP ${r.status} — ${arr.length} ubicación(es) dentro del radio`,
    exito: r.status === 200,
  };
});

await probar(10, 'HU020', 'Wayfinding / Ubicaciones', 'Crear ubicación con coordenadas inválidas', async () => {
  const r = await req('/ubicaciones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: 'Nodo prueba', tipo: 'sala', latitud: 200, longitud: -71 }) });
  return {
    entradas: 'POST /api/ubicaciones (sin token) con latitud=200 (fuera de rango)',
    esperado: 'HTTP 401 por falta de token, antes de validar coordenadas',
    obtenido: `HTTP ${r.status} — ${r.body?.message ?? JSON.stringify(r.body)}`,
    exito: r.status === 401,
  };
});

await probar(11, '-', 'Seguridad transversal', 'Inyección NoSQL en filtro de login (operador $gt)', async () => {
  const r = await req('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: { '$gt': '' }, password: { '$gt': '' } }) });
  return {
    entradas: 'POST /api/auth/login con email: { "$gt": "" }, password: { "$gt": "" }',
    esperado: 'HTTP 400/401 — express-mongo-sanitize neutraliza el operador antes de la consulta',
    obtenido: `HTTP ${r.status} — ${r.body?.message ?? JSON.stringify(r.body)}`,
    exito: r.status === 400 || r.status === 401,
  };
});

await probar(12, '-', 'Seguridad transversal', 'Solicitud con origen no permitido por CORS', async () => {
  const r = await req('/info/publica', { headers: { Origin: 'https://sitio-no-permitido.com' } });
  return {
    entradas: 'GET /api/info/publica con header Origin: https://sitio-no-permitido.com',
    esperado: 'HTTP 403 — origen rechazado de forma explícita por el servidor',
    obtenido: `HTTP ${r.status} — ${r.body?.message ?? JSON.stringify(r.body)}`,
    exito: r.status === 403,
  };
});

await probar(13, 'HU013', 'Seguridad transversal', 'Límite de intentos de login (rate limiting)', async () => {
  let ultimo;
  for (let i = 0; i < 11; i++) {
    ultimo = await req('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'rl-test@utalca.cl', password: `intento${i}` }) });
  }
  return {
    entradas: '11 solicitudes consecutivas a POST /api/auth/login en menos de 15 minutos',
    esperado: 'A partir del intento 11, HTTP 429 con mensaje de bloqueo temporal',
    obtenido: `Última respuesta: HTTP ${ultimo.status} — ${ultimo.body?.message ?? JSON.stringify(ultimo.body)}`,
    exito: ultimo.status === 429,
  };
});

// ── Salida ──────────────────────────────────────────
console.log('\n========================= RESULTADOS =========================\n');
for (const r of resultados) {
  console.log(`#${r.id} [${r.estado}] (${r.hu}) ${r.modulo} — ${r.descripcion}`);
  console.log(`   Entradas : ${r.entradas}`);
  console.log(`   Esperado : ${r.esperado}`);
  console.log(`   Obtenido : ${r.obtenido}\n`);
}
const exitos = resultados.filter(r => r.estado === 'Éxito').length;
console.log(`TOTAL: ${exitos}/${resultados.length} pruebas con resultado Éxito`);

console.log('\n--- JSON ---');
console.log(JSON.stringify(resultados, null, 2));
