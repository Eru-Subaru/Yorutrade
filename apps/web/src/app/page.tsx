"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, Guitar, MapPin, Package, Plus, RefreshCw, Search, ShieldCheck, UserRound } from "lucide-react";
import { api, type Listing } from "@/lib/api";
import { EmptyState, ErrorNotice, errorText, useSession } from "@/components/community-shell";

const normalize = (value: string) => value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
const dateLabel = (value: number) => new Date(value).toLocaleDateString("ja-JP", { month: "short", day: "numeric" });

export default function Home() {
  const { user, loading: sessionLoading, error: sessionError, reload: reloadSession } = useSession();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownListings, setOwnListings] = useState<Listing[]>([]);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => { const timer = window.setTimeout(() => setSearchQuery(query), 350); return () => window.clearTimeout(timer); }, [query]);
  const [notice, setNotice] = useState("");
  const load = useCallback((signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    return Promise.all([api<{ listings: Listing[] }>(`/listings?${params}`, { signal }), api<{ listings: Listing[] }>("/listings?mine=1", { signal })])
      .then(([result, own]) => { if (!signal?.aborted) { setListings(result.listings); setOwnListings(own.listings); setError(""); } })
      .catch(e => { if (!signal?.aborted) setError(errorText(e)); })
      .finally(() => { if (!signal?.aborted) setLoading(false); });
  }, [category, searchQuery]);
  useEffect(() => { const controller = new AbortController(); if (user) void load(controller.signal); return () => controller.abort(); }, [user, load]);
  const filtered = useMemo(() => listings.filter(item => (category === "all" || item.category === category) && normalize([item.title, item.have, item.want, item.event].join(" ")).includes(normalize(query))), [listings, category, query]);

  return <main id="main">
    <section className="container hero" aria-labelledby="hero-title">
      <div><p className="eyebrow">FOR YORUSHIKA FANS</p><h1 id="hero-title">その「好き」を、<br /><em>次の個体さんへ。</em></h1><p className="hero-description">会場で出会ったグッズも、ずっと探していたひとつも。<br />同じ音楽を好きな人と、交換でつながろう。</p><div className="hero-actions"><a className="button" href="#exchanges">欲しいものを探す<ArrowRight size={16} /></a><Link className="button button-secondary" href="/register"><Plus size={16} />交換を登録する</Link></div><p className="hero-footnote"><ShieldCheck size={14} />お互いが合意してから、やり取りがはじまります。</p></div>
      <div className="hero-art" aria-hidden="true"><div className="art-orbit" /><span className="art-star">✳</span><div className="art-letter letter-back" /><div className="art-letter"><div className="letter-top"><span>DEAR YOU</span><span>夜</span></div><div className="letter-deer"><Image src="/deer.svg" alt="" width={54} height={66} /></div><p className="letter-line">個体さんへ</p><p className="letter-caption">WITH THE SAME LOVE</p></div><div className="art-tag"><Package size={25} strokeWidth={1.2} /><div>ひとつの交換、ひとつの出会い。<span>会場で、大切なものを手渡そう。</span></div></div></div>
    </section>
    <section className="intro-strip" aria-label="交換の流れ"><div className="container intro-grid"><div className="intro-cell"><span className="step-number">01</span><div>持っているものを登録<small>写真と交換の希望を添えて</small></div></div><div className="intro-cell"><span className="step-number">02</span><div>お互いの希望を確認<small>同じ会場・条件の相手に提案</small></div></div><div className="intro-cell"><span className="step-number">03</span><div>合意して、やり取りへ<small>ふたりで受け渡しの相談を</small></div></div></div></section>
    <section id="exchanges" className="container section" aria-labelledby="exchanges-title"><div className="section-heading"><div><p className="eyebrow">EXCHANGE BOARD</p><h2 id="exchanges-title">次の出会いを、探そう。</h2><p>実際に登録された交換だけを掲載しています。</p></div><button className="text-link" type="button" disabled={loading || !user} onClick={() => void load()}><RefreshCw size={13} />最新の登録を読む</button></div>
      <div className="filters"><div className="tabs" aria-label="カテゴリで絞り込み">{[{ id: "all", label: "すべて" }, { id: "goods", label: "グッズ" }, { id: "pick", label: "ピック" }].map(tab => <button key={tab.id} className="tab" type="button" aria-pressed={category === tab.id} onClick={() => setCategory(tab.id)}>{tab.label}</button>)}</div><div className="search-form"><Search size={16} /><label className="sr-only" htmlFor="listing-search">グッズ名・会場名で検索</label><input id="listing-search" className="field" type="search" placeholder="グッズ名・会場名で検索" value={query} onChange={event => setQuery(event.target.value)} maxLength={120} /></div></div>
      {notice && <div className="status-message" role="status">{notice} <Link className="text-button" href="/messages">やり取りへ<ArrowRight size={13} /></Link></div>}
      {sessionError ? <ErrorNotice message={sessionError} retry={() => void reloadSession()} /> : error ? <ErrorNotice message={error} retry={() => void load()} /> : loading || sessionLoading ? <p className="loading-state" role="status">交換を読み込んでいます…</p> : filtered.length ? <div className="listings-grid">{filtered.map(listing => <ListingCard key={listing.id} listing={listing} mine={listing.ownerId === user?.id} ownListings={ownListings} onProposed={() => setNotice("交換の提案を送りました。相手の承諾をお待ちください。")} />)}</div> : <EmptyState title={query || category !== "all" ? "条件に合う交換はまだありません。" : "はじめの交換を、あなたから。"} description={query || category !== "all" ? "検索する言葉やカテゴリを変えてみてください。" : "交換したいグッズを登録して、同じ「好き」を持つ人との出会いを待ちましょう。"}><Link className="button" href="/register"><Plus size={15} />交換を登録する</Link></EmptyState>}
      <div className="community-banner"><div><h3>あなたの「譲ります」が、誰かの「探していた」に。</h3><p>お互いの欲しいものが一致したら、交換を提案できます。</p></div><Link className="button button-secondary" href="/register">持っているものを登録<ArrowUpRight size={16} /></Link></div>
    </section>
  </main>;
}

