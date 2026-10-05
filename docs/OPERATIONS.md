# Operación ligera — BlueClue

Estado actualizado el 5 de octubre de 2026.

## V0.2 — treinta y dos compases, publicada el 5 de octubre de 2026

- Release `86f6473`; motor y audios `8ed68ed`. 100 tests locales pasan; Linux
  98 pasan y dos privados omitidos. Builds correctos; commits locales, sin push.
- Cinco WAV/JSON originales intactos. Cinco versiones sintéticas de 36 compases
  exclusivas de 32, 17.715.324 bytes adicionales. Audio público total 29.849.014
  bytes; diez archivos. Paquete completo medido en navegador local: 30,6 MB.
- Entrada, cuatro grupos de ocho, una oportunidad final, replay y navegación
  16/32 comprobados. Práctica 320 × 568 sin scroll. Web pública 375 × 667:
  guía, reproducción y pausa verificadas. Ajustes/resultado de 32 separados.
- Descarga actualizada desde el paquete anterior. Servidor temporal apagado:
  pestaña nueva abre 32 y carga/inicia los cinco audios largos. No se escucharon
  completos offline; no equivale a una prueba física de Safari/iPhone.
- HTTPS `/health`: ok/demo/86f6473. Docker healthy, solo 127.0.0.1:3280:3000;
  imagen sin `.local` ni `public/tracks/local-pilot`. Checks BlueClue y
  BlueClue-HTTP up. Sin tocar proxy, otros proyectos ni límites de recursos.
- `current` → `86f6473`, rollback `3c180d2`. Notion principal, Desarrollo e
  infraestructura actualizados. Actualizar descarga con conexión antes de salir.
  Aceptación pedagógica pendiente; no se implementa detección de frases reales.

## V0.2 — dieciséis compases, publicada el 5 de octubre de 2026

- Release `3c180d2`, implementación `ddb9ae0`. 92 pruebas locales pasan;
  Linux 90 pasan y dos privadas omitidas, cero fallos. Builds correctos, sin push.
- Una vuelta de dieciséis, no dos de ocho; la mitad no es un objetivo. Mismos
  cinco audios, entrada y velocidades. Guía móvil 1–8/9–16, replay completo,
  almacenamiento independiente; volver a ocho conserva sus ajustes y resultado.
- Ronda, pausa, toque lejano, replay y navegación comprobados en navegador.
  Pantalla 320 × 568 sin scroll, también revisada a 375 × 667. Descarga local
  de 12,9 MB: pestaña nueva con servidor 3001 apagado reproduce Pulso claro en
  `/#compases-16`. Otras cuatro pistas offline no repetidas en esta entrega.
- Docker healthy, HTTPS `/health` ok/demo/3c180d2, único bind 127.0.0.1:3280;
  imagen sin `.local` ni audio privado. Checks BlueClue y BlueClue-HTTP up.
  Sin nuevos servicios, puertos, cambios de proxy ni reinicios de otros proyectos.
- `current` apunta a `3c180d2`; rollback conservado a `27e0ce1`. Actualizar la
  descarga antes de salir. Safari físico y aceptación pedagógica pendientes.
- Web pública a 375 × 667: reproducción, cierre con una oportunidad sin marcar
  al no pulsar, replay y pausa verificados. Notion principal, Desarrollo e
  infraestructura actualizados, sin alterar la reserva ni páginas hijas.

## V0.2 inicial — publicada el 5 de octubre de 2026

- Commits `1777dfe` (motor de ocho compases) y `abb5124` (interfaz).
  84 pruebas locales pasan y build correcto. No se ha hecho push.
- Preparación, pausa, dos vueltas completas, Teach/Train y revisión guiada
  comprobados en navegador; la revisión mantiene el resumen sin nuevos intentos.
  Práctica sin scroll a 320 × 568 y 375 × 667, conservando Ajustes separados.
- Descarga local completa: 12,9 MB. Tras apagar el servidor temporal 3001,
  una pestaña nueva abre `/#compases` y reproduce las cinco pistas sintéticas.
  No equivale a prueba física de Safari/iPhone ni a aceptación pedagógica.
- Acceso desde Ajustes sin mover el Challenge del final. Los tres niveles,
  historial y récords de V0.1 no cambian. Última ronda de compases por separado.
- Acceso Tailscale recuperado. Release `27e0ce1` construida y activada en VPS2;
  Linux: 82 pruebas pasan y dos privadas omitidas, cero fallos. Build correcto.
