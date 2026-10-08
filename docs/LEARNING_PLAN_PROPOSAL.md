# Propuesta — BlueClue como recorrido de aprendizaje

Fecha de revisión: 1 de octubre de 2026.

Estado: propuesta de producto. No modifica el alcance aprobado de V0.1 ni acredita todavía una mejora pedagógica. El usuario quiere cubrir tres escenarios: aprendizaje personal con FLX4, principiantes en general y personas que ya mezclan.

## Resultado que perseguimos

Que el alumno pueda escuchar una canción que no ha practicado, orientarse musicalmente y aplicar lo aprendido en una controladora. Como objetivo posterior, proponemos preparar, ejecutar y revisar una sesión de 20–30 minutos con entradas en frase, niveles controlados, transiciones intencionadas y capacidad para recuperarse de errores.

El software puede evaluar precisión temporal y tareas bien delimitadas. La selección musical, la intención de una transición y la respuesta del público necesitan también escucha y valoración humana.

## Revisión de la aplicación actual

La base implementada incluye reproducción, waveform, cinco patrones sintéticos, Teach / Assist / Train, scoring aislado, replay y almacenamiento local. Es suficiente para empezar a ensayar el ciclo de práctica; todavía no demuestra transferencia a música real.

Hallazgos prioritarios:

Actualización de navegación: implementados recorrido anterior/siguiente por pista y modo, reanudación local de posición y controles accesibles junto al TAP. El TAP ya no pausa el audio; el replay guiado desactiva el TAP y permite volver al fragmento sin revelar la respuesta. Los puntos 1 y 4 siguientes describen la revisión inicial y quedan atendidos por estos cambios. Los demás hallazgos siguen pendientes; estas mejoras de usabilidad no acreditan todavía eficacia pedagógica.

1. **El TAP detiene la música.** `BeatTrainer.tsx` pausa cada intento. Sirve para estudiar un instante, pero impide evaluar si el alumno mantiene el pulso durante varios compases. Proponemos diferenciar práctica continua y revisión de un intento.
2. **El progreso mezcla condiciones distintas.** Los intentos guardan pista, clasificación y error; faltan modo, ejercicio, sesión y fecha. El contador junta Teach con Train y conserva solo los últimos 100 intentos. No permite afirmar que el alumno mejora por oído.
3. **La visualización supone que el primer beat es el 1.** El contador y las marcas usan el índice módulo cuatro, mientras el scoring usa `downbeats`. Un fragmento que empiece en otro beat puede mostrar una respuesta distinta de la evaluada. Debemos unificar las referencias antes de incorporar música real.
4. **Repetición guiada y evaluación se solapan.** El replay conserva la respuesta visible y permite otro TAP; ese intento se suma al mismo progreso. Una prueba sin ayudas necesita condiciones y resultados propios.
5. **La precisión depende también de la entrada y el audio.** El TAP usa `onClick`, que registra después de soltar el botón. Hay que comprobar pulsación, teclado/táctil y latencia del dispositivo antes de atribuir pequeños retrasos al alumno.
6. **Añadir pistas aún requiere editar código.** Los cinco JSON se importan individualmente en `tracks.ts`. Un catálogo declarativo y validado permitiría sustituir o ampliar el set sin cambiar la lógica del entrenador.

## Un recorrido, tres puntos de entrada

| Perfil | Entrada propuesta | Experiencia |
| --- | --- | --- |
| Principiante con FLX4 | Fundamentos y reconocimiento del equipo | Oír y comprender en BlueClue, luego ejecutar una tarea breve en su controladora |
| Principiante general | Fundamentos sin exigir hardware al inicio | Mismos ejercicios de oído, con prácticas físicas cuando disponga de equipo |
| Persona que ya mezcla | Diagnóstico breve por habilidades | Saltar lo demostrado y practicar las debilidades detectadas |

El diagnóstico debe medir varias habilidades por separado. Una persona puede mezclar con soltura y tener dificultades para localizar una frase o corregir una deriva de tempo.

## Recorrido propuesto

| Etapa | Capacidad | Evidencia para avanzar |
| --- | --- | --- |
| 1. Pulso y el 1 | Mantener beats, contar cuatro y localizar el downbeat | Repetirlo sin ayudas en fragmentos no practicados |
| 2. Compás y frase | Seguir grupos de compases y anticipar una entrada | Elegir y ejecutar una entrada en el lugar esperado |
| 3. Estructura | Reconocer cambios, voces, breaks y retornos | Explicar dónde y por qué podría entrar otra canción |
| 4. Preparación y sincronización | Usar cue y preescucha; igualar tempo y corregir desfase | Mantener dos pistas alineadas y recuperar una desviación |
| 5. Transición | Coordinar frase, niveles y reparto de frecuencias | Realizar transiciones con un objetivo musical y revisar el resultado |
| 6. Sesión | Seleccionar, ordenar y conectar canciones | Grabar y revisar una sesión completa con una rúbrica explícita |

