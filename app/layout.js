import "./globals.css";

export const metadata = {
  title: "SENA STEM | SQL Sandbox & Tutor IA",
  description: "Plataforma interactiva para la evaluación automatizada y tutoría de SQL para aprendices de ingeniería STEM.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
