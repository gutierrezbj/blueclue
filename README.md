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

### Primer paso V0.2: cuenta ocho compases

Desde la elección de ejercicios, abre **Siguiente etapa · Cuenta 8 compases**.
Escucha la entrada, cuenta ocho grupos de cuatro y marca la vuelta al primer
compás. Dos vueltas por ronda, ayudas Teach / Assist / Train, tres velocidades
y revisión del bloque completo. No es todavía detección de frases musicales.
Los tres niveles y récords de V0.1 se conservan. [Alcance](docs/V0.2.md).
Para usarlo sin conexión, actualiza la descarga desde Ajustes del Beat Trainer.

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

Las cinco pistas públicas tienen **24 compases** y duran **51–62 segundos al tempo
original**, incluida la entrada. Tras los dos compases de escucha quedan **22 unos**
para practicar sin reiniciar (88 pulsos en el módulo Pulso). Despacio mantiene los
mismos objetivos y alarga la escucha. Los cinco WAV ocupan **12,13 MB** en conjunto,
más los recursos de la app. La pausa de «Vuelve al 1» sigue situada a mitad de pista.

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

El recorrido indica la pista, el módulo, las ayudas y la velocidad actuales. «Continuar» recorre **Teach → Assist → Train**, primero **Despacio**, después **Intermedio** y finalmente **Original**, antes de pasar al siguiente módulo (Pulso → Cuenta → Encuentra el 1) y a la siguiente pista. «Anterior» deshace ese mismo recorrido. Cada paso comienza desde 0:00, pausado, con su preparación completa al pulsar Play. No es obligatorio completar todas las combinaciones: puedes repetir o elegir libremente pista, módulo, velocidad y ayudas desde Ajustes. La navegación guiada inicia cada nuevo módulo/pista en Teach y Despacio. La elección directa de módulo mantiene su ayuda inicial (Teach, Teach y Assist); cambiar solo de ayuda manualmente conserva la posición y pausa el audio.

La dificultad muy fácil comienza en **Despacio (65 %)** y la fácil en **Intermedio (80 %)**; las demás empiezan al ritmo original. La primera pista privada pasa de 122 a unos **79 BPM**. Puedes elegir cualquiera de las tres velocidades en todos los módulos: cambiarla pausa sin perder la posición y empieza otra ronda. El navegador conserva el tono; preparación y música comparten velocidad, sin un salto de tempo al entrar. El scoring mantiene las mismas tolerancias en milisegundos reales, no en tiempo del archivo. El reloj indica tiempo de escucha a la velocidad elegida y la waveform indica segundos de pista. Los resultados se separan por módulo y velocidad.

El TAP no detiene la música: marca varios compases seguidos. Pausar y continuar conservan el último feedback para poder leerlo con calma. Enter registra al pulsar la tecla: mantenerla apretada no genera intentos adicionales. «Escuchar otra vez» abre una revisión guiada que muestra la respuesta y no puntúa; «Volver a practicar» repite ese fragmento con las ayudas del modo elegido. El replay y el resumen respetan la consigna del nivel: en Pulso se habla de pulsos, no de buscar el 1. «Reiniciar ejercicio» aparece junto a Play y junto al TAP en escritorio; en móvil hay un único Reiniciar junto a Play. Vuelve a 0:00, limpia el feedback y reproduce de nuevo la entrada de preparación, sin arrastrar la waveform ni borrar los intentos guardados.

Play mueve inmediatamente la bolita por el tramo plano para acomodarte. Después aparece **4 → 3 → 2 → ¡1! al tempo del ejercicio**: el último 1 coincide con el primer downbeat de referencia y continúa 2‑3‑4 sin repetirlo. Los archivos mantienen tres segundos de silencio; su duración real aumenta al practicar despacio. Pausar detiene también la cuenta y reiniciar la repite. Espacio inicia o pausa desde la página o desde TAP; clic o Enter sobre TAP responde al ejercicio actual. Cuando TAP se habilita, recibe el foco. El atajo respeta selectores, campos de texto y el comportamiento nativo de otros botones. La velocidad se adapta en el reproductor, sin modificar los archivos originales ni usar timers de inicio.

