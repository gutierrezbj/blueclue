import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BlueClue — Beat Trainer",
  description: "Aprende a seguir el beat, contar cuatro y reconocer el 1."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
