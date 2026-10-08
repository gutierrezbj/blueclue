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

`navigation.ts` resuelve los hashes de Inicio, bloques, niveles y rutas previas.
`TrainingApp` monta un único menú o entrenador; los menús no cargan audio.
`LearningMenu` ofrece enlaces nativos grandes sin almacenar otro progreso.
`enterPractice` conserva una sesión del mismo módulo; para otro reinicia posición
y ayudas en Teach/65 %, manteniendo pista e historial. Al hidratar la elección,
el hash pasa a la práctica genérica para que recargar respete el avance interno.
Beat Trainer guarda posición al salir por enlace o historial del navegador;
los récords y claves de almacenamiento existentes no cambian.

V0.1 puede usar almacenamiento local para:

- pista actual
- modo
- punto de reproducción, recuperado sin autoplay
- número de intentos
- aciertos
- historial de la sesión

No añadir base de datos todavía.

`src/lib/practice.ts` define el orden navegable por pista: módulos Pulso → Cuenta → Encuentra el 1; dentro de cada módulo, velocidades 65 → 80 → 100 %; dentro de cada velocidad, Teach → Assist → Train. `PracticeStep` incluye velocidad y permite navegación reversible desde cualquier selección libre, sin un índice adicional persistido. Anterior/siguiente reinician pausados; las selecciones manuales mantienen su comportamiento propio. La sesión guardada conserva compatibilidad: sin módulo mantiene downbeat; sin velocidad usa la sugerida por dificultad; sin posición vuelve al inicio. Las entradas inválidas se descartan sin bloquear la práctica. El avance es voluntario y no acredita dominio pedagógico.

`src/lib/learningModules.ts` separa las consignas y objetivos de la UI. El motor compara contra todos los beats en Pulso y contra downbeats en Cuenta y Encuentra el 1. Los tres módulos comparten preparación, scoring y replay. Teach / Assist / Train son ayudas independientes, no módulos adicionales.

La identidad visual de esos tres niveles depende de `moduleId`, expuesto como
`data-level` por `BeatTrainer`. Los tokens `--level-*` de `globals.css` gobiernan
superficies, acentos y foco; no alteran los colores semánticos de feedback.
`useWaveformPlayer` actualiza únicamente las opciones de color de WaveSurfer al
cambiar esa identidad, sin recrear el reproductor ni cargar de nuevo el audio.
Velocidad, ayudas y dificultad de pista no seleccionan paleta. No se añade ningún
campo de persistencia: restaurar el módulo restaura también su identidad.

`src/lib/playbackSpeed.ts` define las velocidades 65 %, 80 % y 100 %, su valor sugerido por dificultad y la conversión del reloj a tiempo de escucha. Preparación y música usan la misma velocidad, conservando el tono. El scoring calcula `(tapTime - target) * 1000 / playbackRate`: las tolerancias siguen siendo 85, 180 y 450 milisegundos reales. El historial separa módulo y velocidad; los intentos antiguos corresponden a downbeat al 100 %.

`src/lib/localPilot.ts` lee y valida un catálogo JSON privado preparado previamente. Si no está disponible, mantiene las cinco pistas de demostración. `src/lib/beatGrid.ts` vincula el contador y las marcas a `downbeats`, también con un inicio a mitad de compás. Las referencias pendientes de escucha no generan aciertos persistidos. No se analiza audio en tiempo de ejecución.

`src/lib/countIn.ts` calcula el tramo de acomodo y la cuenta 4‑3‑2‑1 desde el reloj del audio, el BPM y el primer downbeat. El 1 dura un beat, coincidente con el primer 1 de la referencia; luego el contador normal sigue en 2. No programa una reproducción diferida. Los archivos mantienen tres segundos de muestras silenciosas y referencias desplazadas. WaveSurfer mueve la barra sobre ese silencio a la misma velocidad que la música.

`src/lib/exerciseRound.ts` evalúa oportunidades completas desde el comienzo de la ronda hasta la posición escuchada. Excluye la preparación y ventanas parcialmente o todavía no escuchadas. Conserva la primera pulsación dentro de ±450 ms reales por objetivo e informa duplicados y toques alejados aparte; las cuatro categorías suman el total. `firstTargetTap` comparte esa selección con el feedback inmediato, que identifica las repeticiones sin presentar un acierto descartado. Un toque alejado no ocupa el siguiente objetivo. La UI reinicia la ronda ante navegación, cambios de velocidad, seek manual o nueva práctica tras replay; pausa y revisión no añaden objetivos. `RoundSummary` presenta resultados provisionales cuando corresponde y permite revisar cada objetivo sin puntuar. Las rondas no se persisten; el historial previo de intentos sigue separado.

`src/lib/practiceEntry.ts` reserva los dos primeros compases de cada fragmento para escucha. Usa los downbeats y el reloj del audio; antes de la ventana temprana del tercer downbeat no devuelve intentos. Excluye los objetivos de escucha del scoring y convierte su tolerancia temprana a segundos del archivo según la velocidad de reproducción. No cambia la posición al reanudar ni las ayudas de Teach / Assist / Train. El foco pasa a TAP cuando se habilita, no durante la escucha inicial.

