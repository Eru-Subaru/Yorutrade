"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { api, type User } from "@/lib/api";
import { ErrorNotice, SessionNotice, errorText, useSession } from "@/components/community-shell";
export default function MyPage() {
  const { user, loading, error: sessionError, reload, setUser } = useSession();
  const [error, setError] = useState(""); const [saved, setSaved] = useState(false); const [busy, setBusy] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setSaved(false);
    const data = new FormData(event.currentTarget);
    try { const result = await api<{ user: User }>("/session", { method: "PATCH", body: JSON.stringify({ displayName: String(data.get("displayName")).trim() }) }); setUser(result.user); setSaved(true); }
    catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }
  return <main id="main" className="container page-container"><div className="page-heading"><p className="eyebrow">YOUR LITTLE CORNER</p><h1>自分のページ</h1><p>交換のときに使う、あなたの表示名。</p></div>{sessionError ? <ErrorNotice message={sessionError} retry={() => void reload()} /> : loading ? <p className="loading-state" role="status">読み込んでいます…</p> : user && <div className="form-card profile-card"><form onSubmit={event => void save(event)}><label className="form-group"><span>公開する表示名</span><input className="field" name="displayName" required maxLength={40} defaultValue={user.displayName} autoComplete="nickname" /></label><SessionNotice />{error && <ErrorNotice message={error} />}{saved && <p className="status-message" role="status">表示名を保存しました。</p>}<button className="button button-small" type="submit" disabled={busy}>{busy ? "保存しています…" : "表示名を保存"}</button></form><div className="profile-links"><Link className="text-link" href="/register"><Plus size={14} />交換を登録する</Link><Link className="text-link" href="/messages">提案とやり取りを見る<ArrowRight size={14} /></Link></div><p className="session-note">表示名やブラウザの識別は、本人確認を保証するものではありません。チャットは当事者だけが閲覧できますが、運営サーバーに保存され、エンドツーエンド暗号化はされません。</p></div>}</main>;
}
