# SRS-BRIDGE.md — Continuidad entre sesiones

## Proyecto
- **Nombre**: BlueClue — Entrenador DJ de bolsillo
- **Repo**: https://github.com/gutierrezbj/blueclue
- **Branch activo**: main
- **Estado**: Produccion (web publica, perfil ligero ADR-001)
- **Sprint actual**: Navegacion de un solo recorrido desplegada (c58a22f); siguiente por acordar (musica real verificada por oido o puente a la FLX4)

## Que es este proyecto (2-3 lineas)
Entrenador interactivo para aprender a pinchar desde cero: escuchar, seguir el pulso, contar 1-2-3-4, encontrar el 1 y reconocer que instrumento entra. Publico objetivo: nivel 0 absoluto. No es software DJ completo; prepara el oido para la controladora FLX4.

## Stack
- **Backend**: Next.js 16 (server rendering y rutas `/health`, `/offline-pack`), sin BD ni cuentas
- **Frontend**: React 19, TypeScript estricto, WaveSurfer.js, Web Audio solo en `#latencia`
- **Infra**: Docker en Servidor 2 (`srs-staging`, Tailscale 100.110.52.21), contenedor `blueclue-web`, bind `127.0.0.1:3280:3000`, Nginx + HTTPS
- **Base de datos**: ninguna; progreso en `localStorage` del dispositivo

## Donde corre
| Entorno | URL/IP | Notas |
|---------|--------|-------|
| Local | http://127.0.0.1:3000 | `npm run dev`; abrir con `localhost` o `127.0.0.1` (ambos permitidos en `next.config.ts`) |
| Produccion | https://blueclue.jrgblanco.com | `/opt/apps/blueclue/releases/<commit>`, enlace `current`, imagen `blueclue:<commit>` |

## Archivos clave
| Archivo | Proposito |
|---------|-----------|
| AGENTS.md | Reglas del proyecto para agentes (equivale a CLAUDE.md) |
| SRS-BRIDGE.md | Este archivo — continuidad entre sesiones |
| docs/MAPA.md | Mapa de construccion: hecho, donde estamos, que falta |
| docs/EMPIEZA-AQUI.md | Especificacion del hito nivel 0 |
| docs/OPERATIONS.md | Registro de despliegues, puerta de despliegue, rollback |
| docs/ARCHITECTURE.md | Capas, motores y claves de almacenamiento |
| ops/build-image.sh | Construccion de la imagen en el VPS (tests incluidos) |

## Como levantar el proyecto
```bash
# Paso 1: npm ci
# Paso 2: npm test   (160+ tests; 2 privados se omiten sin el piloto local)
# Paso 3: npm run dev   y abrir http://127.0.0.1:3000
```

## SDD-SRS
- Manifiesto: https://www.notion.so/2f67981f08ef81649634eb77d65a0c48
- Cuaderno del proyecto: https://app.notion.com/p/3ee7981f08ef81bb8224c794d8ad607f (Desarrollo, Documentacion, Diseno, Recursos)
- Catalogo de infraestructura (offset +280): https://app.notion.com/p/3217981f08ef81828e31edfcc9b78414

## Handoff — Parte de Guardia
> Ultima actualizacion: 2026-10-09

### Que se hizo en la ultima sesion
- Auditoria del repo y especificacion del hito nivel 0 en `docs/EMPIEZA-AQUI.md` (2026-10-08).
- Construido en rama `empieza-aqui`: portada «Empieza aqui / Seguir donde lo deje» (`guidedPath.ts`), Paso 0 «Conoce los sonidos» (`soundQuiz.ts`, `SoundsIntro.tsx`, 4 WAV), frase de avance (`readiness.ts`), `#latencia` (`latencyDiagnostic.ts`), variantes de escucha (`listeningVariants.ts`, `scripts/create-listening-variants.mjs`). Commit c396990 y siguientes.
- Revision del agente constructor: 4 fallos corregidos en paralelo y reconciliados (115356a, 5a70e59, 1339dba, 4bad26a); 5 variantes aceptadas por Juan y publicadas (59ba187).
- Quitados simbolos de la UI nueva y la flecha del boton Inicio (da3041e, ea6bea5). `allowedDevOrigins` para que `localhost` hidrate en dev.
- Merge a `main` (92d1ee5) y despliegue en Servidor 2: imagen `blueclue:92d1ee5`, healthy, HTTPS ok/demo/92d1ee5, 22 audios offline (39,7 MB). Registro en `docs/OPERATIONS.md` (c241806) y en Notion (cuaderno, Desarrollo, catalogo).
- Juan probo en iPhone (2026-10-09): portada confusa («Paso 0 de cuantos», «que mapa», dos botones al mismo sitio, flecha ↗ pintada como emoji). Organigrama del flujo y mockup de la portada; Juan decide el orden.
- Navegacion de un solo recorrido (`docs/NAVEGACION.md`, ecd92ed): orden Oido → Escucha → Ritmo, pasos «N de 7», portada en tres estados y «Tu recorrido» (`guidedPath.ts`, `pathProgress.ts`, `LearningMenu.tsx`), pasos hechos en `blueclue-path-done-v1` con recuperacion del progreso previo, cabecera «Paso N de 7 · Etapa» + Inicio + «Siguiente paso», sin glifos emoji.
- Merge a `main` (c58a22f) y despliegue: imagen `blueclue:c58a22f`, 172/174 tests (2 privados omitidos), HTTPS ok/demo/c58a22f. Registro en OPERATIONS (74403d8) y Notion.

