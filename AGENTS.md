# AGENTS.md — BlueClue

Este repositorio contiene BlueClue, un entrenador interactivo para aprender a pinchar.

## Prioridad absoluta

Antes de escribir código, lee:

1. `docs/PRODUCT.md`
2. `docs/V0.1.md`
3. `docs/ARCHITECTURE.md`
4. `docs/ROADMAP.md`

## Objetivo V0.1

Construir un Beat Trainer que enseñe a una persona principiante a:

- seguir el beat
- contar 1-2-3-4
- identificar el downbeat
- reconocer dónde cae el 1
- recibir feedback inmediato al pulsar

## Prohibición de ampliar alcance

No añadas por iniciativa propia:

- IA
- Essentia
- biblioteca masiva
- backend complejo
- autenticación
- dos decks
- stems
- EQ
- efectos
- integración de servicios externos
- gamificación no pedida

Si algo parece útil pero no está en la especificación, déjalo documentado como propuesta y no lo implementes.

## Stack

Usa:

- Next.js
- TypeScript
- WaveSurfer.js
- audio del navegador
- datos JSON por pista
- persistencia local simple

Evita dependencias innecesarias.

## Arquitectura

La lógica de evaluación no debe vivir en componentes visuales.

Separar:

- playback
- visualización
- datos de pista
- motor de ejercicios
- scoring
- replay
- progreso

El componente de UI llama al motor de ejercicios; el motor devuelve un resultado.

## Criterio de terminado

La V0.1 no está terminada porque compile.

Está terminada cuando una persona puede:

1. abrir una pista
2. escucharla
3. ver la waveform
4. seguir 1-2-3-4
5. ocultar ayudas
6. pulsar cuando cree que cae el 1
7. recibir feedback correcto
8. repetir el fragmento rápidamente
9. notar que entiende mejor dónde cae el 1

## Trabajo recomendado

Empieza pequeño:

1. scaffold
2. player estable
3. waveform
4. modelo de datos de pista
5. overlay de beats/downbeats
6. TAP
7. scoring
8. replay
9. modos Teach / Assist / Train
10. progreso local
11. 5 pistas piloto
12. pruebas

## Testing mínimo

Añade pruebas del motor de scoring:

- exacto
- temprano
- tarde
- selección del downbeat más cercano
- tolerancias
- comportamiento en bordes de pista

## Calidad

- TypeScript estricto
- nombres claros
- sin placeholders visibles
- sin código muerto
- sin dependencias introducidas solo por comodidad
- README actualizado si cambia la forma de ejecutar

## Regla final

El producto debe sentirse como un entrenador, no como un software DJ completo.
