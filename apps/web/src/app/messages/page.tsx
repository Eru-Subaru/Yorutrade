"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, MessageCircle, RefreshCw, Send } from "lucide-react";
import { api, type Match, type Message } from "@/lib/api";
import { EmptyState, ErrorNotice, SessionNotice, errorText, useSession } from "@/components/community-shell";

const statusLabels = { pending: "承諾待ち", accepted: "マッチ成立", declined: "見送り" };
export default function MessagesPage() {
  const { user, loading: sessionLoading, error: sessionError, reload: reloadSession } = useSession();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    const result = await api<{ matches: Match[] }>("/matches");
    setMatches(result.matches); setError(""); setLoading(false);
    setSelectedId(current => result.matches.some(match => match.id === current) ? current : result.matches[0]?.id ?? "");
  }, []);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    const update = async () => { if (document.hidden) return; try { await refresh(); } catch (e) { if (alive) { setError(errorText(e)); setLoading(false); } } };
    void update();
    const timer = window.setInterval(() => void update(), 10000);
    document.addEventListener("visibilitychange", update);
    return () => { alive = false; window.clearInterval(timer); document.removeEventListener("visibilitychange", update); };
  }, [user, refresh]);
  const selected = matches.find(match => match.id === selectedId);
  return <main id="main" className="container page-container"><div className="page-heading"><p className="eyebrow">A CONVERSATION BEGINS</p><h1>ふたりの、やり取り。</h1><p>届いた提案を確認して、合意した相手と受け渡しの相談を。</p></div>
    {sessionError ? <ErrorNotice message={sessionError} retry={() => void reloadSession()} /> : <>{error && <ErrorNotice message={error} retry={() => void refresh().catch(e => setError(errorText(e)))} />}{loading || sessionLoading ? <p className="loading-state" role="status">やり取りを読み込んでいます…</p> : !matches.length ? !error && <EmptyState title="やり取りは、これから。" description="登録内容が互いの希望と合ったら、交換を提案しましょう。相手が承諾するとチャットが開きます。"><Link className="button" href="/#exchanges">交換相手を探す<ArrowRight size={15} /></Link></EmptyState> : <div className="messages-layout"><aside><div className="matches-list" aria-label="交換の提案一覧">{matches.map(match => <button className="match-card" type="button" key={match.id} aria-pressed={selectedId === match.id} onClick={() => setSelectedId(match.id)}><span className={`match-status match-status-${match.status}`}>{match.status === "pending" && match.recipientId === user?.id ? "届いた提案" : statusLabels[match.status]}</span><h2>{match.partnerName} さん</h2><p>{match.listingTitle}</p><p>↔ {match.offeredTitle}</p></button>)}</div><button className="text-button" type="button" style={{ marginTop: 14 }} onClick={() => void refresh().catch(e => setError(errorText(e)))}><RefreshCw size={13} />最新の状態を読む</button><SessionNotice /></aside>{selected && user && <Conversation key={selected.id} match={selected} userId={user.id} refresh={refresh} />}</div>}</>}
  </main>;
}

function Conversation({ match, userId, refresh }: { match: Match; userId: string; refresh: () => Promise<void> }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const bottom = useRef<HTMLDivElement>(null);
  const lastMessageId = useRef("");
  const reloadMessages = useCallback(async (signal?: AbortSignal) => {
    const result = await api<{ messages: Message[] }>(`/matches/${encodeURIComponent(match.id)}/messages`, { signal });
    if (signal?.aborted) return;
    setMessages(result.messages); setError(""); setLoading(false);
  }, [match.id]);
  useEffect(() => {
    if (match.status !== "accepted") return;
    const controller = new AbortController();
    const update = async () => {
      if (document.hidden) return;
      try { await reloadMessages(controller.signal); }
      catch (e) { if (!controller.signal.aborted) { setError(errorText(e)); setLoading(false); } }
    };
    void update();
    const timer = window.setInterval(() => void update(), 5000);
    document.addEventListener("visibilitychange", update);
    return () => { controller.abort(); window.clearInterval(timer); document.removeEventListener("visibilitychange", update); };
  }, [match.status, reloadMessages]);
  useEffect(() => {
    const latest = messages[messages.length - 1]?.id;
    if (latest && latest !== lastMessageId.current) { bottom.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); lastMessageId.current = latest; }
  }, [messages]);
  async function decide(status: "accepted" | "declined") {
    setBusy(true); setError("");
    try { await api(`/matches/${encodeURIComponent(match.id)}`, { method: "PATCH", body: JSON.stringify({ status }) }); await refresh(); }
    catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true); setError("");
    try { await api(`/matches/${encodeURIComponent(match.id)}/messages`, { method: "POST", body: JSON.stringify({ text: text.trim() }) }); setText(""); await reloadMessages(); }
    catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }
  return <section className="chat-panel" aria-label={`${match.partnerName}さんとのやり取り`}><div className="chat-header"><h2><MessageCircle size={18} className="inline" /> {match.partnerName} さん</h2><p>{match.listingTitle} ↔ {match.offeredTitle}</p></div>{error && <ErrorNotice message={error} retry={match.status === "accepted" ? () => void reloadMessages().catch(e => setError(errorText(e))) : undefined} />}
    {match.status === "accepted" ? <><div className="chat-body" role="log" aria-label="チャットメッセージ" aria-live="polite" aria-relevant="additions">{loading ? <p className="loading-state">メッセージを読み込んでいます…</p> : !messages.length ? <p className="small-note">交換が成立しました。まずはひとこと、挨拶してみましょう。</p> : messages.map(message => <div className={`chat-message ${message.senderId === userId ? "chat-message-own" : ""}`} key={message.id}><span className="sr-only">{message.senderId === userId ? "あなた" : match.partnerName}：</span><p>{message.text}</p><time dateTime={new Date(message.createdAt).toISOString()}>{new Date(message.createdAt).toLocaleString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time></div>)}<div ref={bottom} /></div><form className="chat-composer" onSubmit={event => void send(event)}><label className="sr-only" htmlFor="message-text">メッセージ</label><textarea id="message-text" className="field" value={text} onChange={event => setText(event.target.value)} maxLength={2000} placeholder="相手にメッセージを送る" required rows={2} /><div className="chat-composer-bottom"><span>{text.length} / 2000</span><button className="button button-small" type="submit" disabled={busy || !text.trim()}>{busy ? "送信しています…" : "送信"}<Send size={14} /></button></div><p className="session-note">当事者だけが閲覧できます。メッセージはサーバーに保存され、エンドツーエンド暗号化はされません。受け渡しは人の多い場所で。</p></form></> : <div className="match-decision">{match.status === "declined" ? <p>この提案は見送りになりました。チャットは開かれません。ほかの交換を探してみましょう。</p> : match.recipientId === userId ? <><p>相手が、あなたの登録に交換を提案しました。グッズと条件を確認して承諾すると、この相手とのチャットが開きます。承諾した登録は、ほかの交換に使えなくなります。</p><div className="match-decision-actions"><button type="button" className="button" disabled={busy} onClick={() => void decide("accepted")}><Check size={15} />{busy ? "処理しています…" : "交換を承諾する"}</button><button type="button" className="button button-secondary" disabled={busy} onClick={() => void decide("declined")}>今回は見送る</button></div></> : <p>提案を送りました。相手が内容を確認し、承諾するまでお待ちください。両者の合意後にチャットが開きます。</p>}</div>}
  </section>;
}
