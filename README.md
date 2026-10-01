# BlueClue

**BlueClue** es un entrenador interactivo para aprender a pinchar.

No es un clon de Rekordbox, no es un reproductor generalista y no es un curso de vídeos. Su objetivo es enseñar a **escuchar**, entender y ejecutar conceptos DJ mediante práctica visual, auditiva y corrección inmediata.

## Objetivo

La primera versión debe conseguir una sola cosa muy bien:

> Que una persona que está empezando pueda escuchar una canción, seguir el pulso, contar 1-2-3-4 y reconocer dónde cae el 1 del compás.

El ciclo de aprendizaje es:

```text
ESCUCHA → ACTÚA → RECIBE FEEDBACK → ENTIENDE → REPITE
                                      ↓
                                 HAZLO EN LA FLX4
```

## V0.1 — Beat Trainer

Incluye:

- carga de pistas de entrenamiento
- reproducción y pausa
- waveform sincronizada
- BPM visible
- patrón 1-2-3-4 en modo Teach
- detección del downbeat usando datos de referencia
- botón grande `TAP` / `MARCAR EL 1`
- feedback inmediato: clavado, cerca, temprano, tarde
- modos Teach / Assist / Train
- repetición rápida del mismo fragmento
- progreso básico de sesión
- 5 pistas piloto configuradas por datos

## Modos

### Teach
Muestra waveform, beats, downbeats, 1-2-3-4 y compás.

### Assist
Reduce las ayudas. El usuario debe empezar a reconocer el 1.

### Train
Oculta casi todas las pistas visuales. El usuario marca el 1 por oído.

## Stack inicial

- Next.js
- TypeScript
- WaveSurfer.js
- HTMLAudioElement / Web Audio API cuando sea necesario
- JSON local por pista
- persistencia local simple

## Regla de alcance

V0.1 **no** debe incluir todavía:

- Essentia
- análisis automático de toda la biblioteca
- gestión de 10.000+ canciones
- dos decks completos
- stems
- mezcla armónica
- EQ avanzado
- efectos
- integración Apple Music
- gamificación compleja

Primero validamos que el producto realmente ayuda a **escuchar y reconocer el 1**.

## Roadmap

```text
V0.1  BEAT + EL 1
  ↓
V0.2  COMPÁS + FRASE
  ↓
V0.3  SONG ANATOMY
  ↓
V0.4  DOS DECKS / PHRASE MIXING
  ↓
V0.5  FLX4 DRILLS
  ↓
V1.0  ANALYSE MY TRACK
```

## Documentación

- [Producto y objetivo](docs/PRODUCT.md)
- [Especificación V0.1](docs/V0.1.md)
- [Arquitectura](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Instrucciones para el agente](AGENTS.md)

## Principio rector

**BlueClue debe enseñar haciendo.**

Si la interfaz funciona pero el usuario no empieza a escuchar mejor el beat y el 1, la entrega no está terminada.
