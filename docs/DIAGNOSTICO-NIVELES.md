# Diagnóstico por nivel — 9 de octubre de 2026

Documento de traspaso para el agente constructor. No es una especificación
aprobada: recoge la reacción de Juan a la navegación desplegada (`c58a22f`) y el
análisis de cada nivel. Nada de esto está construido.

## Lo que dijo Juan al probar `c58a22f` en su iPhone

- La portada es confusa: «Paso 1 de 7» arriba y otra vez en «Tu recorrido»,
  etapas mezcladas con pasos y dos diseños distintos para lo mismo.
- «Había un plan de aprendizaje y ahora son un montón de pantallas que no llevan
  a ninguna parte.» No queda claro qué se aprende ni para qué.
- El diseño bueno es la pantalla de Los cuatro sonidos (`#sonidos`): tarjetas
  grandes con nombre, una frase y una acción. Esperaba que la portada mostrara los
  niveles así y que cada tarjeta llevara a un módulo de aprendizaje.
- Pide preguntar antes de construir y no montar pantallas sin enseñarlas antes.

**Conclusión: la navegación de `c58a22f` (etapas, «N de 7», «Tu recorrido») no
gusta a Juan y debe sustituirse.** Rollback disponible a `92d1ee5`, aunque esa
versión tenía los problemas que motivaron el cambio.

## Los cinco niveles tal como existen hoy

| Nivel | Contenido | Existe | Falta |
| --- | --- | --- | --- |
| 1 · Los sonidos | Conocer bombo, caja, charles, bajo; quiz de 8 | Conocer, quiz, resultado (6 de 8 → siguiente) | Pantalla de qué aprendes |
| 2 · El pulso | Tocar cada golpe | Pista (5), velocidad (3), ayuda (3), ronda, resumen, frase de avance | Qué aprendes; la app no elige por ti |
| 3 · Cuenta 1-2-3-4 | Tocar solo en el 1, con números en Teach | Igual que el 2 | Igual que el 2 |
| 4 · Encuentra el 1 | El 1 sin marcas; Challenge al final | Igual que el 2 + Challenge | Igual que el 2 |
| 5 · Escucha el cambio | Bajo, percusión, ¿bajo o batería? | Escuchar, Reconocer, resumen, otra muestra | Qué aprendes, criterio de dominio y a dónde lleva |

Hallazgos:

1. **Ningún nivel dice qué aprendes ni para qué sirve en la cabina.**
2. **Los niveles 2–4 obligan a decidir antes de tocar nada**: 5 pistas × 3
   velocidades × 3 ayudas = 45 combinaciones por nivel. Se vive como laberinto.
3. **El nivel 5 no termina en nada**: sin criterio de «lo sabes» ni siguiente.
4. **El nivel 1 es el único redondo**: entras, haces, ves el resultado y te dice
   qué sigue. Es el modelo a copiar.

## Propuesta pendiente de aprobación de Juan

- Portada: una tarjeta por nivel, con el estilo de `#sonidos`; cada una dice qué
  aprendes. Sin pasos numerados, etapas ni «Tu recorrido».
- Cada nivel funciona como el nivel 1:
  1. Pantalla de qué aprendes y para qué sirve en la cabina.
  2. Ejercicio que la app elige por ti; pista, velocidad y ayuda avanzan solas
     con los aciertos.
  3. Resultado que dice si ya lo sabes o repites, y lleva al siguiente nivel.

Contenido propuesto para las tarjetas (sin validar):

| Nivel | Aprendes | En la cabina | Lo sabes cuando |
| --- | --- | --- | --- |
| Los sonidos | Distinguir bombo, caja, charles y bajo | Sabes qué oyes al mezclar | 6 de 8 sin volver a oír |
| El pulso | Seguir el golpe regular | Sin pulso no hay mezcla | Acompañas una pista entera sin perderte |
| Cuenta 1-2-3-4 | Agrupar de cuatro en cuatro | Se mezcla por grupos, no por golpes | Cuentas con menos ayuda |
| Encuentra el 1 | Dónde empieza cada grupo, de oído | La segunda canción se lanza en el 1 | Sin marcas y en pista no practicada |
| Escucha el cambio | Cuándo entra el bajo o la batería | Los cambios marcan las partes, donde se entra y se sale | Reconoces entradas en una muestra nueva |

Juan preguntó también por el curso de Sinatra (`05_LEARN`, 16 módulos, Regla
3x5) como posible plan de referencia; no está en el equipo Windows y quedó sin
decidir si BlueClue debe seguirlo.
