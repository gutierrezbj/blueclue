export type ListeningInstrument = "bass" | "percussion";

export const listeningLessons = {
  bass: {
    context: "Notas graves que entran, salen y vuelven. No cuentes.",
    listen: "Solo escucha. Fíjate en las notas graves, por debajo de la percusión.",
    instruction: "Pulsa al oír entrar o volver el bajo. No en cada golpe, ni cuando sale.",
    button: "ENTRA EL BAJO",
    recognized: "Reconocida. Has oído entrar el bajo.",
    outside: "Aquí no hay una nueva entrada del bajo. Sigue escuchando; puedes reconocer la siguiente.",
    ready: "Primero sonará la base. Espera a escuchar las notas graves.",
    base: "Esta es la base, todavía sin bajo.",
    entry: "Entra el bajo: escucha las notas graves.",
    exit: "Sale el bajo. La base sigue sonando.",
    ongoing: "El bajo sigue. No es otra entrada.",
    returnLabel: "Vuelve el bajo",
    listened: "Has escuchado cómo entra el bajo, desaparece y vuelve. Ahora pulsa cuando lo oigas entrar, sin guía visual."
  },
  percussion: {
    context: "La batería entra, sale y vuelve. La melodía continúa.",
    listen: "Solo escucha. Fíjate en el bombo, la caja y los platos: juntos forman la batería.",
    instruction: "Pulsa al entrar o volver la batería. No en cada golpe, ni cuando sale.",
    button: "ENTRA LA BATERÍA",
    recognized: "Reconocida. Has oído entrar la batería.",
    outside: "Aquí no entra la batería. Sigue escuchando; puedes reconocer la siguiente entrada.",
    ready: "Primero suena la melodía. Espera a oír la batería.",
    base: "Melodía y bajo, todavía sin batería.",
    entry: "Entra la batería: bombo, caja y platos.",
    exit: "Sale la batería. La melodía continúa.",
    ongoing: "La batería sigue. No es otra entrada.",
    returnLabel: "Vuelve la batería",
    listened: "Has oído cómo aparece y desaparece la batería mientras la melodía continúa. Ahora reconoce sus entradas sin guía."
  }
} satisfies Record<ListeningInstrument, Record<string, string>>;