### Que quedo pendiente
- [ ] **PRIORIDAD — leer `docs/DIAGNOSTICO-NIVELES.md`.** Juan rechaza la navegacion desplegada `c58a22f` (etapas, «N de 7», «Tu recorrido»): confusa y sin plan de aprendizaje visible. Quiere la portada con el estilo de `#sonidos` (una tarjeta por nivel) y que cada nivel lleve a un modulo con que aprendes, ejercicio guiado y resultado. Propuesta escrita, NO aprobada: preguntar y ensenar boceto antes de construir. Juan pasa el proyecto al agente constructor.
- [ ] Juan: probar c58a22f en el iPhone (recargar o actualizar la descarga offline); revisar sobre todo el triangulo de reproduccion del paso 5, unico glifo que queda (forzado a texto con U+FE0E).
- [ ] Juan: tres medidas en `#latencia` con sus auriculares; anotar medianas antes de plantear compensacion.
- [ ] Juan: escuchar las 7 variantes restantes (`node scripts/create-listening-variants.mjs` genera en `.local/variants/`; `--publish <id>` publica las aceptadas).
- [ ] Criterio del hito sin validar: «Juan reconoce lo aprendido en una muestra no practicada».
- [ ] Siguientes frentes acordados, sin autorizar aun: musica real verificada por oido (pistas piloto `pending-listening`) y puente a la FLX4 con el curso 05_LEARN.

### Decisiones tomadas
- Publico nivel 0: un solo camino de entrada; nada se bloquea; nada se da por aprendido por aceptar un sonido.
- Teach / Assist / Train conservan su nombre (decision de Juan); fuera «BPM» y «vista ampliada»; sin simbolos ni emojis en la UI.
- Ronda buena = 8+ oportunidades y (clavadas+cerca)/(oportunidades+repetidas+fuera) >= 80 %; solo rondas completas desde 0:00; clave `blueclue-rounds-v2`.
- La latencia se mide, no se corrige: `#latencia` usa Web Audio y el ejercicio MediaElement, su numero no sirve directamente para el scoring.
- Variantes de escucha solo se publican tras escucha de Juan.
- Recorrido (2026-10-09): Oido (paso 1) → Escucha (2-4) → Ritmo (5-7); cada etapa termina con «Ahora en una cancion de verdad» en gris hasta tener pistas verificadas; etapas 4-6 (Cancion, Mezcla, FLX4) en gris hasta construirse.
- Paso «hecho» = completado una vez, no aprobado; el boton de la portada lleva al ultimo paso abierto si no esta hecho.

### Contexto importante
- El agente constructor empuja a la MISMA rama de trabajo; comparar siempre `origin/<rama>` y no solo `main`.
- Tailscale SSH al VPS pide verificacion en navegador (check mode) que debe aprobar Juan; despues vale varias horas.
- `ops/build-image.sh` corre dentro del VPS con 0,6 CPU; lanzar con `nohup` y vigilar el log, la sesion SSH puede cortarse.
- Rollback actual: `BLUECLUE_IMAGE=blueclue:92d1ee5 docker compose -p blueclue up -d --wait` desde `/opt/apps/blueclue/releases/92d1ee5`.
- Un mensaje de Juan decia solo «gma»; quedo sin aclarar.