Las etapas posteriores son propuestas de futuras versiones. Antes de construirlas hay que especificar objetivos, datos de referencia y evaluación de cada ejercicio.

## Estructura de una lección

1. Una consigna concreta: por ejemplo, mantener el 1 durante cuatro compases.
2. Una demostración breve que indique qué escuchar.
3. Práctica con ayudas retiradas progresivamente.
4. Feedback que explique el error y proponga una acción.
5. Repetición del momento relevante.
6. Prueba con un fragmento distinto y sin revelar la respuesta.
7. Cuando corresponda, ejecución en la controladora y revisión de una grabación.

El 1 es el inicio del compás. No debemos enseñar que siempre equivale al golpe más fuerte, al bombo o a un cambio de sección. La selección inicial debe evitar referencias ambiguas y después introducir variedad deliberadamente.

## Biblioteca musical: lo verificado

Fuente corregida por el usuario: [BIBLIOTECA de MUSICA - DJ Cuenca](https://drive.google.com/drive/folders/1EVgCxbkv-FBo8fWH946mA4DRu5QsAh8-). Sustituye al enlace anterior a los ZIP.

- El conector de Drive puede acceder a esta carpeta. Su raíz contiene 29 carpetas, un documento Word y `COLECCION REKORDBOX.xml`.
- Se verificó una muestra de 20 archivos MP3 en `POP - Cuenca`. La carpeta de electrónica contiene siete subcarpetas, entre ellas House, Tech House, Afro House y NuDisco. Es una inspección parcial, no un inventario recursivo.
- Se descargó únicamente el XML a una carpeta temporal para inspeccionarlo; no se incorporó al repositorio ni se descargó audio.
- El XML contiene **4.623 entradas de pista**, de las que **3.045 tienen BPM distinto de cero y elementos `TEMPO`**, y **1.540 tienen elementos `POSITION_MARK`**. Son recuentos de metadatos, no canciones únicas verificadas ni referencias temporales validadas.
- La fecha de modificación del XML es el 26 de octubre de 2025. No se ha comprobado su correspondencia completa con los archivos actualmente disponibles en Drive.
- No se han escuchado las canciones ni comprobado la exactitud de sus BPM, marcas, downbeats o calidad de audio. Los nombres incluyen versiones extended, remixes y mashups: la anotación debe corresponder al archivo exacto, no a otra versión del mismo tema.
- El usuario confirma que la biblioteca está en su unidad. El acceso conectado está comprobado; no se ha verificado una ruta local sincronizada. Esto tampoco implica que la aplicación del navegador pueda reproducir directamente enlaces privados de Drive.

Propuesta de preparación:

1. Usar el catálogo existente como orientación y localizar los archivos exactos de una muestra pequeña, sin importar la biblioteca completa.
2. Escuchar los candidatos y seleccionar cinco pistas con utilidad pedagógica distinta: pulso claro, conteo estable, reconocimiento del 1, retirada de ayudas y recuperación tras una pausa.
3. Reservar material distinto para evaluación; comprobar duración, formato y correspondencia entre audio y metadatos solo para los archivos seleccionados.
4. Preparar manualmente los JSON del piloto. Los metadatos existentes pueden ayudar, pero beats y downbeats necesitan revisión por escucha antes de usarse para puntuar.
5. Mantener el audio de práctica disponible localmente para que el ejercicio no dependa de una conexión con Drive.
6. Ampliar el conjunto curado cuando lo requiera una lección futura. No construir ahora un importador de Rekordbox, análisis automático ni una integración de Drive dentro de la aplicación.

Drive serviría como fuente y archivo de la biblioteca. La práctica reproduciría únicamente el audio seleccionado para la sesión. Los archivos privados se mantendrían fuera del repositorio público; cada recurso distribuible tendría una procedencia y autorización identificadas.

### Fuente local adicional: pendrive D:\

El usuario aporta también un pendrive accesible en `D:\`. Se inspeccionaron nombres, carpetas, extensiones y tamaños en modo de solo lectura; no se reprodujo, copió ni modificó audio.

| Carpeta | Contenido comprobado directamente |
| --- | --- |
| `D:\DJ Course Music Pack` | 37 archivos de audio: 22 WAV, 14 MP3 y un M4A; incluye pistas y efectos, no necesariamente 37 canciones |
| `D:\DE CERO A CIEN MUSICA EXTENDED` | 100 archivos de audio: 96 MP3 y cuatro WAV |
| `D:\BONUS1 - Songs to remember the hits of the past` | 103 archivos MP3 |
| `D:\Contents` | 66 subcarpetas; no se inventarió su contenido |
| `D:\PIONEER` | Carpetas y archivos de configuración, incluida una subcarpeta `rekordbox`; se mantienen intactos |

También existen carpetas llamadas `Dembow`, `Reggaeton`, `Reggaeton old`, `Tech house latin remix` y `Efectos_DJ`. No se ha realizado un inventario recursivo ni se han confirmado lecciones de curso en vídeo o documentos.

Los primeros candidatos para escuchar son `2 Be a DJ Practice Track 01 - 122bpm.wav` y `2 Be a DJ Practice Track 02 - 124bpm.wav`, dentro de `DJ Course Music Pack`. Su nombre sugiere material de práctica, pero los BPM indicados, el nivel pedagógico y la posición del 1 todavía necesitan comprobación. La dificultad no se asignará solo por nombre, género o tempo.

Para el piloto, priorizar estos recursos locales antes de descargar más música. Preparar únicamente los cinco audios seleccionados en una copia de trabajo privada, excluida del control de versiones, preservando los originales. La letra de la unidad puede cambiar y el pendrive puede desconectarse; la aplicación no debe asumir que una ruta `D:\` es una URL reproducible por el navegador. No se implementa en esta revisión un importador, una integración de biblioteca ni ejercicios de efectos.

## Cómo organizar la construcción

| Frente | Entregable | Condición para integrarlo |
| --- | --- | --- |
| Pedagogía y experiencia | Ficha de habilidad, consigna, ayudas y errores habituales | Un instructor y un alumno comprenden qué se practica y cómo comprobarlo |
| Contenido musical | Fragmentos, referencias temporales y dificultad justificada | Audio y anotaciones revisados por escucha |
| Ingeniería | Playback, datos, ejercicio, scoring, replay y progreso separados | Datos y visualización coinciden; pruebas temporales y funcionales pasan |
| Validación | Observaciones con usuarios de los tres perfiles | Se distingue uso correcto, mejora dentro del ejercicio y transferencia a material nuevo |

Una coordinación común mantiene el orden del backlog, el contrato de datos y los criterios de aceptación. Cada cambio debe aportar una capacidad comprobable; los commits pequeños y las revisiones independientes facilitan detectar regresiones.

## Siguiente entrega propuesta

**V0.1 validable con música real.** Prioridades:

1. Corregir la coherencia entre contador, marcas y downbeats.
2. Ajustar el TAP y permitir una secuencia de práctica que mantenga el pulso.
3. Separar resultados con ayudas, resultados sin ayudas y replay guiado.
4. Preparar cinco pistas reales con anotaciones revisadas.
5. Registrar intentos y oportunidades omitidas por habilidad y sesión.
6. Probar el recorrido con representantes de los tres perfiles.

No se fijan todavía porcentajes de aprobado ni ventanas de tiempo como estándares pedagógicos. Se propondrán valores iniciales, se comprobarán con dispositivos reales y se ajustarán a partir del piloto.

## Cómo comprobar si enseña

- Medición inicial sin ayudas sobre un conjunto reservado.
- Práctica guiada sobre otro conjunto.
- Medición posterior con fragmentos nuevos de dificultad comparable.
- Comprobación de retención en otra sesión.
- Observación de ejecución en la controladora cuando el objetivo lo requiera.

Registrar precisión, regularidad, falsos positivos, objetivos omitidos y dependencia de ayudas. Un contador de aciertos por sí solo no mide todas esas dimensiones. Las primeras pruebas con pocos usuarios sirven para detectar problemas y orientar ajustes; no bastan para afirmar eficacia general.

## Referencia externa

El [programa oficial de Berklee: Learn to DJ with Traktor](https://online.berklee.edu/courses/learn-to-dj-with-traktor) incluye encontrar el 1, beatmatching, estructura, fraseo y creación de sesiones grabadas. Se usa como contraste de competencias; el recorrido y los criterios anteriores son una propuesta propia para BlueClue.