Los cinco fragmentos del piloto privado duran aproximadamente **un minuto**, no 12–16 segundos. Al comenzar desde el principio, los dos primeros compases son de escucha: TAP muestra «SOLO ESCUCHA» y no registra intentos. El primer objetivo es el 1 del tercer compás; TAP se habilita un poco antes para aceptar también pulsaciones adelantadas. Después se puede marcar cualquier 1, sin obligación de acertar el primero ni parar la música. Esta entrada sigue el reloj del audio, no un temporizador: pausar no consume escucha y volver al inicio la repite. Reanudar más adelante conserva el punto de práctica. Assist y Train mantienen sus ayudas reducidas; el replay sigue siendo una revisión sin puntuar.

Las referencias del piloto musical proceden de las rejillas Serato de los archivos originales y están pendientes de validación auditiva. Se muestra feedback provisional, pero no se suman aciertos hasta revisar esas referencias. La posición y el modo sí se guardan, separados del historial de la demostración.

Se guardan localmente la pista, el módulo, las ayudas, la velocidad, los últimos 100 intentos y el punto de reproducción (cada dos segundos y al pausar o salir). Las sesiones anteriores sin módulo se recuperan en «Encuentra el 1», conservando su historial. Al volver, el audio permanece pausado hasta que pulses «Continuar práctica». Si el navegador bloquea el almacenamiento, aparece un aviso y puedes seguir practicando sin persistencia. Avanzar en el recorrido no equivale a demostrar dominio: hay que comprobarlo por oído con música no practicada.

La waveform muestra una ventana ampliada de unos ocho segundos de pista, no toda la canción comprimida. La línea plana ocupa aproximadamente un tercio del ancho y la bolita sigue el reloj del audio. La vista se desplaza automáticamente y adapta su escala al ancho de pantalla; beats, respuesta del replay y bolita usan la misma ventana visible.

Al terminar, o pulsar **Ver resumen de esta ronda**, aparecen oportunidades clavadas, cerca, fuera de tiempo y sin marcar. Suman el total de oportunidades completas escuchadas después de los dos compases de preparación: no se penalizan los objetivos futuros, saltados o a medio escuchar. Cada objetivo cuenta una vez, con la primera pulsación dentro de su ventana de ±450 ms reales; las repetidas se informan aparte y el feedback conserva ese primer resultado con la etiqueta REPETIDA. Los toques más alejados se muestran por separado y no bloquean un acierto posterior. En Teach y Assist se marcan los objetivos pasados con ✓, ≈ o ×; Train los revela solo al revisar. El detalle muestra el tiempo, temprano/tarde y permite escuchar cada fragmento con su referencia y tu pulsación.

El resumen de ronda vive en memoria: pausar lo conserva; reiniciar, cambiar pista, módulo, ayuda o velocidad, mover la onda o volver a practicar desde un replay empieza otro. Recargar conserva tu punto de práctica, pero no el resumen de la ronda anterior. El historial local de intentos validados permanece. Las referencias pendientes muestran un **resumen provisional**, nunca una nota ni aciertos persistidos.

## Challenge y récords

**Empezar Challenge** aparece al final, después de los controles de práctica y
continuación, como siguiente paso cuando te sientas preparado. En móvil queda al
final de **Ajustes** y del resumen, nunca en la pantalla limpia de práctica. Conserva
pista, nivel y velocidad, pasa a Train y queda preparado en 0:00: pulsa Play.
Tras la entrada, escucha sin onda ni contador y marca hasta el final. La respuesta
se revela al terminar. Puedes pausar; terminar antes no guarda récord.

