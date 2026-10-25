"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, Menu, MessageCircle, Plus, UserRound, X } from "lucide-react";
import { api, type User } from "@/lib/api";

type Session = { user: User | null; loading: boolean; error: string; reload: () => Promise<void>; setUser: (user: User) => void };
const SessionContext = createContext<Session | null>(null);
export const errorText = (error: unknown) => error instanceof Error ? error.message : "通信できませんでした。時間をおいてもう一度お試しください。";
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("Session provider is missing");
  return context;
}
export function CommunityShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reload = useCallback(() => api<{ user: User }>("/session")
    .then(result => { setUser(result.user); setError(""); })
    .catch(e => { setError(errorText(e)); })
    .finally(() => { setLoading(false); }), []);
  useEffect(() => { void reload(); }, [reload]);
  const links = [{ href: "/#exchanges", text: "交換を探す" }, { href: "/messages", text: "やり取り" }, { href: "/me", text: "自分のページ" }];
  return <SessionContext.Provider value={{ user, loading, error, reload, setUser }}>
    <a className="skip-link" href="#main">本文へ移動</a>
    <header className="site-header"><div className="container header-inner">
      <Link href="/" className="brand" aria-label="ヨルトレード ホーム"><Image src="/deer.svg" alt="" width={34} height={42} priority /><span><span className="brand-name">ヨルトレード<span className="brand-dot">.</span></span><span className="brand-caption">好きが、つながる交換所</span></span></Link>
      <nav className="desktop-nav" aria-label="メインナビゲーション">{links.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>{link.text}</Link>)}<Link className="button button-small" href="/register"><Plus size={15} />交換を登録</Link></nav>
      <button className="icon-button mobile-menu" type="button" aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={24} /> : <Menu size={24} />}</button>
    </div>{menuOpen && <nav id="mobile-navigation" className="mobile-navigation" aria-label="モバイルナビゲーション">{links.map(link => <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>{link.text}<ArrowUpRight size={16} /></Link>)}<Link href="/register" onClick={() => setMenuOpen(false)}>交換を登録する<Plus size={16} /></Link></nav>}</header>
    {children}
    <footer className="site-footer"><div className="container footer-top"><Link className="brand-name" href="/">ヨルトレード.</Link><p>大切なものを、大切にしてくれる人へ。</p><div><Link href="/messages"><MessageCircle size={15} />やり取り</Link><Link href="/me"><UserRound size={15} />自分のページ</Link></div></div><div className="container footer-bottom"><span>YORUTRADE · FAN EXCHANGE COMMUNITY</span><span>ヨルシカ非公式ファンサイト</span></div></footer>
  </SessionContext.Provider>;
}
export function SessionNotice() { return <p className="session-note">このブラウザのCookieで利用者を識別します。別の端末やCookie削除後は、登録・やり取りに戻れません。表示名は本人確認済みの名前ではありません。</p>; }
export function ErrorNotice({ message, retry }: { message: string; retry?: () => void }) { return <div className="error-notice" role="alert"><p>{message}</p>{retry && <button className="text-button" type="button" onClick={retry}>もう一度読み込む</button>}</div>; }
export function EmptyState({ title, description, children }: { title: string; description: string; children?: ReactNode }) { return <div className="empty-state"><span className="empty-symbol" aria-hidden="true">✳</span><h3>{title}</h3><p>{description}</p>{children}</div>; }