## Audio

`evaluateRoundTap` registra y devuelve en una sola operación la ronda, el feedback
conservado y el indicador de repetición. La UI no vuelve a calcular el mismo TAP.
`recordRoundTap` reutiliza el motor de módulos para mantener idénticas las consignas
de pulso/downbeat durante práctica, resumen y replay. `tapInput.ts` consume Enter
al bajar la tecla y descarta su autorrepetición; deja Espacio al control de pausa.

`src/lib/challenge.ts` evalúa únicamente rondas completas de Train con referencias
verificadas. Reutiliza `summarizeRound`; mantiene reglas de 20 oportunidades,
80 % y dos pistas distintas centralizadas. Su huella de referencias/reglas evita
comparar récords de rejillas diferentes. `ChallengePanel` presenta el resultado,
récord y recomendación sin evaluar TAP en la UI. Los récords se validan al leer y
se guardan aparte de la sesión existente (`*-challenges-v1`), por catálogo.
La ronda activa es efímera: reiniciar la reemplaza, cambios de ejercicio la
cancelan y replay no puede guardar otra copia. WaveSurfer desactiva el seek durante
Challenge; la UI oculta onda y evaluación tras la entrada. No cambia el audio.

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

`barCounting.ts` separa planificación, guía y scoring de 8/16/32. Ocho tiene dos
objetivos; dieciséis y treinta y dos, uno. `getVisibleBars` muestra solo ocho
posiciones cada vez. `TrainingApp` remonta el entrenador al cambiar de paso y
reserva `longTracks` para 32, siempre sintético. `trainingCatalog` versiona y
empaqueta los cinco audios del catálogo activo más los cinco largos; no cambia
los JSON ni WAV previos. El worker acepta paquetes anteriores de cinco y nuevos
de diez, verifica todos sus recursos y conserva el paquete anterior ante fallos.

Las prácticas `#escucha-el-bajo`, `#escucha-la-percusion` y `#bajo-o-bateria` usan `ListeningTrainer`,
con un remount por id al cambiar: no arrastran audio, ronda ni revisión.
`listeningLessons.ts` centraliza consignas y mensajes por instrumento.
No mezclan su evaluación con el scoring de beats. `listening.ts` evalúa entradas
anotadas, rechaza anticipaciones y acepta reconocimiento hasta 2,5 segundos
después; calcula resumen y límites de replay. No analiza el audio. Datos y WAV
en `data/listening` y `public/tracks/listening`; el reproductor existente se
reutiliza sin onda visible ni seek manual. `trainingCatalog` mantiene cinco
pistas principales y cinco largas, y expone `listeningTrack` (bajo) y
`percussionTrack` y `choiceTrack` por separado. Las claves anteriores no cambian.
`instrument: "choice"` acepta ambas entradas y exige la elección del instrumento.
La primera respuesta dentro de la ventana consume esa entrada, acertada o
equivocada; los duplicados y toques fuera se informan aparte. Reconocidas,
confundidas y omitidas suman las cuatro oportunidades. El motor devuelve el
instrumento esperado para explicar el error; Reconocer no anuncia cambios futuros.
La última ronda de elección se guarda en `blueclue-listening-choice-listening-v1`.
La descarga actual contiene trece audios; sigue aceptando paquetes de cinco,
diez, once y doce. Un fallo en el nuevo audio conserva el paquete anterior completo.

### Empieza aquí (nivel 0)

`guidedPath.ts` define el orden del camino y guarda «donde lo dejé»
(`blueclue-path-v1`) cada vez que se entra en un paso, por el camino o por el mapa.
`soundQuiz.ts` elige el sonido sin repetir el anterior, evalúa la primera respuesta
y resume ocho preguntas; `SoundsIntro` reproduce los WAV de `public/tracks/sounds/`
con `HTMLAudioElement` y no calcula. `readiness.ts` guarda las últimas cinco
rondas completas por nivel, ayuda y velocidad (`blueclue-rounds-v1`) y devuelve
una frase; `BeatTrainer` registra una vez por ronda terminada y `RoundSummary`
solo la muestra. Challenge y referencias provisionales no cuentan.
`latencyDiagnostic.ts` calcula mediana, media y dispersión de los toques frente a
los clics programados con Web Audio en `LatencyCheck`; no hay compensación.
`listeningVariants.ts` ordena la muestra aprobada primero y elige otra sin repetir
la inmediata; `ListeningPractice` remonta `ListeningTrainer` por id.
`trainingCatalog` añade los cuatro sonidos y las variantes publicadas
(`data/listening/variants.json`) a la descarga; el worker acepta de 5 a 40 audios.

Essentia y análisis automático quedan fuera de V0.1.

Cuando lleguen, deben alimentar el mismo modelo de datos, no obligar a reescribir la UI ni el motor de ejercicios.
