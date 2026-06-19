# FORK.md — DVinyl (fork personal)

Documentación interna de los cambios propios de este fork respecto al proyecto original ([Kyonew/DVinyl](https://github.com/Kyonew/DVinyl)).

---

## Changelog

### 2026-06-19
- **Entrada manual de discos** — `GET /add-vinyl/manual`, enlace discreto bajo el buscador de Discogs
- **Editor de lista de canciones** — partial reutilizable en edición y confirmación; normalización de duración; pill de duración total en vista de detalle
- **Deploy automático** — GitHub Actions → Portus (registry privado) → Watchtower (Proxmox LXC); versionado por SHA de commit; notificaciones Telegram
- **Modo Jack Sparrow** — marcado de copias no originales (CD/cassette) con filtro y ocultación a visitantes
- **Correcciones i18n** — traducciones erróneas en es/it corregidas; etiquetas de filtro mejoradas en los 5 idiomas

---

## Features propias (no upstream)

### Entrada manual de discos
**Rama:** `feature/manual-vinyl-entry` (mezclada en `main`)

Permite agregar discos que no figuran en Discogs sin pasar por la búsqueda.

**Qué hace:**
- Ruta `GET /add-vinyl/manual` → renderiza el formulario de confirmación con campos vacíos
- Enlace discreto "¿No aparece en Discogs? Agregar manualmente" bajo el buscador
- Panel de portada abierto por defecto; banner indicando que la estimación de mercado no estará disponible
- Guarda vía `POST /save-vinyl` sin `discogs_id`

**Archivos implicados:**
- `routes/albumRoutes.js` — nueva ruta `/add-vinyl/manual`
- `views/add-vinyl.ejs` — enlace al formulario manual
- `views/confirm-vinyl.ejs` — adaptaciones para modo manual (`isManual`)
- `locales/*.json` — claves `add_vinyl.manual_entry`, `confirm_vinyl.manual_title`, etc.

---

### Editor de lista de canciones
**Rama:** `feature/manual-vinyl-entry` (mezclada en `main`)

Editor dinámico de tracklist disponible en la pantalla de edición y de confirmación de cualquier disco.

**Qué hace:**
- Filas editables con posición, título y duración
- Añadir/eliminar pistas dinámicamente
- Normalización de duración al salir del campo (`"5"` → `"5:00"`, texto inválido → vacío)
- Duración total calculada en la vista de detalle y mostrada como pill junto al año

**Archivos implicados:**
- `views/partials/tracklist-editor.ejs` — componente reutilizable
- `views/edit-vinyl.ejs`, `views/confirm-vinyl.ejs` — incluyen el partial
- `views/vinyl-detail.ejs` — cálculo y pill de duración total
- `locales/*.json` — claves `tracklist.*`

---

### Modo Jack Sparrow
**Rama:** `feature/jack-sparrow-mode` (mezclada en `main`)

Permite marcar CDs y cassettes como copias no originales (bootleg) con un indicador visual.

**Qué hace:**
- Campo `is_bootleg: Boolean` en `models/Vinyl.js`
- Toggle en la pantalla de edición y de confirmación de importación (solo visible para CD y cassette, con texto adaptado al tipo de medio)
- Distintivo de calavera (`fa-skull-crossbones`) en la portada de la vista de detalle y en las tarjetas de la colección
- Icono de calavera en la barra de filtros (junto a los ojos de mostrar/ocultar) para filtrar por copias
- Combinable con el modo hide (ojo tachado) para ver solo originales
- Opción para ocultar bootlegs a visitantes no autenticados

**Archivos implicados:**
- `models/Vinyl.js` — campo `is_bootleg`
- `models/Settings.js` — `jackSparrowMode`, `jackSparrowHideFromPublic`
- `routes/albumRoutes.js` — guardado del campo, filtro en la query de colección
- `routes/adminRoutes.js` — guardado de ajustes
- `utils/visibilityHelper.js` — ocultación a visitantes
- `views/personnalisation.ejs` — sección de configuración
- `views/edit-vinyl.ejs`, `views/confirm-vinyl.ejs` — toggle de edición
- `views/vinyl-detail.ejs`, `views/collection.ejs` — indicadores visuales
- `locales/*.json` — claves `detail.bootleg_*`, `perso.jack_sparrow_*`, `collection.filter_bootleg_copies`

---

## Mejoras enviadas upstream (PR abierto)

### Estimación Discogs en moneda preferida del usuario
**Rama:** `feature/discogs-estimation-currency`
**PR:** abierto en Kyonew/DVinyl

Muestra el valor de mercado estimado (Discogs) en la moneda configurada por el usuario (EUR/USD/GBP) en lugar de siempre en USD. La conversión se hace en `routes/albumRoutes.js` aplicando el tipo de cambio de la API de Discogs.

---

## Mejoras pendientes de PR upstream

### Correcciones de traducción (i18n)
**Rama:** `feature/i18n-es-translations`

- `common.show` "Espectáculo" → "Mostrar" (es) / "Mostra" (it)
- `collection.filter_mode_show/hide` mal traducidos como nombres de espectáculo en es e it
- Etiquetas de filtro más descriptivas en los 5 idiomas ("Mostrar coincidencias" en lugar de "Mostrar")
- `perso.title` hardcodeado como "Personnalisation" en el header → usa `t('perso.title')`
- Varias cadenas en español mejoradas (Cinta/Cintas, Inicio, Volver al inicio)

---

## Flujo de trabajo con upstream

```bash
# Ver cambios nuevos en el repo original
git fetch upstream
git log upstream/main..main --oneline

# Sincronizar con upstream sin perder cambios propios
git merge upstream/main
# Resolver conflictos si los hay, especialmente en locales/*.json y models/Settings.js
```

**Archivos con mayor riesgo de conflicto al mergear upstream:**
- `locales/*.json` — el upstream puede añadir/modificar claves que también hemos tocado
- `models/Settings.js` — hemos añadido campos propios (`jackSparrowMode`, etc.)
- `models/Vinyl.js` — campo `is_bootleg` propio
- `routes/albumRoutes.js` — ruta manual, patrón `conditions[]` y filtro bootleg
- `utils/visibilityHelper.js` — bloque de bootleg al final del fichero
- `views/confirm-vinyl.ejs` — adaptaciones modo manual y editor de tracklist
- `views/edit-vinyl.ejs` — editor de tracklist
- `views/vinyl-detail.ejs` — cálculo de duración total
