# Frontend - Portal de Navegación

Aplicación web construida con React y Vite. Es el cliente de la plataforma de navegación, portal de noticias, minitour virtual y realidad aumentada del Campus Curicó de la Universidad de Talca.

## Requisitos

- Node.js 18 o superior
- El backend del proyecto corriendo localmente o desplegado (ver `backend/README.md`)

## Instalación

```bash
npm install
```

Copia el archivo de variables de entorno:

```bash
cp .env.example .env.local
```

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base de la API del backend (ej. `http://localhost:5000/api` en desarrollo). |

## Ejecución

```bash
npm run dev       # servidor de desarrollo con recarga en caliente
npm run build     # build de producción en dist/
npm run preview   # sirve el build de producción localmente
npm run lint      # revisa el código con ESLint
```

## Pruebas

```bash
npm test
```

Las pruebas cubren utilidades puras en JavaScript plano (por ejemplo `src/utils/calculadorRutas.js`). No se prueban componentes `.jsx` directamente, ya que el proyecto no tiene configurado un transform de JSX para Jest.

## Funcionalidades principales

- **Portal de noticias:** noticias propias del sistema y noticias oficiales de la Universidad de Talca obtenidas desde su feed RSS.
- **Mapa interactivo y wayfinding:** mapa 2D del campus (Leaflet) con cálculo de rutas peatonales entre ubicaciones.
- **Minitour virtual:** catálogo de modelos 3D (.glb) de edificios del campus, visualizados con `<model-viewer>`.
- **Realidad aumentada:** superposición de información de puntos de interés sobre la cámara del dispositivo, usando geolocalización y orientación nativas del navegador.
- **Panel de administración:** gestión de noticias, ubicaciones, modelos 3D, puntos de interés AR, información institucional, carreras y cuentas de administrador.

## Estructura del proyecto

```
src/
├── vistas/        # páginas (públicas, estudiante, admin, auth)
├── componentes/   # componentes reutilizables, organizados por área
├── contexto/      # contexto de autenticación
├── servicios/     # cliente HTTP (axios) hacia la API
├── hooks/         # hooks personalizados
├── utils/         # funciones puras (ej. cálculo de rutas)
└── data/          # datos estáticos del cliente
```

## Despliegue

El proyecto está pensado para desplegarse en Vercel (ver `vercel.json`, que redirige todas las rutas a `index.html` para que funcione el ruteo del lado del cliente).
