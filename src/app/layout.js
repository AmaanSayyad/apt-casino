import { Inter } from "next/font/google";
import "@/styles/globals.css";
import Providers from "./providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MainnetWarning from "@/components/MainnetWarning";
const inter = Inter({ subsets: ["latin"] });

import { rootMetadata } from "@/lib/siteMetadata";

export const metadata = rootMetadata;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body 
        className={`${inter.className} overflow-x-hidden w-full`}
        suppressHydrationWarning={true}
      >
        <Providers>
          <Navbar />
          <MainnetWarning />
          <main id="site-main" className="site-main">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
