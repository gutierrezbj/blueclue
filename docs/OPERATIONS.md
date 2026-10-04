# Operación ligera — BlueClue

Estado actualizado el 4 de octubre de 2026.

## Decisión del propietario

BlueClue es una app de bolsillo. Conserva el orden y la estructura JRGB sin
replicar el protocolo enterprise completo. No añadir BD, autenticación, Redis,
workers ni servicios de monitorización propios por obligación de plantilla.

El Beat Trainer y la PWA/offline están implementados. Se comprobaron arranque desde
una pestaña nueva y cinco pistas con el servidor local apagado; falta iPhone físico.
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
| Directorio | `/opt/apps/blueclue`, release `22efcbf`, enlace `current` |
| Contenedor | `blueclue-web`, imagen `blueclue:22efcbf`, healthy |
| Bind | `127.0.0.1:3280:3000` verificado; nunca puerto público directo |
| Dominio | `https://blueclue.jrgblanco.com`, HTTPS verificado |

El 3 de octubre se verificó SSH por Tailscale en `srs-staging` (100.110.52.21),
hostname `srv1369522`. Antes de desplegar: 3911 MiB RAM total, 2320 MiB disponible,
27 GB libres en disco y puertos reservados sin listeners. El fallo anterior de SSH
por IP pública no bloquea esta ruta autorizada. Se conserva verificación de host.

## Peso medido

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
