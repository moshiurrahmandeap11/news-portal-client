import Header from "../components/SharedItems/Header/Header";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Header />
      <body>{children}</body>
    </html>
  );
}
