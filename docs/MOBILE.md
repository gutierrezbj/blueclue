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
4. Abrir Ajustes → «BlueClue en tu bolsillo» y descargar las cinco pistas con Wi-Fi.
5. Esperar «5 pistas disponibles sin conexión» antes de cambiar de app.
6. Activar modo avión, cerrar y abrir BlueClue y comprobar cada pista.

El almacenamiento de Safari puede ser distinto del de la app instalada. El progreso
se guarda en ese navegador/dispositivo y no viaja desde el ordenador. iOS puede
eliminar datos por presión de almacenamiento; se solicita persistencia sin prometerla.
Eliminar la descarga libera solo cachés BlueClue, nunca el progreso de ejercicios.

## Diseño técnico

### Navegación móvil compacta

- La pantalla inicial es la práctica: ejercicio actual, onda, Play/Pausa, Reiniciar,
  guía, botón grande y feedback breve. Sin portada ni controles duplicados.
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
57 tests incluyen contraste de paletas, scoring, recorrido, entrada y diez casos del worker (rangos, atomicidad,
fallos de descarga, pérdida de caché, navegación offline y separación de versiones).

Antes de declarar móvil terminado, probar en el iPhone real:

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

## Referencias

- [Guía PWA de Next.js](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [Instalar una web en iPhone](https://support.apple.com/en-lamr/guide/iphone/iphea86e5236/ios)
- [Almacenamiento de WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/)
- [Separación de datos de apps de inicio](https://webkit.org/blog/14787/webkit-features-in-safari-17-2/)
