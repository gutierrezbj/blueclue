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

## Ejecutar V0.1

Requiere Node.js 22.15 o superior.

```bash
npm ci
npm run dev
```

Abre `http://localhost:3000`. Las cinco pistas piloto y sus referencias de beats están incluidas; son patrones de percusión sintéticos creados para el ejercicio. Se pueden regenerar con `npm run generate:tracks`.

Si existe un piloto privado preparado, la aplicación usa sus cinco fragmentos en lugar de la demostración. Para preparar la selección del pack de curso con Python 3.11 o superior:

```powershell
python scripts/prepare-local-pilot.py --source-dir "D:\DJ Course Music Pack"
npm run build
npm start
```

El script solo recorta los cinco archivos fijados en `data/pilots/course-pack.json`, comprueba sus SHA-256 y conserva los originales. No analiza una biblioteca ni detecta beats. Los audios y el catálogo local están excluidos de Git; no los publiques ni redistribuyas sin autorización. Los comandos de desarrollo y producción escuchan únicamente en `127.0.0.1`. Si faltan el catálogo o sus archivos, vuelve a las pistas de demostración. Más detalles en [selección del piloto musical](docs/PILOT_MUSIC.md).

```bash
npm test
npm run build
```

Para practicar, empieza por **Sigue el pulso**: acompaña todos los golpes regulares con el botón grande, sin buscar todavía el 1. En **Cuenta 1-2-3-4**, cuenta en voz alta y pulsa solo al volver del 4 al 1. En **Encuentra el 1**, reconoce ese inicio con menos ayudas. Tras cada TAP, observa cuánto te adelantaste o retrasaste y usa «Escuchar otra vez» para oír el mismo momento.

El recorrido indica la pista y el módulo actuales. «Anterior» y «Continuar» recorren Pulso → Cuenta → Encuentra el 1 en cada una de las cinco pistas; también puedes elegir directamente un módulo o una pista. Cambiar de módulo vuelve al comienzo, pausado, con su ayuda inicial (Teach, Teach y Assist). Teach / Assist / Train siguen disponibles independientemente del módulo: cambiar de ayuda conserva el punto de reproducción y pausa el audio para leer la nueva consigna.

La dificultad muy fácil comienza en **Despacio (65 %)** y la fácil en **Intermedio (80 %)**; las demás empiezan al ritmo original. La primera pista privada pasa de 122 a unos **79 BPM**. Puedes elegir cualquiera de las tres velocidades en todos los módulos: cambiarla pausa sin perder la posición. El navegador conserva el tono; los tres segundos de silencio siempre avanzan a velocidad normal. El scoring mantiene las mismas tolerancias en milisegundos reales, no en tiempo del archivo. El reloj indica tiempo de escucha a la velocidad elegida y la waveform indica segundos de pista. Los resultados se separan por módulo y velocidad.

El TAP no detiene la música: marca varios compases seguidos. «Escuchar otra vez» abre una revisión guiada que muestra la respuesta y no puntúa; «Volver a practicar» repite ese fragmento con las ayudas del modo elegido. «Reiniciar ejercicio» aparece junto a Play y junto al TAP, también en móvil: vuelve a 0:00, limpia el feedback y reproduce de nuevo la entrada de preparación, sin arrastrar la waveform ni borrar los intentos guardados.

Play inicia inmediatamente una entrada de **3 segundos de silencio real**: la barra avanza por el espacio vacío antes de llegar a la música. Sustituye la espera anterior con la barra parada, no se suma a ella. El contador de preparación sigue el tiempo del audio; pausar lo detiene y reiniciar lo devuelve al comienzo. Espacio inicia o pausa desde la página o desde TAP; clic o Enter sobre TAP responde al ejercicio actual. Cuando TAP se habilita, recibe el foco. El atajo respeta selectores, campos de texto y el comportamiento nativo de otros botones. Reanudar conserva la posición y el replay no añade otra espera. Los audios preparados incluyen el silencio y desplazan beats/downbeats el mismo tiempo. La velocidad se adapta en el reproductor, sin modificar los archivos originales.

Los cinco fragmentos del piloto privado duran aproximadamente **un minuto**, no 12–16 segundos. Al comenzar desde el principio, los dos primeros compases son de escucha: TAP muestra «SOLO ESCUCHA» y no registra intentos. El primer objetivo es el 1 del tercer compás; TAP se habilita un poco antes para aceptar también pulsaciones adelantadas. Después se puede marcar cualquier 1, sin obligación de acertar el primero ni parar la música. Esta entrada sigue el reloj del audio, no un temporizador: pausar no consume escucha y volver al inicio la repite. Reanudar más adelante conserva el punto de práctica. Assist y Train mantienen sus ayudas reducidas; el replay sigue siendo una revisión sin puntuar.

Las referencias del piloto musical proceden de las rejillas Serato de los archivos originales y están pendientes de validación auditiva. Se muestra feedback provisional, pero no se suman aciertos hasta revisar esas referencias. La posición y el modo sí se guardan, separados del historial de la demostración.

Se guardan localmente la pista, el módulo, las ayudas, la velocidad, los últimos 100 intentos y el punto de reproducción (cada dos segundos y al pausar o salir). Las sesiones anteriores sin módulo se recuperan en «Encuentra el 1», conservando su historial. Al volver, el audio permanece pausado hasta que pulses «Continuar práctica». Si el navegador bloquea el almacenamiento, aparece un aviso y puedes seguir practicando sin persistencia. Avanzar en el recorrido no equivale a demostrar dominio: hay que comprobarlo por oído con música no practicada.

La waveform muestra una ventana ampliada de unos ocho segundos, no toda la pista comprimida. Los tres segundos de preparación ocupan aproximadamente un tercio del ancho: una bolita sigue el reloj del audio sobre la línea plana y el contador muestra 3‑2‑1 antes de la música. La vista se desplaza automáticamente y adapta su escala al ancho de pantalla; beats, respuesta del replay y bolita usan la misma ventana visible.

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
