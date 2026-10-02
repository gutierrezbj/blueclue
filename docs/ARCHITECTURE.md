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

`src/lib/localPilot.ts` lee y valida un catálogo JSON privado preparado previamente. Si no está disponible, mantiene las cinco pistas de demostración. `src/lib/beatGrid.ts` vincula el contador y las marcas a `downbeats`, también con un inicio a mitad de compás. Las referencias pendientes de escucha no generan aciertos persistidos. No se analiza audio en tiempo de ejecución.

`src/lib/playbackPreparation.ts` calcula la preparación restante a partir del reloj del audio y `leadInSeconds`; no programa una reproducción diferida. Los preparadores añaden tres segundos de muestras silenciosas a los archivos de ejercicio y desplazan beats/downbeats y duración en la misma cantidad. WaveSurfer mueve la barra sobre ese silencio real. Pausar, reiniciar, seek y replay comparten una única línea temporal sin timers de inicio que puedan dispararse después de navegar.

`src/lib/practiceEntry.ts` reserva los dos primeros compases de cada fragmento para escucha. Usa los downbeats y el tiempo real del audio; antes de la ventana temprana del tercer downbeat no devuelve intentos. Excluye los downbeats de escucha del scoring y comparte su tolerancia de temprano. No cambia el tempo, la posición al reanudar ni las ayudas de Teach / Assist / Train. El foco pasa a TAP cuando se habilita, no durante la escucha inicial.

## Audio

Prioridades:

1. estabilidad de reproducción
2. sincronía visual
3. precisión suficiente al registrar TAP
4. seek rápido para replay

## Rendimiento

WaveSurfer usa una escala de ocho segundos por ancho visible y seguimiento automático. `src/lib/waveformWindow.ts` proyecta beats, respuesta del replay y bolita sobre los tiempos visibles emitidos por el reproductor. Resize y scroll actualizan esa ventana; reiniciar restablece tanto el audio como el desplazamiento horizontal. La entrada silenciosa no se comprime con la duración total.

No precargar toda una biblioteca.

Solo cargar la pista activa y los metadatos necesarios.

## Futuro

Essentia y análisis automático quedan fuera de V0.1.

Cuando lleguen, deben alimentar el mismo modelo de datos, no obligar a reescribir la UI ni el motor de ejercicios.
