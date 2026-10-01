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

Para practicar: comienza en Teach y cuenta en voz alta, pasa a Assist cuando puedas mantener el pulso y usa Train para localizar el 1 solo por oído. Tras cada TAP, observa cuánto te adelantaste o retrasaste y usa «Escuchar otra vez» para oír el mismo momento.

El recorrido indica la pista y el paso actuales. «Anterior» y «Continuar» recorren Teach → Assist → Train en cada una de las cinco pistas; también puedes elegir directamente otra pista. Cambiar de ayuda conserva el punto de reproducción y pausa el audio para leer la nueva consigna.

El TAP no detiene la música: marca varios compases seguidos. «Escuchar otra vez» abre una revisión guiada que muestra la respuesta y no puntúa; «Volver a practicar» repite ese fragmento con las ayudas del modo elegido. Los controles junto al TAP permiten continuar o empezar desde el principio sin volver a la waveform, también en móvil.

Antes de empezar, reanudar o reiniciar una práctica, una cuenta atrás de **4 segundos** permite colocar el ratón sobre TAP. Durante la preparación el audio permanece parado y no se puede puntuar. Espacio inicia o pausa desde la página o desde TAP; clic o Enter sobre TAP marca el 1. Al arrancar, el foco pasa a TAP. El atajo respeta selectores, campos de texto y el comportamiento nativo de otros botones. Puedes cancelar la preparación; cambiar de pista o modo cancela cualquier inicio pendiente. La escucha del replay no añade esta espera porque no requiere marcar.

Las referencias del piloto musical proceden de las rejillas Serato de los archivos originales y están pendientes de validación auditiva. Se muestra feedback provisional, pero no se suman aciertos hasta revisar esas referencias. La posición y el modo sí se guardan, separados del historial de la demostración.

Se guardan localmente la pista, el modo, los últimos 100 intentos y el punto de reproducción (cada dos segundos y al pausar o salir). Al volver, el audio permanece pausado hasta que pulses «Continuar práctica». Si el navegador bloquea el almacenamiento, aparece un aviso y puedes seguir practicando sin persistencia. Avanzar en el recorrido no equivale a demostrar dominio: hay que comprobarlo por oído con música no practicada.

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
