# Hito «Empieza aquí» — BlueClue para nivel 0

Fecha de especificación: 8 de octubre de 2026. Estado: **construido en la rama
`empieza-aqui`, revisado por el constructor (cuatro fallos corregidos el mismo día);
pendiente de prueba por Juan en iPhone**.

## Para quién

Para alguien que abre la app sin saber qué es un beat, un bombo o «el 1».
La mayoría de cursos dan eso por sabido («es fácil») y la persona se pierde.
BlueClue debe recoger a esa persona en el nivel 0 y llevarla, paso a paso,
hasta practicar en un entorno que le enseñe. Este hito no añade módulos de
mezcla ni música real: ordena la entrada, nombra los sonidos y mide lo que hoy
no medimos. Las etapas 3–5 del mapa siguen sin autorizar.

## Decisiones ya tomadas

- **Teach, Assist y Train se quedan.** Son tres palabras que Juan quiere. Lo que
  sobra es el resto de jerga: «BPM», «vista ampliada · 8 s de pista»,
  «downbeat». Y lo que falta es una frase debajo de cada ayuda la primera vez.
- **Sin bloqueos.** La app sugiere, nunca impide. Elegir libremente sigue igual.
- **Nada se da por aprendido** por aceptar un sonido. El criterio del hito es el
  del agente constructor: «Juan reconoce lo aprendido en un ejemplo desconocido».
- **La latencia primero se mide.** No se compensa hasta tener un desfase
  consistente en el iPhone de Juan con sus auriculares.
- **Las variantes nuevas de escucha no se publican** hasta que Juan las escuche
  y las acepte, igual que las tres muestras actuales.

## Partes del hito

### 1. Un solo camino de entrada

Portada con un botón grande **«Empieza aquí»**. Si ya hay un paso guardado,
el botón pasa a **«Seguir donde lo dejé»** y aparece debajo «Empezar desde el
principio». Los bloques «Marca el 1» y «Escucha el cambio» siguen en la portada,
más pequeños, como mapa para quien ya sabe dónde quiere ir.

El camino guiado es una lista ordenada en `src/lib/guidedPath.ts`:

```text
0 · Conoce los sonidos        #sonidos
1 · Sigue el pulso            #nivel-1
2 · Cuenta 1-2-3-4            #nivel-2
3 · Encuentra el 1            #nivel-3
4 · Escucha el bajo           #escucha-el-bajo
5 · Escucha la percusión      #escucha-la-percusion
6 · ¿Bajo o batería?          #bajo-o-bateria
```

Entrar en cualquier paso, por el camino o por el mapa, guarda ese paso como
«donde lo dejé» (`blueclue-path-v1`). El entrenador actualiza también ese paso
al cambiar de nivel internamente, tras recuperar la sesión. Así «Seguir» mantiene
el último nivel, ayudas, velocidad y posición en pausa. Los enlaces anteriores
no cambian.

### 2. Paso 0 · Conoce los sonidos

Antes de pulsar nada, oír por separado los cuatro sonidos que usan los demás
ejercicios: **bombo**, **caja**, **charles** y **bajo**. Cada uno con su nombre,
una frase de cómo suena y un botón para oírlo cuantas veces quiera. Después,
«¿Cuál suena?»: la app reproduce uno al azar y la persona elige entre cuatro
botones grandes. Ocho preguntas, nunca el mismo sonido dos veces seguidas,
respuesta inmediata con el nombre correcto y botón para volver a oírlo.

Al terminar: aciertos de ocho y una frase. Con seis o más: «Ya distingues los
sonidos. Siguiente: Sigue el pulso». Con menos: «Vuelve a oírlos con calma y
repite». La última ronda se guarda en `blueclue-sounds-v1`.

Audio: cuatro WAV sintéticos de unos 2,5 segundos, generados por
`scripts/create-sound-cards.mjs` con las mismas voces que las muestras de escucha,
en `public/tracks/sounds/`. Son el sonido aislado, sin base, para que no haya nada
más que escuchar. La descarga offline los incluye.

