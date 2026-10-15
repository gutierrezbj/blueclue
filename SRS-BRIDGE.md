# SRS-BRIDGE.md — Continuidad entre sesiones

## Proyecto
- **Nombre**: BlueClue — Entrenador DJ de bolsillo
- **Repo**: https://github.com/gutierrezbj/blueclue
- **Branch activo**: main
- **Estado**: Produccion (web publica, perfil ligero ADR-001)
- **Sprint actual**: navegación de siete niveles publicada como b9e7017; cuarta lección del nivel 2 aprobada como reto en local, pendiente de publicación y prueba en iPhone.

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
> Ultima actualizacion: 2026-10-15

### Publicación del recorrido aprobado
- Juan prueba «Recupera la cuenta» en local: «un poco difícil pero esa es la
  idea, que el oído busque», seguido de «perfect». Conservamos la dificultad;
  esto valida la intención del ejercicio, no aún su eficacia ni Safari físico.
  Publicación pendiente de decisión explícita; código y mapa están en
  `origin/main` hasta `58f5fe0`. Release pública preparada sin audio privado.
- Juan confirma el 12 octubre que la navegación se ve bien en móvil. La nueva
  práctica «Recupera la cuenta» está en el código local, no en producción:
  alterna dos compases con guía y dos sin ella, marca el siguiente 1 y ofrece
  feedback/revisión. Reutiliza cinco pistas, sin nuevos audios. 182 tests,
  TypeScript y build pasan; revisión visual local a 320 y 375 px correcta.
- Próximo paso: Juan prueba si realmente puede recuperar el 1 al oído;
  después decidir publicación. La prueba visual no demuestra aprendizaje.
- Tailscale SSH autorizado; imagen `blueclue:b9e7017` construida con 174 tests
  públicos correctos y dos privados omitidos. TypeScript y build correctos.
- `current` → `b9e7017`, Docker healthy; HTTPS `/health` devuelve
  `ok/demo/b9e7017`. Inicio público tiene siete niveles, nivel 2 tres lecciones
  y su introducción abre sin errores. HTTP redirige a HTTPS; `/offline-pack` 200.
- Rollback `c58a22f`; sin cambios de puertos, Nginx ni monitorización.
- Pendiente: Juan prueba actualización de la PWA y navegación en Safari/iPhone;
  reconocer cambios y el 1 sin guía sigue siendo validación pedagógica separada.

### Navegación de siete niveles (vigente)
- Juan aclara que Inicio debe mostrar siete niveles para aprender a pinchar.
  Pulso, Cuenta y Encuentra el 1 son lecciones del nivel 2, no tres niveles.
- `learningLevels.ts` define el currículo navegable; prácticas reales solo en
  niveles 1–3. Los niveles 4–7 explican lo previsto sin botones de práctica.
- Nuevas rutas `#aprende-nivel-1` a `#aprende-nivel-7`; las antiguas permanecen.
  Progreso y motores de evaluación se conservan. 176 pruebas y tipos pasan.
- Validación visual a 320/375/1280 px, 176 pruebas, TypeScript y build público
  aislado correctos. Vista previa en `http://127.0.0.1:3007/#inicio`.
- Juan aprueba la vista previa («genial, seguimos»). Los cuatro commits hasta
  `654add2` están en `origin/main`; el archivo de release público está preparado
  en `.local/blueclue-654add2.tar`, sin `.local` ni piloto privado dentro.
- La verificación adicional de Tailscale y publicación se completaron el 12 de
  octubre. Lo siguiente recoge decisiones históricas, no la portada vigente.

### Historial: recuperación del diseño de cinco tarjetas
- Juan aprueba el boceto de cinco tarjetas («yessssss»): sonidos, cambios,
  pulso, cuenta y el 1. Sustituye la portada de etapas y «N de 7».
- Construido en `main`: tarjetas grandes, explicacion breve y acceso a la
  practica. No se cambia audio, scoring, ayudas, velocidades ni records.
- La ultima practica sigue siendo el punto de retorno aunque haya una ronda
  terminada; no hay salto automatico ni estado «todo dominado». Los datos de
  rondas anteriores se conservan como practica, no como certificacion.
- `learningOverview.ts` concentra las tarjetas y objetivos; las nuevas rutas
  de introduccion no montan reproductor ni actualizan la ultima practica.
- 174 pruebas pasan, TypeScript y build publico aislado correctos. Navegacion
  comprobada a 320/375/1280 px sin overflow ni autoplay; restauracion de
  nivel 3/Train/80 %/19,5 s pausada, historial del navegador y storage bloqueado.
- Vista previa: `http://127.0.0.1:3007/#inicio`, desde `.local/cards-preview`
  (solo archivos publicos). Contiene un enlace `node_modules` al repo: NO borrar
  recursivamente su destino. No se ha desplegado ni repetido la prueba offline.

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
- [ ] **PRIORIDAD — validar y publicar las tarjetas aprobadas**, no volver a la portada rechazada de c58a22f. Ver `docs/NAVEGACION.md` y probar la vista previa local con Juan antes del despliegue.
- [ ] Tras publicar: probar el recorrido y actualizar la descarga en iPhone. La revision local no certifica Safari fisico ni la actualizacion offline.
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
- Orden conservado: sonidos → cambios → pulso → cuenta → el 1. Sin futuras
  etapas deshabilitadas ni «N de 7» en la UI; el futuro queda en el mapa documental.
- Ronda terminada = practicado, no dominado. Retomar no salta a otro ejercicio
  por haberlo practicado. Challenge permanece al final de la practica.

### Contexto importante
- El agente constructor empuja a la MISMA rama de trabajo; comparar siempre `origin/<rama>` y no solo `main`.
- Tailscale SSH al VPS pide verificacion en navegador (check mode) que debe aprobar Juan; despues vale varias horas.
- `ops/build-image.sh` corre dentro del VPS con 0,6 CPU; lanzar con `nohup` y vigilar el log, la sesion SSH puede cortarse.
- Rollback actual: `BLUECLUE_IMAGE=blueclue:92d1ee5 docker compose -p blueclue up -d --wait` desde `/opt/apps/blueclue/releases/92d1ee5`.
- Un mensaje de Juan decia solo «gma»; quedo sin aclarar.
