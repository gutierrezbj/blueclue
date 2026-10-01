# Piloto con música del usuario

Fecha: 2 de octubre de 2026. Estado: cinco fragmentos locales integrados; validación auditiva y pedagógica pendiente.

## Selección

| Ejercicio | Archivo del pack | BPM de referencia | Fragmento original aproximado | Objetivo propuesto |
| --- | --- | --- | --- | --- |
| Encuentra el pulso | 10 Steps 2 DJ — Practice Track 01 | 122 | 0,457–12,760 s | Contar cuatro sobre una base de práctica |
| Mantén cuatro pulsos | 10 Steps 2 DJ — Practice Track 02 | 124 | 0,261–12,474 s | Sostener el conteo y retirar ayudas |
| Entra en la cuenta | Nightcrawlers — Push The Feeling On (Max Chapman, Kodewerk Remix) | 128 | 29,350–45,000 s | Orientarse en un fragmento que empieza antes de un downbeat |
| Conserva la cuenta | The Shapeshifters — Lola's Theme (Mistrix Dub) | 124 | 119,421–135,555 s | Mantener la cuenta durante un cambio de acompañamiento |
| No persigas cada golpe | FreeBeats.io — Shook (Beatmatch Edit 90 BPM) | 90 | 0,729–17,329 s | Separar el pulso regular de otros golpes |

La dificultad y los objetivos son propuestas de curación, no resultados de una prueba con alumnos. Los dos primeros recursos son pistas de práctica del curso, no canciones comerciales completas.

## Procedencia y comprobaciones

- Los originales están en el pack del pendrive. No se modifican ni se necesitan una vez preparados los fragmentos.
- Se inspeccionaron cinco campos `Serato BeatGrid` ya existentes en sus etiquetas ID3: cada archivo contiene un único anclaje y tempo constante. No se generaron downbeats mediante detección automática.
- Se consultó la [documentación técnica del formato](https://github.com/Holzhaus/serato-tags/blob/main/docs/serato_beatgrid.md) para interpretar los campos de posición y BPM. El [manual de Serato](https://support.serato.com/hc/en-us/articles/202523390-Introduction-to-Beatgrids) advierte que una rejilla o su primer downbeat pueden necesitar corrección; la existencia de metadatos no demuestra exactitud musical.
- Se compararon la señal y las referencias en una revisión visual local. Las marcas siguen la periodicidad observada; esto no acredita que el anclaje sea musicalmente el 1.
- El entorno no permitió escuchar el audio. No se presenta la selección como revisada por oído.
- La UI, el contador y el scoring usan los mismos downbeats. Los fragmentos con un beat previo al primer downbeat ya no se cuentan incorrectamente desde 1.
- Los hashes de los originales fijan las versiones exactas. Otro remix, otra edición o un archivo modificado necesita una revisión nueva, no reutilizar la referencia a ciegas.

## Instalación local reproducible

Ejecutar `python scripts/prepare-local-pilot.py --source-dir "D:\DJ Course Music Pack"` desde la raíz del repositorio. La receta está en `data/pilots/course-pack.json` y no recorre otras carpetas.

El script prepara los cinco WAV sin cambiar su frecuencia de muestreo ni su formato PCM y escribe `.local/pilot.json`. Tanto ese catálogo como `public/tracks/local-pilot/` están ignorados por Git. Reiniciar el servidor después de preparar los archivos. No incluirlos en despliegues públicos ni atribuirles una licencia de redistribución.

El servidor carga únicamente el catálogo preparado. No hay conexión con Drive, importación de una biblioteca completa, analizador de audio ni servicio externo. Si el catálogo es inválido o falta un audio, se muestra una explicación y se conserva la demostración utilizable.

## Validación pendiente

Todas las referencias comienzan con `referenceStatus: "pending-listening"`. Se puede escuchar, ver las marcas, practicar y repetir; el feedback señala que es provisional y no añade intentos al historial de aciertos. No se confunde una comparación matemática contra metadatos con una comprobación auditiva.

Antes de activar resultados normales para una pista:

1. Escuchar el archivo exacto y confirmar el 1 durante varios compases, no solo el primer golpe.
2. Comprobar el principio, el final, los cambios y cualquier pickup del fragmento.
3. Corregir las referencias si fuese necesario y dejar constancia de quién revisó y qué versión del archivo.
4. Cambiar su estado a `listening-verified` solo después de esa revisión. Volver a ejecutar el preparador restablece prudentemente el estado pendiente.
5. Probar Teach → Assist → Train con una persona y comprobar la transferencia a otro fragmento.

No se da por terminada V0.1 hasta esa validación humana.
