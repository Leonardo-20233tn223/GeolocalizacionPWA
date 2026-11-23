# AGENTS.md

## Estado del repo

- PWA de geolocalización implementada en la raíz: `index.html`, `app.js`, `geo-helper.js`, `sw.js`, `styles.css`, `manifest.json` e `icons/`.
- Sin `package.json`, build, tests, lint ni CI: JS vanilla servido tal cual. Repo `main` sin commits ni remoto; no hacer commit ni push salvo que se pida.
- Guía de la práctica (fuente del contrato): https://josenarvaez.notion.site/Tema-6-3-Geolocalizaci-n-Consciente-y-Reutilizable-geo-helper-js-42161020854e8097962bcc83e06a11cc
- Los ejemplos de referencia viven FUERA de este repo: `../pwa-practica-5.1` (instalabilidad + cámara + pre-permiso), `../app` (caché FakeStore), `../pwa-practica-4.2` (PokéAPI + TTL). No modificarlos ni copiar sus rutas absolutas (rompen en GitHub Pages de proyecto).

## Ejecutar / verificar

- Servir por HTTP desde la raíz: `python -m http.server 5500` o Live Server (`http://127.0.0.1:5500`). `file://` no registra SW ni da contexto seguro.
- Tras editar JS: `node --check app.js && node --check geo-helper.js && node --check sw.js`.
- Manifest: `node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8'))"`.
- Sin `async`/`await`: `grep -nE "\b(async|await)\b" app.js geo-helper.js sw.js` no debe devolver nada.
- Geolocalización solo en `localhost` o HTTPS; `http://<IP-LAN>` no es contexto seguro.
- Probar en DevTools > Sensors (Location) el camino `granted`; bloquear el permiso para ver el plan B; recargar offline.

## Reglas duras

- 100% JavaScript vanilla: sin librerías ni dependencias externas.
- CERO `async`/`await`: toda la asincronía con `new Promise()` y consumo `.then()` / `.catch()`.
- Rutas relativas (`./...`); `./geo-helper.js` debe estar en el precache del Service Worker y cargarse ANTES de `app.js` en `index.html`.
- El nombre real del CSS es `styles.css` (no `style.css`); el precache debe coincidir o `addAll` falla.
- Textos de UI e identificadores en español.

## Contrato de `geo-helper.js`

- `obtenerUbicacionActual(opcionesPersonalizadas)` → promesa que resuelve `{ latitud, longitud, precisionMetros, timestamp }`; defaults `enableHighAccuracy:true`, `timeout:8000`, `maximumAge:30000`; rechaza un `Error` con `.codigo` (`PERMISSION_DENIED` | `POSITION_UNAVAILABLE` | `TIMEOUT`).
- `consultarEstadoPermisoGeo()` → promesa que resuelve `'granted' | 'denied' | 'prompt'`; devuelve `'prompt'` si `navigator.permissions` no existe (iOS/Safari).
- No dupliques `navigator.geolocation` en `app.js`: reutiliza estas funciones.

## Flujo UX y plan B

- Nunca llames a la geolocalización al cargar: primero `consultarEstadoPermisoGeo()` desde el clic de "Adjuntar mi ubicación".
- `prompt` → tarjeta de pre-permiso; el botón de confirmación dispara la lectura (así el gesto existe en iOS).
- `denied` o cualquier error → selector manual de zona; la app no se bloquea.
- Precisión: `< 30 m` → "Precisión GPS Alta"; `>= 30 m` → "Ubicación Aproximada (Wi-Fi / IP)".

## Plataforma

- iOS/Safari: la solicitud debe nacer de un clic del usuario; fuera de un gesto Safari la bloquea o la ignora. Safari y la PWA instalada mantienen permisos por separado. `navigator.permissions` puede no existir: el helper degrada a `'prompt'`.
- Escritorio/laptop sin GPS: triangulación Wi-Fi/IP, `accuracy` peor; `enableHighAccuracy: true` aumenta la probabilidad de `TIMEOUT`. Usa `timeout`/`maximumAge` sensatos.

## Service worker y despliegue

- `CACHE_NAME = "geo-static-v1"` con prefijo `geo-static-`; sube `CACHE_NAME` al cambiar assets o la lógica del SW.
- Patrón de los ejemplos: cache-first para estáticos, network-first para navegación/APIs.
- `manifest.json` (no `.webmanifest`) con `start_url`/`scope`/`id` en `./`; `sw.js` junto a `index.html` (GitHub Pages no permite `Service-Worker-Allowed`).
- Iconos en `icons/` generados con PowerShell/System.Drawing (fondo oscuro + pin rosa mexicano); no hay script de build en el repo.

## Estilo visual

- Tema oscuro con rosa mexicano `#e4007c` (acento) y `#ff5aa8` (claro); variables en `:root` de `styles.css`. No introduzcas otra paleta.
- Mantén botones y textos con contraste AA; los badges de precisión usan rosa claro (alta) y ámbar (aproximada).
