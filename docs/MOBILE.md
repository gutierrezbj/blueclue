# BlueClue de bolsillo — PWA

## Alcance

El mismo Beat Trainer, sin módulos nuevos: instalación en pantalla de inicio,
controles táctiles, descarga voluntaria de app y cinco pistas, progreso local.
No es una app de la App Store ni añade cuentas, sincronización o una biblioteca.
Decisión del propietario: despliegue público con los cinco patrones sintéticos.
Tailscale se usa solo para administrar el VPS, no para acceder como alumno.

Las cinco sintéticas tienen 24 compases cada una (51–62 segundos a velocidad
original). Sus WAV suman 12,13 MB; el paquete añade los recursos de la aplicación.
La descarga se actualiza voluntariamente desde Ajustes y conserva el progreso.

## Instalación

1. Abrir [blueclue.jrgblanco.com](https://blueclue.jrgblanco.com) en Safari del iPhone.
2. Compartir → Añadir a pantalla de inicio; activar Abrir como app si se muestra.
3. Abrir BlueClue desde el icono, no continuar en la pestaña de Safari.
4. Inicio → Marca el 1 → elegir nivel → Ajustes → «BlueClue en tu bolsillo»;
   descargar los ejercicios con Wi-Fi. El paquete actual incluye trece audios.
5. Esperar «Ejercicios disponibles sin conexión» antes de cambiar de app.
6. Activar modo avión, cerrar y abrir BlueClue y comprobar cada pista.

El almacenamiento de Safari puede ser distinto del de la app instalada. El progreso
se guarda en ese navegador/dispositivo y no viaja desde el ordenador. iOS puede
eliminar datos por presión de almacenamiento; se solicita persistencia sin prometerla.
Eliminar la descarga libera solo cachés BlueClue, nunca el progreso de ejercicios.

## ¿Bajo o batería? — comprobación local del 7 octubre

- Tercer botón en Escucha el cambio. Menú y reconocimiento con dos botones
  grandes caben a 320 × 568, sin desplazamiento horizontal ni vertical.
- Se comprobó una ronda con una respuesta confundida, una reconocida y dos
  omitidas; intentar ambos botones en la primera entrada cuenta un adicional,
  no corrige el fallo. Enter, click y Espacio para pausar sobre BATERÍA funcionan.
- Replay del fallo detiene la reproducción a 9,75 s y conserva el resumen.
  Al volver a entrar, empieza pausado y recupera la última ronda independiente.
- Actualización de doce a trece audios: 34,1 MB con app; 33.333.046 bytes de
  audio. Pestaña nueva con servidor local apagado reproduce los 32 segundos
  completos y permite pasar de Escuchar a Reconocer desde la descarga.
- Esta comprobación usa el navegador de escritorio con tamaño móvil. Falta
  probar esta nueva práctica en Safari/iPhone físico y validar su utilidad por oído.

## Diseño técnico

### Inicio por bloques — 6 octubre 2026

- Portada aprobada: dos botones grandes, Marca el 1 y Escucha el cambio. Sin
  casillas futuras, porcentajes inventados ni requisitos de desbloqueo.
- Marca el 1 abre tres niveles grandes con sus colores; Escucha el cambio abre
  la práctica del bajo. «Inicio» vuelve a la portada; «Niveles» vuelve al selector.
- Los menús no montan reproductores. Elegir un ejercicio nunca inicia audio.
- Reentrar al mismo nivel conserva sesión pausada. Elegir otro reinicia en
  Teach/Despacio, sin borrar historial ni cambiar la pista elegida.
- Ajustes y descarga siguen dentro del Beat Trainer; Challenge permanece al final.
- Hashes de menú y niveles funcionan con Atrás/Adelante; se conservan los enlaces
  antiguos a práctica, bajo y conteos opcionales. No se modifica el scoring.

### Navegación móvil compacta

- Tras elegir nivel aparece la práctica: ejercicio actual, onda, Play/Pausa,
  Reiniciar, guía, botón grande y feedback breve. La portada no invade el ejercicio.
- Ajustes pausa el audio y reúne pista, módulo, velocidad, Teach/Assist/Train e
  instalación/descarga. Volver a practicar no arranca música por sorpresa.
- «Ver mi ronda» abre un resumen separado; también aparece al terminar. Desde él
  se puede repetir, revisar un intento o avanzar al siguiente paso. «Volver a mi
  ronda» permite revisar otro fallo sin recortar las oportunidades ya escuchadas.
- El audio permanece montado al cambiar de pantalla; la onda recupera su posición
  al volver. El progreso y los tiempos de preparación no cambian.
- Controles de al menos 44 px, zona segura y onda adaptada a la altura disponible.
  En pantallas muy pequeñas se permite desplazamiento, nunca se recortan controles.
- El escritorio conserva su vista completa. No se añaden módulos ni gamificación.

### Continuidad del aprendizaje

«Continuar» en el resumen retira ayudas antes de subir el tempo: Teach → Assist →
Train en Despacio, después Intermedio y Original. Al completar esas combinaciones,
propone el siguiente módulo y luego la siguiente pista, desde Teach y Despacio.
Cada paso comienza pausado en 0:00; Play repite la preparación completa. «Anterior»
recorre el mismo orden al revés. La elección libre desde Ajustes sigue disponible;
no hay bloqueos, notas mínimas ni obligación de recorrer todas las combinaciones.

Comprobado: Teach → Assist → Train despacio, transición a Teach intermedio,
restauración tras recargar, anterior y salto de Train original al siguiente módulo
en Teach despacio. La prueba automática recorre las 135 combinaciones existentes
en ambos sentidos; no representa 135 lecciones nuevas ni certifica aprendizaje.

### Audio y disponibilidad offline

- `trainingCatalog.ts`: catálogo vigente, revisión de metadatos/tamaño/mtime de los
  archivos y URLs de audio versionadas. No cambiar contenidos conservando tamaño y
  mtime: regenerar el piloto o reconstruir el despliegue para invalidar su revisión.
- `build-offline-assets.mjs`: inventario completo de recursos compilados tras build.
- `PocketMode`: registro del worker, descarga solicitada, progreso, errores y estado.
- `sw.js`: descarga a caché nueva, confirma HTML/catálogo y cinco audios completos,
  y solo entonces cambia la referencia activa. Conserva el paquete anterior si falla.
- Navegación: red primero con tiempo límite y HTML guardado como alternativa; no
  confundir peticiones RSC con navegación. Recursos y audios versionados desde caché.
- Audio: respuesta 206 para Range, incluido `bytes=0-1` y sufijos; 416 fuera de rango.
- Al volver a primer plano se revisa que el paquete conserve todos sus recursos.
- Cada descarga es del catálogo activo, nunca de los dos catálogos ni de todo Drive.
- Pausar al ocultarse evita seguir evaluando mientras el alumno atiende otra cosa.

Una descarga puede necesitar espacio temporal para la versión anterior y la nueva.
El guardado ocurre por recurso: cerrar la app durante una descarga puede interrumpirla;
hay que reintentar, no existe descarga de fondo garantizada.

## Pruebas hechas y pendientes

Comprobado en navegador de escritorio con servidor local apagado: arranque desde
una pestaña nueva, hidratación, cinco pistas reproduciendo, waveform, velocidad,
TAP y Enter sin doble registro, resumen provisional y restauración del ejercicio.
Vista 375 px: contador, controles y TAP visibles juntos y sin desbordamiento horizontal.
Rediseño compacto del 4 octubre: práctica y feedback comprobados sin scroll a
375 × 667; vistas adicionales a 390 × 844 y 320 × 568. El tamaño pequeño mantiene
TAP y feedback accesibles y permite un desplazamiento breve para el resto.
Probados Ajustes (pausa y retorno), velocidad, módulos, Train, reinicio, resumen
automático al terminar y replay. La descarga pública anterior a ampliar las pistas
ocupaba 5,4 MB; ya no corresponde al tamaño del paquete musical ampliado.
76 tests incluyen ubicación final del Challenge, récords, selección del primer toque válido, Enter sin autorrepetición, contraste de paletas, scoring, recorrido, entrada y diez casos del worker (rangos, atomicidad,
fallos de descarga, pérdida de caché, navegación offline y separación de versiones).

### Aceptación comunicada por Juan — 4 octubre 2026

Juan comunica que ha probado todo y funciona bien, incluido modo avión, en el
contexto del uso en su iPhone. Se registra como aceptación de la versión pública
anterior al Challenge, no como una comprobación instrumentada de cada escenario
ni de latencia Bluetooth. La corrección de aciertos y el nuevo Challenge requieren
otra ronda suya después de actualizar la descarga.

Las comprobaciones específicas siguientes quedan como checklist detallado, sin
atribuir al usuario mediciones que no ha comunicado:

Actualización visual `468ce36`: número y nombre de nivel también en móvil;
turquesa en Pulso, azul en Cuenta, negro/amarillo en Encuentra el 1. Verificadas
27 combinaciones de nivel/velocidad/ayudas: el color no cambia con estas últimas.
Práctica, Ajustes y resumen mantienen la identidad, sin controles adicionales.
Restauración pausada y anchos 320/375 comprobados en navegador. En producción,
ronda completa de 22 oportunidades y actualización del paquete comprobadas:
cinco pistas disponibles, 12,9 MB descargados. No se repitió la reapertura sin red
para esta release; las pruebas offline anteriores no sustituyen Safari físico.

- [ ] Instalación desde Safari e icono correcto.
- [ ] Descargar dentro de la app instalada y arrancar en modo avión.
- [ ] Reproducir las cinco pistas y todos los tempos; reinicio y replay.
- [ ] Contador sincronizado y un intento por toque, sin retardo apreciable con altavoz.
- [ ] Bloquear/desbloquear, cambiar de app y volver: pausa y continuidad correcta.
- [ ] Recargar/restaurar progreso sin reproducción automática.
- [ ] Girar pantalla, zoom y zona segura sin ocultar TAP ni navegación.
- [ ] Fallo de red o espacio: aviso claro y posibilidad de reintentar.
- [ ] Actualizar paquete sin perder el punto de práctica ni los intentos.
- [ ] Validación humana: reconocer el 1 de otra pista sin depender de las marcas.

Las pruebas de tamaño de ventana no emulan Safari ni certifican un iPhone.

## Primer paso V0.2 — 5 octubre 2026

Release `27e0ce1`: Ajustes → Siguiente etapa → Cuenta 8 compases, o acceso directo
a `/#compases`. Pantalla separada, sin añadir scroll al entrenamiento anterior.
84 pruebas locales; Linux 82 pasan y dos privadas omitidas. Preparación, pausa,
Teach/Train, ronda completa y replay sin alterar el resultado comprobados en
navegador. Práctica a 320 × 568 y 375 × 667 sin scroll. Paquete local de 12,9 MB,
reapertura desde pestaña nueva con el servidor apagado y cinco pistas reproduciendo.
Actualiza la descarga dentro de la PWA antes de salir. HTTPS y Docker saludables;
la aceptación pedagógica y Safari en iPhone físico siguen pendientes.

## Percusión — 7 octubre 2026

Release `c84b7d5`: Inicio → Escucha el cambio → Escucha la percusión. Segunda
tarjeta grande y práctica breve con el audio de 24 segundos aceptado por Juan.
Menú y Reconocer caben sin desplazamiento a 320 × 568; guía, TAP, pausa, resumen
y replay comprobados. No arranca música al entrar o cambiar de ejercicio.

Actualizar la descarga dentro de la PWA: paquete local de 32,7 MB, doce audios.
Servidor temporal apagado y pestaña nueva: abre percusión y reproduce los
24 segundos completos hasta el resumen. Motor offline también prueba actualización
interrumpida sin perder el paquete anterior y rangos de audio. No se repite la
escucha de los once audios anteriores ni se certifica Safari en iPhone físico.

## Referencias técnicas

Tercer paso V0.2 (5 octubre): release `86f6473`, `/#compases-32`. Grupos de ocho
hasta 32, una vuelta larga, misma entrada. Cinco versiones largas independientes
de los audios anteriores. 100 tests locales; Linux 98 pasan y dos omitidos.
320 × 568 sin scroll y producción 375 × 667 comprobadas. Descarga local 30,6 MB;
pestaña nueva sin servidor carga e inicia las cinco versiones largas. No se
escuchan completas en esta prueba. Actualizar descarga antes de salir; quedan
validación física en iPhone y prueba pedagógica del nuevo conteo.

Segundo paso V0.2 (5 octubre): release `3c180d2`, acceso `/#compases-16` o
desde el resumen/Ajustes de ocho. Guía 1–8 y 9–16, una vuelta larga, sin nuevos
audios. Práctica a 320 × 568 sin scroll; producción revisada a 375 × 667 con
ronda completa, replay y pausa. 92 tests locales; Linux 90 pasan y dos omitidos.
Descarga local 12,9 MB y reapertura en pestaña nueva sin servidor comprobadas
con Pulso claro. No se repiten las otras cuatro pistas offline en esta entrega.
Actualizar la descarga de la PWA; Safari físico y prueba pedagógica pendientes.

- [Guía PWA de Next.js](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [Instalar una web en iPhone](https://support.apple.com/en-lamr/guide/iphone/iphea86e5236/ios)
- [Almacenamiento de WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/)
- [Separación de datos de apps de inicio](https://webkit.org/blog/14787/webkit-features-in-safari-17-2/)
