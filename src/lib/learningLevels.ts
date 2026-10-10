import type { GuidedStepId } from "./guidedPath.ts";

export type LearningLevelId = "sounds" | "rhythm" | "song" | "entry" | "mix" | "controller" | "session";

export type LearningLevel = {
  id: LearningLevelId;
  number: number;
  title: string;
  summary: string;
  goal: string;
  hash: string;
  lessons: readonly { title: string; description: string; hash?: string; stepId?: GuidedStepId }[];
};

export const learningLevels: readonly LearningLevel[] = [
  {
    id: "sounds", number: 1, title: "Conocer los sonidos", summary: "Pon nombre a lo que escuchas.",
    goal: "Distinguir los sonidos básicos antes de seguir lo que ocurre en una canción.", hash: "#aprende-nivel-1",
    lessons: [
      { title: "Bombo, caja, charles y bajo", description: "Escucha cada sonido y después identifícalo sin mirar.", hash: "#aprender-sonidos", stepId: "sounds" },
      { title: "Voz, melodía y acompañamiento", description: "Aprenderás a separar otros elementos de una canción." },
      { title: "Sonidos juntos", description: "Buscarás un instrumento cuando suenen varios a la vez." }
    ]
  },
  {
    id: "rhythm", number: 2, title: "Seguir el ritmo y encontrar el 1", summary: "Siente el pulso y ubícate en el compás.",
    goal: "Mantener el tiempo, contar en grupos de cuatro y reconocer dónde empieza el compás.", hash: "#aprende-nivel-2",
    lessons: [
      { title: "Sigue el pulso", description: "Acompaña cada golpe regular, sin buscar todavía el 1.", hash: "#aprender-pulso", stepId: "pulse" },
      { title: "Cuenta 1-2-3-4", description: "Sigue la cuenta y marca cuando vuelve al 1.", hash: "#aprender-cuenta", stepId: "count" },
      { title: "Encuentra el 1", description: "Identifica el comienzo del compás con menos ayudas.", hash: "#aprender-el-1", stepId: "downbeat" },
      { title: "Recupera la cuenta", description: "Aprenderás a volver al pulso cuando te pierdas." }
    ]
  },
  {
    id: "song", number: 3, title: "Reconocer cambios, frases y partes de una canción", summary: "Escucha qué entra, qué sale y qué viene.",
    goal: "Reconocer cambios audibles y, más adelante, anticipar frases y partes de una canción.", hash: "#aprende-nivel-3",
    lessons: [
      { title: "Escucha el bajo", description: "Reconoce cuándo entra el bajo.", hash: "#escucha-el-bajo", stepId: "bass" },
      { title: "Escucha la percusión", description: "Reconoce cuándo entra la batería.", hash: "#escucha-la-percusion", stepId: "percussion" },
      { title: "¿Bajo o batería?", description: "Distingue cuál de los dos acaba de entrar.", hash: "#bajo-o-bateria", stepId: "choice" },
      { title: "Frases y partes", description: "Aprenderás a reconocer intro, cambios, break y salida en música real." }
    ]
  },
  {
    id: "entry", number: 4, title: "Preparar una entrada y una salida", summary: "Elige cuándo empezar y terminar una transición.",
    goal: "Escuchar puntos de entrada y salida, elegir un momento y explicar por qué.", hash: "#aprende-nivel-4",
    lessons: [
      { title: "Compás o frase", description: "Distinguirás el primer golpe de un compás del comienzo de una frase." },
      { title: "Dónde entrar y salir", description: "Compararás momentos posibles para incorporar o retirar una canción." },
      { title: "Punto cue", description: "Entenderás cómo preparar y recuperar una entrada." }
    ]
  },
  {
    id: "mix", number: 5, title: "Sincronizar y mezclar dos canciones", summary: "Oye si encajan y cuándo se separan.",
    goal: "Reconocer diferencias de tempo y golpes desalineados antes de corregirlos con una herramienta DJ.", hash: "#aprende-nivel-5",
    lessons: [
      { title: "Velocidad y alineación", description: "Escucharás la diferencia entre ritmos alineados y desalineados." },
      { title: "Desajuste que aumenta", description: "Distinguirás un golpe adelantado de dos canciones que se van separando." },
      { title: "La transición", description: "Entenderás cómo cambian los volúmenes al pasar de una canción a otra." }
    ]
  },
  {
    id: "controller", number: 6, title: "Practicar en tu FLX4", summary: "Lleva lo que oyes a los controles reales.",
    goal: "Relacionar auriculares, cue, play, tempo y faders con lo aprendido de oído.", hash: "#aprende-nivel-6",
    lessons: [
      { title: "Auriculares y público", description: "Distinguirás lo que escuchas antes de una entrada de lo que oye el público." },
      { title: "Prepara y lanza", description: "Prepararás una canción con cue y la lanzarás en el momento elegido." },
      { title: "Repite una transición", description: "Volverás a intentarla hasta reconocer qué cambia." }
    ]
  },
  {
    id: "session", number: 7, title: "Construir una sesión", summary: "Elige canciones y escucha tus decisiones.",
    goal: "Preparar una selección breve, practicarla en tu equipo y revisar una grabación.", hash: "#aprende-nivel-7",
    lessons: [
      { title: "Selecciona canciones", description: "Elegirás unas pocas canciones que encajen con tu idea." },
      { title: "Ordénalas", description: "Pensarás en la apertura, el desarrollo y el cierre." },
      { title: "Graba y escucha", description: "Revisarás qué transiciones funcionaron y cuáles quieres repetir." }
    ]
  }
];

export function levelForHash(hash: string): LearningLevel | null {
  return learningLevels.find(level => level.hash === hash) ?? null;
}

export function getLearningLevel(id: LearningLevelId): LearningLevel {
  return learningLevels.find(level => level.id === id)!;
}
