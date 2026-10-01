# Arquitectura — BlueClue V0.1

## Stack

- Next.js
- TypeScript
- WaveSurfer.js
- HTMLAudioElement y Web Audio API solo cuando sea necesario
- JSON local
- persistencia local simple

## Capas

```text
UI
 │
 ├── TrackSelector
 ├── PlayerControls
 ├── Waveform
 ├── BeatOverlay
 ├── CountOverlay
 ├── TapButton
 └── FeedbackPanel
        │
        ▼
Exercise Engine
 │
 ├── nearestDownbeat()
 ├── calculateTimingError()
 ├── classifyAttempt()
 └── getReplayStart()
        │
        ▼
Track Data
 │
 ├── metadata
 ├── beats[]
 └── downbeats[]
```

## Separación obligatoria

La UI no decide si un TAP es correcto.

El motor de ejercicios recibe:

- tiempo del TAP
- downbeats
- configuración de tolerancias

Y devuelve:

- target
- errorMs
- clasificación
- mensaje
- replayStart

## Modelo de datos sugerido

```ts
type Difficulty = "very-easy" | "easy" | "medium" | "hard";

type TrainingTrack = {
  id: string;
  title: string;
  artist?: string;
  bpm: number;
  timeSignature: "4/4";
  audioFile: string;
  beats: number[];
  downbeats: number[];
  difficulty: Difficulty;
};
```

## Configuración de scoring

Crear una sola fuente de verdad:

```ts
type ScoringThresholds = {
  perfectMs: number;
  closeMs: number;
  retryMs: number;
};
```

Los valores iniciales se pueden ajustar durante pruebas reales.

## Persistencia

V0.1 puede usar almacenamiento local para:

- pista actual
- modo
- punto de reproducción, recuperado sin autoplay
- número de intentos
- aciertos
- historial de la sesión

No añadir base de datos todavía.

`src/lib/practice.ts` define el orden navegable Teach → Assist → Train por pista y valida la sesión guardada. Los datos antiguos sin posición se recuperan desde el inicio; las entradas inválidas se descartan sin bloquear la práctica. El avance es voluntario y no acredita dominio pedagógico.

## Audio

Prioridades:

1. estabilidad de reproducción
2. sincronía visual
3. precisión suficiente al registrar TAP
4. seek rápido para replay

## Rendimiento

No precargar toda una biblioteca.

Solo cargar la pista activa y los metadatos necesarios.

## Futuro

Essentia y análisis automático quedan fuera de V0.1.

Cuando lleguen, deben alimentar el mismo modelo de datos, no obligar a reescribir la UI ni el motor de ejercicios.