function ListingCard({ listing, mine, ownListings, onProposed }: { listing: Listing; mine: boolean; ownListings: Listing[]; onProposed: () => void }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const compatible = ownListings.filter(own => own.category === listing.category && normalize(own.event) === normalize(listing.event) && normalize(own.have) === normalize(listing.want) && normalize(own.want) === normalize(listing.have));
  async function propose() {
    if (!selected) return;
    setBusy(true); setError("");
    try { await api("/matches", { method: "POST", body: JSON.stringify({ listingId: listing.id, offeredListingId: selected }) }); setSent(true); setOpen(false); onProposed(); }
    catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }
  return <article className="listing-card"><div className="listing-picture"><span className="listing-category">{listing.category === "pick" ? "ギターピック" : "グッズ"}</span>{listing.imageId ? /* Authenticated same-origin images must bypass image optimization. */ <img src={`/api/images/${encodeURIComponent(listing.imageId)}`} alt={`${listing.title}の写真`} loading="lazy" /> : <div className="picture-placeholder">{listing.category === "pick" ? <Guitar size={42} strokeWidth={1} /> : <Package size={42} strokeWidth={1} />}<span>写真なし</span></div>}</div><div className="listing-content"><div className="listing-meta"><span>現地交換</span><time dateTime={new Date(listing.createdAt).toISOString()}>{dateLabel(listing.createdAt)}</time></div><h3>{listing.title}</h3><div className="exchange-pair"><div><span className="pair-label">譲</span><span>{listing.have}</span></div><div><span className="pair-label pair-want">求</span><span>{listing.want}</span></div></div><p className="listing-event"><MapPin size={13} />{listing.event}</p>{listing.notes && <p className="listing-notes">{listing.notes}</p>}<div className="listing-bottom"><span className="owner-label"><UserRound size={12} />{mine ? "あなたの登録" : listing.displayName}</span>{!mine && <button className="text-button" type="button" disabled={sent} aria-expanded={open} onClick={() => setOpen(!open)}>{sent ? <><Check size={13} />提案済み</> : <>交換を提案<ArrowRight size={13} /></>}</button>}</div>{open && <div className="proposal">{compatible.length ? <><p>同じ会場で、お互いの希望が一致した登録です。相手が承諾するとチャットが開きます。</p><label htmlFor={`offer-${listing.id}`}>交換に出すあなたの登録</label><select id={`offer-${listing.id}`} className="field" value={selected} onChange={e => setSelected(e.target.value)}><option value="">登録を選んでください</option>{compatible.map(own => <option key={own.id} value={own.id}>{own.title}（譲：{own.have}）</option>)}</select><button className="button button-small" type="button" disabled={!selected || busy} onClick={() => void propose()}>{busy ? "送信しています…" : "この内容で提案する"}</button></> : <><p>提案には、同じカテゴリ・会場で「譲るもの」と「欲しいもの」が互いに一致する、あなたの登録が必要です。</p><Link className="text-link" href="/register">自分の交換を登録する<ArrowRight size={13} /></Link></>}{error && <ErrorNotice message={error} />}</div>}</div></article>;
}
