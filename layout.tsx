import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no">
      <body className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        {children}
      </body>
    </html>
  );
}