Motor en `src/lib/soundQuiz.ts`: elegir pregunta sin repetir, evaluar respuesta,
resumir ronda y decidir la frase final. Sin audio ni React dentro.

### 3. Cero jerga en pantalla

- Cabecera móvil de la práctica: `TEACH · Despacio · 65 BPM` pasa a
  `Teach · te lo enseño todo · Despacio`. Las frases viven en `modeTaglines`
  (`src/lib/practice.ts`): Teach «te lo enseño todo», Assist «te quito pistas»,
  Train «tú solo».
- Los botones Teach / Assist / Train muestran esa frase como subtítulo.
- «BPM DE PRÁCTICA» pasa a «golpes por minuto». «VISTA AMPLIADA · 8 S DE PISTA»
  pasa a «Lo que suena ahora».
- Cada pantalla de práctica empieza con lo que vas a oír y lo que vas a hacer,
  en una frase cada una. Ya existe en los módulos (`instruction`); se mantiene.

### 4. La app te dice cuándo pasar

Al terminar una ronda completa de Marca el 1, encima del resumen aparece una
sola frase: «Vas bien. Otra vez.» o «Ya puedes probar con menos ayuda: Assist»,
«… Train», «… más rápido: Intermedio», o «Ya puedes pasar al siguiente nivel».

Criterio inicial, ajustable con la práctica real, en `src/lib/readiness.ts`:

- una ronda es **buena** si tuvo al menos 8 oportunidades y
  `(clavadas + cerca) / (oportunidades + repetidas + fuera de objetivo)` alcanza
  el 80 % (mismo denominador que Challenge);
- solo cuentan rondas desde 0:00 hasta el final. Practicar un fragmento, reanudar
  tras recargar o cambiar ayudas/velocidad a mitad permite practicar, pero no
  acredita una ronda completa; pausa y continuación sí conservan la ronda;
- se sugiere avanzar cuando **3 de las últimas 5 rondas** del mismo nivel, ayuda
  y velocidad son buenas;
- el orden sugerido es el del recorrido existente: Teach → Assist → Train en
  Despacio, después Intermedio y Original, después el siguiente nivel.

Las rondas se guardan por nivel, ayuda y velocidad en `blueclue-rounds-v2`
(últimas cinco de cada combinación). Las rondas provisionales (referencias sin
validar) y las de Challenge no cuentan. Es una sugerencia: nada se bloquea.
El historial v1 no se importa porque no permite comprobar pulsaciones adicionales
ni rondas completas. No se borran la sesión, los intentos ni los récords anteriores.

### 5. Diagnóstico de latencia (oculto)

Pantalla `#latencia`, sin enlace en los menús, documentada aquí y en MOBILE.md.
Reproduce doce clics a 60 por minuto con Web Audio y pide tocar el botón grande
con cada clic. Al terminar muestra:

- desvío mediano y medio respecto al clic más cercano, en milisegundos.
  Solo se admite el primer toque válido por clic; los dos primeros clics son
  de preparación y quedan fuera. Como máximo quedan diez muestras;
- dispersión (rango entre el cuartil 1 y el 3);
- lo que informa el navegador sobre su salida de audio (`baseLatency` y
  `outputLatency`), cuando lo informa;
- cuántos toques se descartaron por preparación, repetición o por quedar a más
  de 300 ms de cualquier clic. Con menos de cuatro clics útiles pide repetir.

No corrige nada. Juan lo ejecuta tres veces en su iPhone con sus auriculares.
Un desvío consistente (misma señal y dentro de ±40 ms entre ejecuciones) es
un dato exploratorio, no una medida aislada de la latencia del dispositivo:
incluye la respuesta humana y utiliza Web Audio, mientras el ejercicio usa
MediaElement. Antes de plantear compensación hay que validar el desfase en el
mismo recorrido de reproducción del ejercicio. Motor en
`src/lib/latencyDiagnostic.ts`, con tests de estadística; la pantalla no calcula.

