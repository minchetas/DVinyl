# FORK.md — DVinyl (fork personal)

Documentación interna de los cambios propios de este fork respecto al proyecto original ([Kyonew/DVinyl](https://github.com/Kyonew/DVinyl)).

---

## Features propias (no upstream)

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
- `routes/albumRoutes.js` — el patrón `conditions[]` es propio; cuidado si upstream modifica la lógica de filtrado
- `utils/visibilityHelper.js` — bloque de bootleg al final del fichero
