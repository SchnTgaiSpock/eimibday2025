import type { Metadata } from "next";
import { Indie_Flower, Zen_Kurenaido, Barlow_Condensed, M_PLUS_Rounded_1c } from "next/font/google";
import "./layout1.css"
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

const latinFont = Indie_Flower({
  weight: "400"
});

const japaneseFont = Zen_Kurenaido({
  weight: "400"
});

const scranHeaderFont = Barlow_Condensed({
  weight: "600"
});

const scranSubheaderFont = M_PLUS_Rounded_1c({
  weight: "400"
});

export const metadata: Metadata = {
  title: "Happy Birthday Eimi!",
  description: "Eimi Isami Birthday Celebration Page",
};

export default function Layout1({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: '"Indie Flower", "Zen Kurenaido", "Segoe UI", "Arial"'
        }}
      >
        <Navbar />
        <div className="page-body grainy-background">
          <Sidebar  />
          {children}
        </div>
      <svg style={{
        position: "absolute",
        width: 0,
        height: 0,
      }}>
        <filter id="grainy-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
        </filter>
        <filter id="paper-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
        </filter>
      </svg>
      </body>
    </html>
  );
}
