# Operación ligera — BlueClue

Estado registrado el 3 de octubre de 2026.

## Decisión del propietario

BlueClue es una app de bolsillo. Conserva el orden y la estructura JRGB sin
replicar el protocolo enterprise completo. No añadir BD, autenticación, Redis,
workers ni servicios de monitorización propios por obligación de plantilla.

El Beat Trainer funciona en local. La PWA/offline y la prueba en iPhone físico
siguen pendientes. No hay despliegue ni monitorización de BlueClue verificados.

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
| VPS | Servidor 2 previsto, pendiente comprobación real |
| Directorio | `/opt/apps/blueclue` previsto |
| Contenedor | `blueclue-web` previsto |
| Bind | `127.0.0.1:3280:3000` previsto; nunca puerto público directo |
| Dominio | `blueclue.jrgblanco.com` propuesto; sin DNS/HTTPS configurados |

La reserva no abre puertos ni certifica que estén libres en el sistema operativo.
Antes del despliegue hay que comprobar listeners, contenedores y capacidad real.
La autenticación SSH desde este PC falló; no se cambiaron los servidores.

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

1. Confirmar acceso SSH autorizado y puertos/capacidad reales.
2. Decidir catálogo móvil: demo o acceso privado autorizado. No subir los audios
   privados por defecto; conservar las exclusiones de Git y del futuro empaquetado.
3. Implementar PWA, descarga y recuperación offline; probar Safari en un iPhone
   físico, modo avión, vuelta del segundo plano y conservación de progreso.
4. Construir la imagen fuera del VPS de 1 vCPU y desplegar un solo servicio con
   versión identificable y procedimiento de rollback.
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
