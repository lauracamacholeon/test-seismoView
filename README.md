# SeismoView 🌍

Visor de sismos en tiempo (casi) real construido con **Angular** y **MapLibre GL**. Consume el feed público de la **USGS** (United States Geological Survey) y muestra en un mapa interactivo todos los sismos de magnitud 4.5+ ocurridos en los últimos 30 días, con una lista sincronizada y filtros por magnitud y rango de fechas.

## Índice

- [¿Qué hace la app?](#qué-hace-la-app)
- [Tecnologías](#tecnologías)
- [Arquitectura y estructura de carpetas](#arquitectura-y-estructura-de-carpetas)
- [Cómo funciona (flujo de datos)](#cómo-funciona-flujo-de-datos)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Scripts disponibles](#scripts-disponibles)
- [Configuración](#configuración)
- [Testing](#testing)
- [Calidad de código y convenciones de commits](#calidad-de-código-y-convenciones-de-commits)

## ¿Qué hace la app?

Al abrir la aplicación:

1. Se dispara automáticamente la carga de sismos desde el feed GeoJSON público de la USGS.
2. Los sismos se pintan como puntos sobre un mapa mundial (MapLibre GL), y a la vez se listan en una barra lateral en forma de tarjetas.
3. El usuario puede filtrar por **magnitud mínima/máxima** y por **rango de fechas**.
4. Al pasar el mouse (hover) o hacer click sobre un punto en el mapa o sobre una tarjeta en la lista, ambos se resaltan entre sí (el estado de selección/hover vive en un único store central, así que da igual desde dónde se dispare la interacción).
5. Al seleccionar un sismo desde la lista, el mapa hace `flyTo` centrándose y haciendo zoom sobre ese punto. Si la selección viene de un click en el mapa, no se mueve la cámara (ya está centrado).
6. Si la petición al feed falla, se muestra un mensaje de error entendible para el usuario (sin exponer detalles técnicos) con opción de reintentar.

## Tecnologías

| Categoría        | Tecnología                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Framework        | [Angular 22](https://angular.dev) (standalone components, signals, `inject()`)                                           |
| Manejo de estado | [NgRx](https://ngrx.io) (`@ngrx/store`, `@ngrx/effects`, `@ngrx/entity`, `@ngrx/store-devtools`)                         |
| Mapa             | [MapLibre GL JS v6](https://maplibre.org/maplibre-gl-js/docs/) (fork open source de Mapbox GL, sin necesidad de API key) |
| UI Kit           | [Angular Material](https://material.angular.dev) (`@angular/cdk`, `@angular/material`)                                   |
| Estilos          | SCSS                                                                                                                     |
| HTTP             | `HttpClient` con interceptores funcionales                                                                               |
| Reactividad      | RxJS                                                                                                                     |
| Testing          | [Vitest](https://vitest.dev) + `@vitest/coverage-v8`                                                                     |
| Linting          | ESLint (`angular-eslint`, `typescript-eslint`)                                                                           |
| Formateo         | Prettier                                                                                                                 |
| Git hooks        | Husky + lint-staged + Commitlint (Conventional Commits)                                                                  |
| Build/CLI        | Angular CLI (`@angular/build`, basado en esbuild/Vite)                                                                   |
| Lenguaje         | TypeScript ~6.0 (modo estricto)                                                                                          |
| Fuente de datos  | Feed GeoJSON público de [USGS Earthquake Hazards Program](https://earthquake.usgs.gov/earthquakes/feed/)                 |

## Arquitectura y estructura de carpetas

El proyecto sigue una arquitectura **feature-based** (por dominio/funcionalidad) inspirada en los principios de Nx/DDD ligero, separando siempre `data-access` (estado y acceso a datos), `ui` (componentes presentacionales puros) y `containers` (componentes conectados al store):

```
src/app/
├── core/                        # Infraestructura transversal de la app
│   ├── config/                  # Token de configuración (APP_CONFIG)
│   ├── errors/                  # Modelo de error de API + normalización
│   ├── interceptors/            # Interceptor HTTP que traduce errores
│   └── layout/shell/            # Shell visual (toolbar + router-outlet)
│
├── shared/
│   └── utils/                   # Utilidades puras reutilizables
│       ├── escape-html.ts       # Sanitiza HTML antes de inyectarlo en el popup del mapa
│       └── format-relative-time.ts
│
└── features/earthquakes/        # Feature principal: todo lo de sismos
    ├── data-access/
    │   ├── api/                 # EarthquakesApi: llamada HTTP al feed USGS
    │   ├── mappers/              # Traduce el GeoJSON crudo de USGS a modelo interno
    │   ├── models/                # Earthquake, EarthquakeFilters
    │   ├── state/                # NgRx: actions, reducer, effects, selectors
    │   ├── testing/               # Factories para generar sismos de prueba
    │   └── utils/                 # Filtrado por magnitud/fecha, límites de día local
    │
    ├── map/                      # Todo lo relacionado a MapLibre
    │   ├── earthquake-map/       # Componente Angular que renderiza el mapa
    │   ├── earthquakes-geojson.ts    # Convierte Earthquake[] -> FeatureCollection
    │   ├── earthquakes-layers.ts     # Definición de la capa de círculos (estilos)
    │   ├── map-adapter.token.ts      # Tokens de inyección para mockear el mapa en tests
    │   ├── map-factory.provider.ts   # Provee la factory real de MapLibre (Map/Popup)
    │   └── map-handle.ts             # Interfaz reducida de la API de MapLibre que usa la app
    │
    ├── ui/                        # Componentes presentacionales (sin store)
    │   ├── earthquake-card/        # Tarjeta individual de un sismo
    │   ├── earthquake-filters/     # Formulario de filtros (magnitud + fechas)
    │   └── earthquake-list/        # Lista de tarjetas
    │
    ├── containers/earthquake-viewer/   # Página que compone mapa + lista + filtros
    └── earthquakes.routes.ts           # Rutas del feature (lazy-loaded) + providers de NgRx
```

Alias de importación configurados en `tsconfig.json` (evitan rutas relativas largas):

- `@core/*` → `src/app/core/*`
- `@shared/*` → `src/app/shared/*`
- `@features/*` → `src/app/features/*`

### ¿Por qué esta separación?

- **`ui/`** nunca inyecta el `Store`: reciben datos por `input()` y emiten por `output()`, lo que los hace fáciles de testear de forma aislada y reutilizables.
- **`containers/`** conectan la UI al estado global.
- **`map/`** aísla toda la dependencia con MapLibre detrás de `MapHandle`/`PopupHandle` y tokens de inyección (`MAP_FACTORY`, `POPUP_FACTORY`), de modo que el componente del mapa se puede testear con un mock, sin montar un mapa real en el DOM.

## Cómo funciona (flujo de datos)

```
EarthquakeViewer (se monta)
        │  dispatch(EarthquakesPageActions.opened())
        ▼
   NgRx Effect ── EarthquakesApi.getEarthquakes() ──► GET feed GeoJSON de USGS
        │                                                   │
        │                                     usgs-feed.mapper.ts (parsea/normaliza)
        │                                                   │
        ▼                                                   ▼
  EarthquakesApiActions.loadSucceeded({ earthquakes })  o  loadFailed({ message })
        │
        ▼
   earthquakes.reducer.ts (guarda entidades vía @ngrx/entity, status, error, filtros, selección, hover)
        │
        ▼
   Selectors (selectFilteredEarthquakes, selectSelection, selectHoveredId, selectMagnitudeBounds, ...)
        │
        ├──► EarthquakeList (tarjetas)         ──dispatch──►  earthquakeSelected / earthquakeHovered
        ├──► EarthquakeFilters (magnitud/fecha) ──dispatch──►  filtersChanged / filtersReset
        └──► EarthquakeMap (puntos en el mapa)  ──dispatch──►  earthquakeSelected / earthquakeHovered
```

Puntos clave del diseño:

- **Estado único de selección/hover**: tanto el click en el mapa como el click en una tarjeta disparan la misma acción (`earthquakeSelected`, con un campo `source: 'map' | 'list'`). Un único `effect()` en `EarthquakeMap` refleja ese estado sobre el mapa (feature-state + popup), así que el comportamiento es consistente sin importar el origen de la interacción.
- **Sin refetch en cada filtro**: los filtros se aplican en memoria sobre los datos ya cargados (`selectFilteredEarthquakes`), no se vuelve a llamar a la API.
- **Manejo de errores centralizado**: un interceptor HTTP (`httpErrorInterceptor`) normaliza cualquier error de red/servidor a un `ApiError` con un mensaje ya listo para mostrar al usuario.
- **Rendimiento en el mapa**: seleccionar/hacer hover no llama `setData()` de nuevo (costoso); usa `feature-state` de MapLibre, que es liviano y mantiene fluida la interacción incluso con cientos de puntos.

## Requisitos previos

- **Node.js**: `^22.22.3`, `^24.15.0` o `>=26.0.0` (ver `.nvmrc` → 22, y `engines` en `package.json`)
- **npm** `10.9.8` (declarado como `packageManager`)

## Instalación

```bash
npm install
```

## Ejecutar en desarrollo

```bash
npm start
```

Esto ejecuta primero `scripts/copy-maplibre-worker.mjs` (ver [Configuración](#configuración)) y luego `ng serve`. Abrir `http://localhost:4200/`.

## Scripts disponibles

| Comando                 | Descripción                                                           |
| ----------------------- | --------------------------------------------------------------------- |
| `npm start`             | Levanta el servidor de desarrollo (`ng serve`) con recarga automática |
| `npm run build`         | Compila la app para producción en `dist/`                             |
| `npm run watch`         | Build en modo desarrollo con watch                                    |
| `npm test`              | Corre los tests unitarios con Vitest                                  |
| `npm run test:coverage` | Corre los tests una vez y genera reporte de cobertura                 |
| `npm run lint`          | Corre ESLint sobre el proyecto                                        |
| `npm run format`        | Formatea el código con Prettier                                       |
| `npm run format:check`  | Verifica el formateo sin modificar archivos                           |

## Configuración

La configuración de la app vive en `src/app/core/config/app-config.ts`, expuesta mediante el `InjectionToken` `APP_CONFIG`:

- `earthquakeFeedUrl`: URL del feed GeoJSON de USGS (por defecto, sismos M4.5+ del último mes).
- `mapStyleUrl`: estilo público de demo de MapLibre (no requiere API key).
- `map.initialCenter` / `map.initialZoom`: vista inicial del mapa.
- `map.focusZoom`: zoom aplicado al hacer `flyTo` sobre un sismo seleccionado desde la lista.

### Sobre el worker de MapLibre

MapLibre GL JS v6 carga su web worker de renderizado desde una URL que ni Vite (dev) ni esbuild (build) resuelven de forma confiable. Por eso el script `scripts/copy-maplibre-worker.mjs` copia los archivos `maplibre-gl-worker.mjs` y `maplibre-gl-shared.mjs` directamente desde el paquete instalado hacia `public/`, donde Angular los sirve tal cual. Este script corre automáticamente antes de `start` y `build` (hooks `prestart`/`prebuild`), así que siempre queda sincronizado con la versión de `maplibre-gl` instalada — no requiere mantenimiento manual.

## Testing

```bash
npm test              # modo watch
npm run test:coverage # una sola corrida + reporte de cobertura en /coverage
```

El proyecto usa Vitest (no Karma/Jasmine) como test runner, con `jsdom` como entorno DOM. Los componentes que dependen de MapLibre se testean inyectando mocks a través de `MAP_FACTORY`/`POPUP_FACTORY` en lugar de montar un mapa real.

## Calidad de código y convenciones de commits

- **ESLint + Prettier**: se ejecutan automáticamente en cada commit vía **Husky** + **lint-staged** (hook `pre-commit`).
- **Commitlint**: valida que los mensajes de commit sigan [Conventional Commits](https://www.conventionalcommits.org/) (hook `commit-msg`).
- Hook `pre-push` adicional configurado en `.husky/`.

### Convención de commits

Formato del mensaje:

```
tipo(alcance opcional): descripción
```

**Reglas del mensaje:**

- Tipo válido y en minúscula. Los tipos permitidos son:
  - `feat`: funcionalidad nueva
  - `fix`: corrección de un bug
  - `test`: tests
  - `refactor`: cambio de código sin cambiar comportamiento
  - `docs`: documentación
  - `style`: formato
  - `perf`: rendimiento
  - `build`: dependencias y configuración de build
  - `ci`: pipelines
  - `chore`: tareas menores
  - `revert`: revertir un commit
- Descripción obligatoria, que empiece en minúscula y sin punto final.
- Primera línea de máximo 72 caracteres.
- Cuerpo opcional, con líneas de máximo 100 caracteres.

Ejemplos:

```
feat(map): agregar popup al hacer hover sobre un sismo
fix(filters): corregir límite de fecha al filtrar por día local
docs: actualizar README con instrucciones de instalación
```

---