- HTTPS `/health`: `ok`, catálogo `demo`, revisión `27e0ce1`. Docker healthy,
  único bind `127.0.0.1:3280:3000`; checks existentes BlueClue y BlueClue-HTTP up.
  Imagen comprobada sin `.local` ni `public/tracks/local-pilot`.
- Sin nuevos puertos, cambios de proxy ni reinicios de otros proyectos. Mismos
  límites de recursos. `current` apunta a la nueva release; rollback a `44bc713`.
- Acceso público: `https://blueclue.jrgblanco.com/#compases`. Actualizar la
  descarga desde Ajustes del Beat Trainer antes de practicar sin conexión.
  Guía, reproducción y pausa verificadas en producción a 375 × 667.
  Notion principal, Desarrollo y catálogo de infraestructura actualizados.
  Pendiente: prueba pedagógica de Juan y validación física de esta entrega en iPhone.

## Decisión del propietario

BlueClue es una app de bolsillo. Conserva el orden y la estructura JRGB sin
replicar el protocolo enterprise completo. No añadir BD, autenticación, Redis,
workers ni servicios de monitorización propios por obligación de plantilla.

El Beat Trainer y la PWA/offline están implementados. Se comprobaron arranque desde
una pestaña nueva y cinco pistas con el servidor local apagado. El 4 octubre Juan
comunica que ha probado todo, incluido modo avión, en el contexto de su iPhone;
aceptación de la versión previa al Challenge, sin medición de latencia Bluetooth.
El propietario eligió **web pública con los cinco patrones sintéticos**. Tailscale
es acceso administrativo al VPS, no un requisito para los alumnos.

## Registro canónico

