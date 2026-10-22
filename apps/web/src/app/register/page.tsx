"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Camera, Check, ShieldCheck } from "lucide-react";
import { api, uploadImage, type User } from "@/lib/api";
import { ErrorNotice, SessionNotice, errorText, useSession } from "@/components/community-shell";

export default function RegisterPage() {
  const { user, loading, error: sessionError, reload, setUser } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [imageId, setImageId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);
  function selectPhoto(selected?: File) {
    setError(""); setImageId(null); setFile(null); setPreview("");
    if (!selected) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) { setError("JPEG・PNG・WebPの写真を選んでください。"); return; }
    if (selected.size > 10 * 1024 * 1024) { setError("写真は10MB以下にしてください。"); return; }
    setFile(selected); setPreview(URL.createObjectURL(selected));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      const displayName = String(form.get("displayName") ?? "").trim();
      if (displayName !== user.displayName) { const result = await api<{ user: User }>("/session", { method: "PATCH", body: JSON.stringify({ displayName }) }); setUser(result.user); }
      let photoId = imageId;
      if (file && !photoId) { photoId = await uploadImage(file); setImageId(photoId); }
      await api("/listings", { method: "POST", body: JSON.stringify({ title: String(form.get("title")).trim(), have: String(form.get("have")).trim(), want: String(form.get("want")).trim(), category: form.get("category"), event: String(form.get("event")).trim(), notes: String(form.get("notes")).trim(), ...(photoId ? { imageId: photoId } : {}) }) });
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }
  return <main id="main" className="container narrow-container page-container"><div className="page-heading"><p className="eyebrow">CREATE AN EXCHANGE</p><h1>次の個体さんへ、つなぐ。</h1><p>譲りたいものと、探しているものを登録しましょう。</p></div>
    {sessionError ? <ErrorNotice message={sessionError} retry={() => void reload()} /> : loading ? <p className="loading-state" role="status">準備しています…</p> : success ? <div className="form-card"><Check size={30} color="#526248" /><h2>交換を登録しました。</h2><p>あなたの登録が公開されました。希望の合う人を探すか、相手からの提案を待ちましょう。</p><div className="hero-actions"><Link href="/#exchanges" className="button">交換を探す<ArrowRight size={15} /></Link><Link href="/messages" className="button button-secondary">やり取りを見る</Link></div><SessionNotice /></div> : user && <div className="form-layout"><form onSubmit={event => void submit(event)}><section className="form-card"><h2>01 グッズのこと</h2><p>実物が分かる情報を、できるだけ具体的に。</p><div className="photo-upload">{preview ? /* Blob previews are local and not passed to an optimizer. */ <img className="photo-preview" src={preview} alt="登録する写真のプレビュー" /> : <Camera size={29} strokeWidth={1.2} />}<label htmlFor="photo">交換するものの写真 <span className="optional">任意</span></label><input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => selectPhoto(event.target.files?.[0])} /><p>JPEG / PNG / WebP・10MB以下。アップロード時に位置情報などのメタデータを削除します。</p>{file && <button className="text-button" type="button" disabled={busy} onClick={() => { setFile(null); setPreview(""); setImageId(null); }}>写真を外す</button>}</div><label className="form-group"><span>登録のタイトル</span><input className="field" name="title" required maxLength={120} placeholder="例：会場ガチャのキーホルダーを交換したい" /></label><label className="form-group"><span>カテゴリ</span><select className="field" name="category" required><option value="goods">グッズ</option><option value="pick">ギターピック</option></select></label><div className="form-columns"><label className="form-group"><span>譲れるもの</span><input className="field" name="have" required maxLength={120} placeholder="商品名・種類・色" /></label><label className="form-group"><span>探しているもの</span><input className="field" name="want" required maxLength={120} placeholder="商品名・種類・色" /></label></div><p className="field-hint">互いの商品名・カテゴリ・会場名が一致した登録に提案できます。正式な名称を使うと見つけやすくなります。</p><label className="form-group"><span>補足 <span className="optional">任意</span></span><textarea className="field" rows={3} name="notes" maxLength={1000} placeholder="状態や交換の希望など。住所・電話番号は書かないでください。" /></label></section>
      <section className="form-card"><h2>02 会場とあなたのこと</h2><p>受け渡しは、人のいる会場や公共の場所で。</p><label className="form-group"><span>会場・日程</span><input className="field" name="event" required maxLength={120} placeholder="例：2026年11月1日・東京ガーデンシアター" /><small className="field-hint">同じ会場・日程の相手と交換します。会場名と日付を一緒に書いてください。</small></label><label className="form-group"><span>公開する表示名</span><input className="field" name="displayName" required maxLength={40} defaultValue={user.displayName} autoComplete="nickname" /><small className="field-hint">本名でなくて大丈夫です。表示名は登録一覧と相手に公開されます。</small></label><SessionNotice /></section>
      <div className="form-card"><p className="small-note"><ShieldCheck size={16} className="inline" /> 写真・タイトル・交換条件・会場・表示名は公開されます。個人情報やチケットのQRコードを載せないでください。</p><label className="form-group" style={{ display: "flex", alignItems: "start", gap: 10 }}><input type="checkbox" required name="consent" style={{ marginTop: 5 }} /><span>公開する内容を確認しました。</span></label></div>
      {error && <ErrorNotice message={error} />}<div className="form-actions"><Link href="/" className="text-link"><ArrowLeft size={14} />ホームに戻る</Link><button className="button" type="submit" disabled={busy}>{busy ? "登録しています…" : "公開して登録する"}<ArrowRight size={15} /></button></div>
    </form><aside className="form-tip"><h3>気持ちのよい交換のために</h3><p><strong>ありのままを伝える</strong>傷や開封の有無も、写真や説明に添えて。</p><p><strong>合意してから相談する</strong>実際の相手が提案を承諾すると、チャットが使えます。</p><p><strong>個人情報を守る</strong>登録内容は公開されます。受け渡しは人の多い場所で。</p></aside></div>}
  </main>;
}
