# BlueClue de bolsillo — PWA

## Alcance

El mismo Beat Trainer, sin módulos nuevos: instalación en pantalla de inicio,
controles táctiles, descarga voluntaria de app y cinco pistas, progreso local.
No es una app de la App Store ni añade cuentas, sincronización o una biblioteca.
Decisión del propietario: despliegue público con los cinco patrones sintéticos.
Tailscale se usa solo para administrar el VPS, no para acceder como alumno.

## Instalación

1. Abrir la dirección HTTPS en Safari del iPhone.
2. Compartir → Añadir a pantalla de inicio; activar Abrir como app si se muestra.
3. Abrir BlueClue desde el icono, no continuar en la pestaña de Safari.
4. Desplegar «BlueClue en tu bolsillo» y descargar las cinco pistas con Wi-Fi.
5. Esperar «5 pistas disponibles sin conexión» antes de cambiar de app.
6. Activar modo avión, cerrar y abrir BlueClue y comprobar cada pista.

El almacenamiento de Safari puede ser distinto del de la app instalada. El progreso
se guarda en ese navegador/dispositivo y no viaja desde el ordenador. iOS puede
eliminar datos por presión de almacenamiento; se solicita persistencia sin prometerla.
Eliminar la descarga libera solo cachés BlueClue, nunca el progreso de ejercicios.

## Diseño técnico

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
53 tests incluyen scoring, entrada y diez casos del worker (rangos, atomicidad,
fallos de descarga, pérdida de caché, navegación offline y separación de versiones).

Antes de declarar móvil terminado, probar en el iPhone real:

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