- [Cuaderno BlueClue — Apps / Personales](https://app.notion.com/p/3ee7981f08ef81bb8224c794d8ad607f)
- [Catálogo de infraestructura](https://app.notion.com/p/3217981f08ef81828e31edfcc9b78414)
- [Manifiesto SDD-JRGB](https://app.notion.com/p/2f67981f08ef81649634eb77d65a0c48)

El cuaderno tiene Documentación, Diseño, Desarrollo y Recursos. ADR-001 registra
la excepción ligera autorizada; no modifica las plantillas maestras.

## Reserva administrativa

| Elemento | Reserva / estado |
| --- | --- |
| Offset | +280, reservado en Notion; siguiente libre +290 |
| Web | 3280, único servicio previsto |
| API | 4280 sin uso |
| Internos | 5280 sin uso |
| Datos | 6280–6289 sin uso; no hay BD |
| VPS | Servidor 2, comprobado por Tailscale |
| Directorio | `/opt/apps/blueclue`, release `86f6473`, enlace `current` |
| Contenedor | `blueclue-web`, imagen `blueclue:86f6473`, healthy |
| Bind | `127.0.0.1:3280:3000` verificado; nunca puerto público directo |
| Dominio | `https://blueclue.jrgblanco.com`, HTTPS verificado |

El 3 de octubre se verificó SSH por Tailscale en `srs-staging` (100.110.52.21),
hostname `srv1369522`. Antes de desplegar: 3911 MiB RAM total, 2320 MiB disponible,
27 GB libres en disco y puertos reservados sin listeners. El fallo anterior de SSH
por IP pública no bloquea esta ruta autorizada. Se conserva verificación de host.

## Peso medido

Desde `f82ed1f`, los cinco WAV públicos ocupan 12.133.690 bytes (12,13 MB),
con 24 compases por pista y 51–62 segundos al tempo original. Las mediciones
del 3 de octubre que siguen son históricas, anteriores a ampliar los audios.

Medición local del 3 de octubre, MB decimales, sin compresión HTTP:

| Archivos | Bytes | MB |
| --- | ---: | ---: |
| `.next/static` | 655260 | 0,66 |
| Cinco WAV demo | 4691516 | 4,69 |
| Cinco WAV privados | 64843584 | 64,84 |

No representan el consumo de RAM, la imagen Docker ni el tamaño final instalado
de la PWA. La medición web no incluye HTML, runtime ni futuros componentes PWA.

## Puerta de despliegue

1. Acceso y reserva comprobados; volver a comprobar antes de cada despliegue.
2. Catálogo público confirmado: demo. No subir `.local` ni los audios privados.
3. PWA y offline comprobados en escritorio. Probar Safari en un iPhone físico,
   modo avión, vuelta del segundo plano y conservación de progreso.
4. Preferir construir fuera del VPS. Sin Docker local, la alternativa acotada
   `ops/build-image.sh` usa un contenedor efímero de 0,6 CPU / 1400 MiB, un worker
   Next y pruebas antes de generar la imagen. El contenedor se elimina al terminar.
5. Configurar DNS, Nginx y HTTPS; no publicar los puertos internos ni cambiar
   reglas de otros proyectos.
6. Añadir `/health`, healthcheck del contenedor, límites y rotación de logs.
7. Registrar en `/opt/scripts/healthcheck.sh` la entrada prevista
   `BlueClue|blueclue-web|docker`, revisando primero el formato vigente.
8. Registrar el proyecto en SA99 InfraService, servidor interno `vps-staging`,
   proyecto `BlueClue`, contenedor `blueclue-web`; reflejarlo también en
   `SEED_SERVERS` para no perderlo tras un reinicio. Dominio tras confirmarlo.
9. Verificar una ejecución real del healthcheck, HTTPS y el panel SA99 tras
   escaneo. Solo entonces registrar monitorización activa y estado LIVE en Notion.

No activar una falsa alarma de caída de un servicio todavía inexistente.
Reutilizar healthcheck y SA99; no introducir una plataforma adicional.
El progreso es local al dispositivo: no hay sincronización ordenador/iPhone
ni respaldo de una base de datos de usuarios.

## Release reproducible y rollback

La publicación se prepara con `git archive HEAD`: solo archivos versionados.
`.dockerignore` y `ops/build-image.sh` impiden incluir el catálogo privado.
Las imágenes llevan el hash del commit; no se publica `latest`.

En un equipo con Docker, `docker build --build-arg APP_REVISION=<commit> -t
blueclue:<commit> .` compila la imagen completa. En el VPS, extraer el archivo de
release dentro de `/opt/apps/blueclue/releases/<commit>` y ejecutar:

```bash
bash ops/build-image.sh <commit>
BLUECLUE_IMAGE=blueclue:<commit> docker compose -p blueclue up -d --wait
curl --fail http://127.0.0.1:3280/health
```

El servicio usa usuario `node`, filesystem de solo lectura, tmpfs limitado,
512 MiB RAM, 0,5 CPU y logs rotados. `/health` comprueba catálogo y manifiesto;
no devuelve rutas privadas ni credenciales. Solo se publica por proxy HTTPS.

Rollback: conservar la última imagen saludable y su directorio; desde esa release,
repetir `BLUECLUE_IMAGE=blueclue:<commit-anterior> docker compose -p blueclue up -d
--wait`. Comprobar `/health` y HTTPS antes de cambiar el enlace `current`. No usar
las imágenes fallidas `c0cf7f5` ni `e70ef0f` como rollback. Para la primera entrega,
si no existe otra versión saludable, detener únicamente `blueclue-web` y retirar
solo su vhost; nunca ejecutar una limpieza global de Docker.

`ops/blueclue.nginx.conf` es la base HTTP para emitir el certificado del dominio.
No declarar la PWA accesible por iPhone hasta tener DNS y HTTPS válidos.
`ops/register-monitor.py` añade exclusivamente BlueClue (contenedor y `/health`)
al monitor existente después de comprobar salud, guarda backup y valida Bash.
`ops/register-sa99.py` añade solo `projects.BlueClue` en `vps-staging` y actualiza
el seed del host para futuras imágenes de SA99, sin reiniciar ese servicio.

## Despliegue verificado — 3 octubre 2026

- [Web pública](https://blueclue.jrgblanco.com) y `/health` verificados desde fuera
  del VPS; catálogo `demo`, revisión `6860fd1`. HTTP redirige a HTTPS.
- Certificado emitido hasta 1 enero 2027 y `certbot.timer` activo.
- Imagen sin `.local` ni `public/tracks/local-pilot`; música privada no transferida.
- Cinco pistas verificadas reproduciendo por HTTPS. Paquete descargado completo
  aproximado **5,4 MB** (app + cinco sintéticas), no 65 MB del piloto privado.
- Esa misma release reabre desde pestaña nueva y reproduce las cinco pistas con
  el túnel de prueba cerrado, sin acceso al servidor. El servicio público no se apagó.
- Cron existente de las 21:45 UTC: `BlueClue=up` y `BlueClue-HTTP=up`.
- SA99: registro Mongo acotado, seed del host guardado y escaneo `online` con
  `blueclue-web` healthy. Sin reiniciar SA99; panel visual no inspeccionado.
- Runtime observado: **36,63 MiB RAM en reposo**. Imagen: **297.821.337 bytes**.
- Compilación Linux completada; 51 tests pasan, 2 privados omitidos por diseño.
  En local pasan los 53. Git guarda commits locales; no se hizo push.
- Pendientes: instalación y pruebas en iPhone físico, validación pedagógica y
  revisión auditiva de referencias privadas. Web LIVE no significa V0.1 terminada.

Durante el primer empaquetado, el healthcheck detectó un manifiesto offline mal
copiado y evitó declarar la release saludable. Se corrigió antes de habilitar el
vhost público; `6860fd1` es la primera release saludable, no las imágenes anteriores.

## Prueba de salida

### Challenge como último paso — 4 octubre 2026

- Release `44bc713`, solicitada por Juan: panel único al final, tras práctica,
  repetición y continuación. En móvil queda al final de Ajustes/resumen y oculto
  en Práctica. Sin cambios de scoring, récords, catálogo ni requisitos de acceso.
- 76 tests locales pasan; Linux 74 pasan y dos privados omitidos. Build correcto.
  Navegador: posición inferior a ambas tarjetas en escritorio, tras el botón
  de volver a practicar en Ajustes y tras la navegación del resumen. Challenge
  sigue arrancando en Train, 0:00, pausado. Sin overflow a 320 px.
- HTTPS /health confirma ok, demo, `44bc713`; Docker healthy, único listener
  127.0.0.1:3280, sin música privada y checks existentes en verde. Rollback
  `c252759`. Notion actualizado. Sin push ni nueva prueba física de modo avión.
- Actualizar la descarga del iPhone para conservar el nuevo orden offline.

### Continuidad y feedback por nivel — 4 octubre 2026

- Release `c252759`: pausar/continuar conserva el feedback. Enter se registra al
  bajar la tecla y mantenerlo no añade intentos; Espacio sigue iniciando/pausando.
- Registro de ronda y feedback comparten una única evaluación. Replay y resumen
  de Nivel 1 hablan del pulso, no de marcar solo el 1. Sin cambios de tolerancias,
  catálogo, niveles, récords guardados ni infraestructura.
- 74 tests locales pasan; Linux 72 pasan y dos privados omitidos. Build correcto.
  Navegador: un Enter produce un único cerca de +155 ms, conservado tras pausa
  y reflejado en resumen/replay; Espacio pausa conservando un clavado de -31 ms.
  Vista 375 × 667 comprobada; a 320 px no hay desbordamiento horizontal.
- HTTPS `/health` confirma `c252759`, ok y demo. Contenedor healthy, único bind
  127.0.0.1:3280, imagen sin audio privado; checks existentes en verde. Rollback
  conservado a `86d6910`. Sin reiniciar otros proyectos. Compilación y pruebas
  locales no sustituyen la nueva ronda de Juan en su iPhone.
- Para llevar la mejora offline: recargar con conexión y Actualizar descarga.
  No se ha vuelto a probar modo avión de esta release. Commits locales sin push.

### Challenge y corrección de aciertos — 4 octubre 2026

- Release `86d6910`: Challenge completo en Train a la velocidad elegida,
  récords locales comparables y orientación de avance sin bloquear niveles.
- Corregido el toque alejado que ocupaba el siguiente 1: solo el primer toque
  dentro de ±450 ms reales ocupa un objetivo. REPETIDA conserva en pantalla el
  resultado del resumen; toques alejados se separan de duplicados. Tolerancias
  sin ampliar. Challenge descuenta el efecto de pulsar de más en su porcentaje.
- 67 tests locales pasan; Linux 65 pasan y dos privados omitidos. Builds correctos.
  Regresión de toque lejano seguido de +167 ms: cuenta cerca, no queda bloqueado.
- Navegador local: REPETIDA con -300 ms coincide con el objetivo del resumen;
  6 repetidas y 17 alejadas aparecen separadas. Challenge completo sin pulsar:
  22 oportunidades, 22 sin marcar, 0 %, récord conservado tras recargar. Cierre
  prematuro sin récord y cambio de pista comprobados. No se inyectan récords
  artificiales en el origen público.
- HTTPS `/health`: ok, demo, revisión `86d6910`; Docker healthy, único bind
  `127.0.0.1:3280`. Imagen sin `.local` ni música privada. Checks existentes
  BlueClue y BlueClue-HTTP en verde. Sin cambios de proxy ni otros servicios.
- Descarga pública actualizada desde la interfaz: app y cinco pistas, 12,9 MB.
  No se ha repetido la apertura sin red de esta release; Juan comunica aceptación
  de la anterior en modo avión. Falta su primera ronda con el scoring corregido
  y Challenge; las referencias privadas siguen pendientes de escucha.
- Rollback conservado a `468ce36`. Cuaderno e infraestructura de Notion
  actualizados; commits locales, sin push.

### Paletas por nivel — 4 octubre 2026

- Release `468ce36`: Nivel 1 turquesa, Nivel 2 azul y Nivel 3 negro/amarillo.
  Color asociado al módulo, nunca a velocidad, ayudas ni dificultad de pista.
  Número y nombre visibles; sin cambios de scoring, audio ni progreso local.
- 57 tests locales; Linux 55 pasan y dos privados omitidos. Incluye pruebas
  de tokens y contraste AA para acentos y texto TAP. Builds correctos.
- Navegador: 27 combinaciones nivel/velocidad/ayudas, Práctica/Ajustes/resumen,
  restauración pausada, anchos 320 y 375 y escritorio. Sin overflow horizontal.
  Producción muestra las tres paletas y reproduce con preparación conservada.
- HTTPS `/health`: `ok`, `demo`, revisión `468ce36`; contenedor healthy,
  bind exclusivo `127.0.0.1:3280`. Imagen sin catálogo ni música privados.
  Checks existentes BlueClue y BlueClue-HTTP en verde; sin tocar otros servicios.
- Rollback conservado a `f82ed1f`. Challenge y récords solo como propuesta.
  iPhone físico y validación pedagógica siguen pendientes; commits sin push.
- Ronda pública completa: 22 oportunidades y 22 sin marcar al no pulsar,
  resumen automático correcto. Sin añadir intentos artificiales al historial.
- Actualizar descarga desde Ajustes confirma cinco pistas disponibles y **12,9 MB**
  (app + audio). Reapertura sin red de esta release no repetida; la prueba offline
  previa pertenece a una release anterior. Safari físico sigue pendiente.

### Actualización móvil — 4 octubre 2026

- Release pública `9a94de7`: práctica compacta, Ajustes y resumen separados.
  La revisión de un fallo permite volver a la misma ronda sin alterar el resultado.
- `/health` por HTTPS: `ok`, `demo`, revisión `9a94de7`; Docker healthy.
  Sigue el único listener `127.0.0.1:3280`. Sin cambios de proxy ni puertos.
- Imagen verificada sin catálogo privado. 53 tests locales; 51 en Linux y dos
  omitidos por ausencia del piloto privado. Compilaciones correctas.
- Validación UI: controles/TAP/feedback juntos a 375 × 667; tamaños 320 × 568,
  390 × 844 y escritorio; ajustes, resumen automático, replay y continuidad.
  Revisar dos fallos conserva las 12 oportunidades de la ronda de prueba.
- Descarga pública actualizada desde Ajustes: app + cinco pistas, 5,4 MB.
  En el iPhone, recargar con conexión y actualizar el paquete desde Ajustes.
- Se conservan `6860fd1` y `1f3918b` para rollback. Notion registra el rediseño;
  instalación, latencia y aceptación pedagógica en iPhone físico siguen pendientes.

### Comprobaciones

Actualización del recorrido: release `22efcbf`, 4 octubre 2026. Teach → Assist →
Train por velocidad antes del siguiente módulo/pista; sin controles nuevos.
54 tests locales; 52 pasan en Linux y dos privados omitidos. Build, HTTPS `/health`
y Docker saludables; catálogo demo, imagen sin música privada y bind 3280 sin
cambios. Verificados avance/retroceso, restauración y retorno a 0:00 pausado en
navegador; producción confirma Teach → Assist despacio. Se conserva `9a94de7`
para rollback. Notion actualizado; aceptación pedagógica/iPhone físico pendiente.

- Confirmar `catalog: demo` y revisión esperada en `/health`.
- Confirmar ausencia de `/app/.local` y `/app/public/tracks/local-pilot` en imagen.
- Verificar cinco descargas, HTTPS, reapertura offline y controles móviles.
- Verificar estado `healthy`, checks BlueClue del cron y escaneo de SA99.
- Registrar pruebas y pendientes del iPhone real en Notion sin marcarlos completados.
