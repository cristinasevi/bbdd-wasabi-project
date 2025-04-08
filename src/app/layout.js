import { Inter } from "next/font/google";
import "./globals.css";

import Navbar from "./components/navbar/navbar";
import Footer from "./components/footer/footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Salesianos Zaragoza",
  description: "Plataforma para la administración económica de los departamentos de Salesianos Zaragoza",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} antialiased`}
      >
        <Navbar/>
        <div className="ml-64 min-h-screen flex flex-col">
          <div className="flex-1">{children}</div>
          <Footer/>
        </div>
      </body>
    </html>
  );
}
