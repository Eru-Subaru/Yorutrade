import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CommunityShell } from "@/components/community-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ヨルトレード | 好きが、つながる交換所", template: "%s | ヨルトレード" },
  description: "ヨルシカが好きな個体さん同士で、グッズやギターピックを現地交換。お互いの希望を確かめてから、ふたりだけのやり取りを。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="ja"><body><CommunityShell>{children}</CommunityShell></body></html>;
}
