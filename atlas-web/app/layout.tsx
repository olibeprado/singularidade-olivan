export const metadata = {
  title: "Singularidade Olivan",
  description: "Sistema Singularidade Olivan",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