Se guarda tu mejor ronda completa por pista, nivel y velocidad, separada del
historial de práctica. El porcentaje divide clavados+cerca entre oportunidades
más toques adicionales (repetidos o lejos del objetivo), para no premiar pulsar
en todos los golpes cuando solo se pide el 1. Incluye los objetivos sin marcar. La app
recomienda probar el siguiente nivel con **80 % entre clavados y cerca en dos
pistas distintas a la misma velocidad**; mínimo 20 oportunidades por ronda.
Es una orientación inicial, no un aprobado obligatorio. Puedes avanzar libremente.
Las pistas privadas con referencias pendientes no ofrecen Challenge puntuable.
No hay sincronización ni ranking público. Una ronda en curso no se recupera como
Challenge tras recargar; los récords terminados sí.

## iPhone y modo bolsillo

La identidad visual acompaña al nivel: **1 · Pulso, turquesa; 2 · Cuenta, azul;
3 · Encuentra el 1, negro y amarillo**. Velocidad y ayudas no cambian la paleta.
En móvil, el nivel queda identificado también por texto en Práctica, Ajustes y
resumen. La selección existente se conserva, sin migrar ni borrar progreso.

Versión pública: **[blueclue.jrgblanco.com](https://blueclue.jrgblanco.com)**,
con cinco pistas sintéticas; la música privada del curso no está publicada.

La versión de producción incluye manifiesto PWA, icono de inicio y descarga
explícita de las cinco pistas del catálogo activo. Abre **Ajustes → BlueClue en tu bolsillo** en móvil
para ver instrucciones y estado. En iPhone: Safari → Compartir → Añadir a pantalla
de inicio; abre desde el icono y descarga allí, con Wi-Fi. Safari y la app instalada
pueden usar almacenamientos separados. Comprueba la descarga en modo avión antes
de salir. No se descarga la biblioteca ni se sincroniza progreso entre dispositivos.

`npm run build` genera también el inventario offline; después ejecuta `npm start`.
La descarga no está habilitada en `npm run dev`. Fuera de localhost requiere HTTPS.
No sirve abrir la IP del ordenador por HTTP para validar instalación en iPhone.

El móvil separa Práctica, Ajustes y resumen: onda, guía, controles, TAP y feedback
permanecen juntos, sin portada ni controles duplicados. «Continuar» en el resumen
indica las ayudas y velocidad del siguiente paso; no arranca música por sorpresa. TAP
registra al apoyar el dedo (o pulsar el ratón), no al soltarlo; Enter sigue disponible.
Cambiar de app o bloquear la pantalla pausa la práctica, sin reanudar automáticamente.
El zoom sigue permitido y se respetan las zonas seguras de pantalla.

Si una descarga se corta, no se presenta como completa y se conserva la anterior.
Actualizar el paquete no borra el progreso; eliminar la descarga tampoco. iOS puede
liberar la caché: revisa su estado antes de viajar. Usa altavoz o cable para practicar
con precisión; el retardo Bluetooth no se calibra en esta versión.

Pruebas locales: apertura desde una pestaña nueva y reproducción de las cinco pistas
con el servidor apagado, vista de 375 px sin desbordamiento, TAP/Enter, 76 tests y
build. **Aceptación del usuario, 4 octubre 2026:** Juan confirma funcionamiento
correcto, incluido modo avión, en el contexto de su iPhone. El nuevo Challenge
necesita su primera prueba tras actualizar; no se ha medido latencia Bluetooth.
Consulta [validación móvil](docs/MOBILE.md) y [operación](docs/OPERATIONS.md).

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
- [Operación ligera, reserva de puertos y estado PWA](docs/OPERATIONS.md)
- [Instrucciones para el agente](AGENTS.md)

## Principio rector

**BlueClue debe enseñar haciendo.**

Si la interfaz funciona pero el usuario no empieza a escuchar mejor el beat y el 1, la entrega no está terminada.