### 6. Variantes de escucha

`scripts/create-listening-variants.mjs` genera, en `.local/variants/`, cuatro
variantes por práctica (bajo, percusión, elección) con el mismo sintetizador:
cambian los tiempos de entrada y salida, el orden de los instrumentos, si el
bajo está presente al principio y su presencia. Ninguna repite los tiempos de la
muestra aprobada. Juan las escucha; `--publish <id>` copia solo las aceptadas a
`public/tracks/listening/variants/` y las registra en `data/listening/variants.json`.

En la app, cada práctica de escucha tiene una lista de muestras: la aprobada más
las variantes publicadas. «Practicar otra vez» cambia a otra muestra, sin repetir
la inmediata; «▶ Repetir» conserva la misma. Con una sola muestra publicada, ambos
botones hacen lo de siempre. Selección en `src/lib/listeningVariants.ts`.

Se da por bueno cuando Juan reconoce el instrumento en una muestra que no ha
practicado.

#### Aceptación auditiva y subida a GitHub — 8 octubre 2026

Juan confirma por escucha estas cinco muestras y autoriza subir el desarrollo:

| Muestra | Práctica | Estado |
| --- | --- | --- |
| `choice-variant-b` | Bajo o batería | Aceptada |
| `percussion-variant-b` | Percusión | Aceptada |
| `bass-variant-b` | Bajo | Aceptada |
| `choice-variant-c` | Bajo o batería | Aceptada |
| `percussion-variant-c` | Percusión | Aceptada |

Se incorporan sus WAV sintéticos y referencias al catálogo de la rama. Las siete
restantes (`bass-variant-c/d/e`, `percussion-variant-d/e`, `choice-variant-d/e`)
permanecen locales, pendientes de escucha. La aceptación confirma claridad de
esas muestras, no certifica aprendizaje ni latencia. Subir a GitHub no despliega
automáticamente en el VPS ni implica fusionar esta rama con `main`.

## Qué no entra

- Música real, Essentia, anatomía de canción, dos decks, FLX4, cuentas, nube.
- Compensar la latencia.
- Publicar variantes sin escucharlas.
- Quitar los conteos 8/16/32 ni cambiar sus datos.

## Criterio de terminado

1. Alguien abre la app, pulsa «Empieza aquí» y sabe qué hacer sin leer nada más.
2. Distingue bombo, caja, charles y bajo en «¿Cuál suena?» con seis de ocho.
3. En Marca el 1 ve una frase que le dice si repetir o avanzar.
4. No aparece «BPM», «vista ampliada» ni «downbeat» en la pantalla del móvil.
5. `#latencia` da un número repetible en el iPhone de Juan.
6. Existen variantes de escucha para que Juan las oiga, sin publicar.
7. Todos los tests pasan; la descarga offline incluye los cuatro sonidos.

## Comprobación

Validación local del 8 octubre sobre `1339dba`: 166 pruebas pasan y compilación
pública correcta. Recorrido móvil, juego completo, reanudación interna,
resumen de ronda, diagnóstico sin respuestas y los cuatro sonidos offline
comprobados en Edge de escritorio con perfil temporal. Detalle en
[validación móvil](MOBILE.md#validación-local-de-empieza-aquí--8-octubre-2026).
En esa comprobación las doce variantes estaban solo en local. Posteriormente
se aceptaron las cinco enumeradas arriba; las siete restantes siguen pendientes.

- `npm test`, `npm run build`.
- Navegador a 375 × 667: portada, Paso 0 completo, una ronda de Nivel 1 con su
  frase de avance, `#latencia` con doce clics.
- Pendiente de Juan: iPhone físico, auriculares, tres medidas de latencia y
  escuchar las siete variantes restantes.
