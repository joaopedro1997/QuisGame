import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuizGame - Quiz Interativo",
  description: "Plataforma de quiz interativo para sala de aula",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
