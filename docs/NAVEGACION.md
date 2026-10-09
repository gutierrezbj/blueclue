# Navegación — un solo recorrido

Fecha: 9 de octubre de 2026. Decisiones de Juan tras probar «Empieza aquí» en
su iPhone: la portada estaba revuelta («Paso 0 de cuántos», «¿qué mapa?», dos
botones al mismo sitio, flecha convertida en emoji por iOS).

## Decisiones

1. **Escucha antes que Ritmo.** Reconocer qué entra solo pide oído; marcar el
   pulso añade precisión de tiempo, más difícil para un nivel 0.
2. **Música real dentro de cada etapa.** Cada etapa termina con un paso
   «Ahora en una canción de verdad». Llega con las pistas del curso verificadas
   por oído; hasta entonces se muestra en gris, sin número y sin enlace.
3. **Lo futuro, en gris.** Las etapas 4 a 6 se ven en la lista como
   «Próximamente», para dar sentido de camino. No se pueden abrir.

## El recorrido

| Etapa | Paso | Pantalla |
| --- | --- | --- |
| 1 · Oído | 1 de 7 · Los cuatro sonidos | `#sonidos` |
| 2 · Escucha | 2 de 7 · El bajo | `#escucha-el-bajo` |
| | 3 de 7 · La percusión | `#escucha-la-percusion` |
| | 4 de 7 · ¿Bajo o batería? | `#bajo-o-bateria` |
| 3 · Ritmo | 5 de 7 · Sigue el pulso | `#nivel-1` |
| | 6 de 7 · Cuenta 1-2-3-4 | `#nivel-2` |
| | 7 de 7 · Encuentra el 1 | `#nivel-3` |
| 4 · Canción | Próximamente (V0.3) | — |
| 5 · Mezcla | Próximamente (V0.4) | — |
| 6 · FLX4 | Próximamente (V0.5) | — |

Una sola numeración: etapas del 1 al 6 y pasos «N de 7». Desaparecen «Paso 0»,
«01 / 02» y la palabra «mapa». Fuera del recorrido y sin número: Challenge
(dentro de Ritmo), conteos 8/16/32 (solo por enlace), `#latencia` (oculta) y la
descarga sin conexión (Ajustes). Los enlaces antiguos siguen funcionando.

## Paso hecho

Un paso está **hecho** cuando se completa una vez, no cuando se aprueba:

- Los cuatro sonidos: terminar las ocho preguntas, acierte o no.
- Escucha: terminar una ronda de Reconocer hasta el final.
- Ritmo: una ronda completa desde 0:00 que el motor de avance registra.

Se guarda en `blueclue-path-done-v1`. Para no perder lo ya practicado, al leer
también cuentan como hechos los resultados guardados antes de existir esta clave:
quiz de sonidos, última ronda de cada escucha y rondas completas de ritmo.

## Portada

| Estado | Cuándo | Botón grande | Extra |
| --- | --- | --- | --- |
| A · Primera vez | Nada hecho y, como mucho, abierto el paso 1 | «Empieza aquí · Paso 1 de 7» | — |
| B · En curso | Algo hecho, o abierto un paso posterior al 1 | «Sigue · Paso N de 7» | «Volver al principio» si N > 1 |
| C · Completo | Los siete pasos hechos | «Siguiente reto · Challenge» | «Repasar cualquier paso» |

En B el botón lleva al último paso abierto si no está hecho; si ya está hecho,
al siguiente sin hacer. El subtítulo dice «Llevas X de 7 pasos».

Debajo, **Tu recorrido**: una fila por etapa con su estado en palabras (Hecho,
Aquí, N pasos, Próximamente). La etapa del botón grande aparece desplegada con sus
pasos y su paso de canción en gris; las demás se despliegan al tocarlas. Cualquier
paso construido se puede abrir. Nada se bloquea.

## Dentro de cada paso

- Cabecera: «Paso N de 7 · Etapa». El botón de volver siempre dice «Inicio» y
  lleva a la portada.
- Al terminar: un botón «Siguiente paso · Paso N+1 de 7 · nombre».
  Ritmo conserva además su recorrido interno Teach → Assist → Train.
- Sin símbolos en la interfaz. Donde quede un glifo del reproductor, se fuerza
  presentación de texto (U+FE0E) para que iOS no lo convierta en emoji.
