import "./globals.css";
import Header from "@/components/Header";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no" className="bg-gradient-to-br from-slate-900 to-slate-800 text-white min-h-screen">
      <body className="bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen text-white">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
