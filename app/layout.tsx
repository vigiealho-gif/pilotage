import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pilotage Flux & Effectifs",
  description: "Pilotage opérationnel des effectifs, mouvements, disponibilités et performances des équipes ALH.",
  openGraph: {
    title: "Pilotage Flux & Effectifs",
    description: "Une vision claire pour piloter les équipes ALH.",
    url: "https://pilotage-flux-effectifs.sanaesmr26.chatgpt.site",
    images: ["https://pilotage-flux-effectifs.sanaesmr26.chatgpt.site/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pilotage Flux & Effectifs",
    description: "Une vision claire pour piloter les équipes ALH.",
    images: ["https://pilotage-flux-effectifs.sanaesmr26.chatgpt.site/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
