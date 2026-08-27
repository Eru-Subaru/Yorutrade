"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  MapPin,
  Package,
  Search,
  Sparkles,
  X,
} from "lucide-react";

const categories = ["グッズ", "ピック", "その他"];

export default function RegisterPage() {
  const [category, setCategory] = useState("グッズ");
  const [wantType, setWantType] = useState("特定のものを探している");
  const [images, setImages] = useState<{ url: string; name: string }[]>([]);

  const addImages = (files: FileList | null) => {
    if (!files) return;

    const availableSlots = 4 - images.length;
    const selectedFiles = Array.from(files).slice(0, availableSlots);
    const newImages = selectedFiles.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
    }));

    setImages((currentImages) => [...currentImages, ...newImages]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(images[index].url);
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <main className="paper-theme min-h-screen overflow-hidden bg-[#f3f6f5] text-[#26383a]">
      {/* =========================================
          Background
      ========================================== */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#dbe8e8] blur-3xl" />

        <div className="absolute -left-40 bottom-[10%] h-[400px] w-[400px] rounded-full bg-[#e4eeee] blur-3xl" />

        <div className="absolute right-[8%] top-[10%] opacity-[0.08]">
          <img src="/deer.svg" alt="" className="h-[220px] w-[220px]" />
        </div>

        <div className="absolute left-[5%] top-[35%] h-px w-28 rotate-[-18deg] bg-[#8faeb0] opacity-30" />

        <div className="absolute left-[7%] top-[36%] h-px w-16 rotate-[-18deg] bg-[#8faeb0] opacity-20" />
      </div>

      {/* =========================================
          Header
      ========================================== */}
      <header className="relative z-20 border-b border-[#cad8d8]/70 bg-[#f3f6f5]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-5 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-70"
          >
            <div className="flex h-9 w-9 items-center justify-center">
              <img src="/deer.svg" alt="" className="h-7 w-7" />
            </div>

            <div>
              <div className="font-serif text-lg tracking-[0.2em]">
                ヨルトレード
              </div>

              <div className="text-[8px] tracking-[0.3em] text-[#819799]">
                会場で、個体さんと交換する。
              </div>
            </div>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 text-xs tracking-[0.1em] text-[#668083] transition hover:text-[#26383a]"
          >
            <ArrowLeft size={14} />
            戻る
          </Link>
        </div>
      </header>

      {/* =========================================
          Progress
      ========================================== */}
      <div className="relative z-10 border-b border-[#d3dfdf] bg-white/30">
        <div className="mx-auto max-w-5xl px-5 py-5 lg:px-8">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <ProgressStep
              number="01"
              label="基本情報"
              active
            />

            <ProgressLine />

            <ProgressStep
              number="02"
              label="写真"
            />

            <ProgressLine />

            <ProgressStep
              number="03"
              label="交換内容"
            />

            <ProgressLine />

            <ProgressStep
              number="04"
              label="受け渡し"
            />

            <ProgressLine />

            <ProgressStep
              number="05"
              label="確認"
            />
          </div>
        </div>
      </div>

      {/* =========================================
          Main
      ========================================== */}
      <section className="relative z-10 mx-auto max-w-5xl px-5 py-12 lg:px-8 lg:py-16">
        {/* Page title */}
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-8 bg-[#6f9799]" />

            <span className="text-[9px] tracking-[0.35em] text-[#789194]">
              TRADE REGISTRATION
            </span>
          </div>

          <h1 className="font-serif text-3xl tracking-[0.1em] sm:text-4xl">
            交換を登録する
          </h1>

          <p className="mt-4 max-w-xl text-xs leading-7 tracking-[0.08em] text-[#7a9092]">
            あなたが持っているものと、
            <br />
            誰かに渡したいものを教えてください。
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* =====================================
              Form
          ====================================== */}
          <div className="space-y-6">

            {/* ===================================
                01 基本情報
            ==================================== */}
            <section className="border border-[#cedcdc] bg-[#f9fbfa]/80 p-6 shadow-sm sm:p-8">
              <SectionHeading
                number="01"
                title="基本情報"
                description="交換するものについて教えてください。"
              />

              {/* Category */}
              <div className="mt-8">
                <label className="mb-3 block text-xs tracking-[0.08em]">
                  カテゴリ

                  <span className="ml-2 text-[#8aa0a2]">
                    必須
                  </span>
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {categories.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCategory(item)}
                      className={`border px-4 py-3 text-xs tracking-[0.08em] transition ${
                        category === item
                          ? "border-[#527b7e] bg-[#e3eceb] text-[#3e6063]"
                          : "border-[#d3dede] bg-white/60 text-[#7b9092] hover:bg-white"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Item name */}
              <div className="mt-7">
                <label className="mb-3 block text-xs tracking-[0.08em]">
                  グッズ名

                  <span className="ml-2 text-[#8aa0a2]">
                    必須
                  </span>
                </label>

                <input
                  type="text"
                  placeholder="例：千鳥 キーホルダー"
                  className="w-full border border-[#cedcdc] bg-white/70 px-4 py-3.5 text-sm outline-none transition placeholder:text-[#a7b5b6] focus:border-[#709294] focus:bg-white"
                />
              </div>

              {/* Description */}
              <div className="mt-7">
                <label className="mb-3 block text-xs tracking-[0.08em]">
                  詳細
                </label>

                <textarea
                  rows={4}
                  placeholder="キーホルダーについて伝えておきたいことがあれば記入してください。"
                  className="w-full resize-none border border-[#cedcdc] bg-white/70 px-4 py-3.5 text-sm leading-7 outline-none transition placeholder:text-[#a7b5b6] focus:border-[#709294] focus:bg-white"
                />
              </div>
            </section>

            {/* ===================================
                02 写真
            ==================================== */}
            <section className="border border-[#cedcdc] bg-[#f9fbfa]/80 p-6 shadow-sm sm:p-8">
              <SectionHeading
                number="02"
                title="写真"
                description="実物の写真があると、交換相手も安心できます。"
              />

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Uploaded images */}
                {images.map((image, index) => (
                  <div
                    key={image.url}
                    className="relative aspect-square overflow-hidden border border-[#cedcdc] bg-[#e8efee]"
                  >
                    <img src={image.url} alt={image.name} className="h-full w-full object-cover" />

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      aria-label="写真を削除"
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#385c60] text-white transition hover:bg-[#2d4e52]"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {/* Add image */}
                {images.length < 4 && (
                  <>
                    <label
                      htmlFor="photo-library"
                      className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-[#b9caca] bg-[#f0f5f4] text-[#789295] transition hover:bg-white"
                    >
                      <ImagePlus size={22} strokeWidth={1} />
                      <span className="text-center text-[9px] tracking-[0.08em]">写真を選ぶ</span>
                    </label>
                    <input
                      id="photo-library"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) => addImages(event.target.files)}
                      className="sr-only"
                    />

                    <label
                      htmlFor="photo-camera"
                      className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-[#b9caca] bg-[#f0f5f4] text-[#789295] transition hover:bg-white"
                    >
                      <ImagePlus size={22} strokeWidth={1} />
                      <span className="text-center text-[9px] tracking-[0.08em]">カメラで撮る</span>
                    </label>
                    <input
                      id="photo-camera"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(event) => addImages(event.target.files)}
                      className="sr-only"
                    />
                  </>
                )}
              </div>

              <p className="mt-4 text-[9px] leading-5 text-[#91a2a4]">
                最大4枚まで。交換するものが分かる写真を掲載してください。
              </p>
            </section>

            {/* ===================================
                03 探しているもの
            ==================================== */}
            <section className="border border-[#cedcdc] bg-[#f9fbfa]/80 p-6 shadow-sm sm:p-8">
              <SectionHeading
                number="03"
                title="探しているもの"
                description="どんなものとの交換を希望しますか？"
              />

              <div className="mt-8 space-y-2">
                {[
                  {
                    title: "特定のものを探している",
                    description: "欲しいグッズを指定する",
                  },
                  {
                    title: "同じカテゴリなら何でも",
                    description: "同じ種類のグッズと交換する",
                  },
                  {
                    title: "相談して決めたい",
                    description: "相手と相談して交換内容を決める",
                  },
                ].map((option) => (
                  <button
                    key={option.title}
                    type="button"
                    onClick={() => setWantType(option.title)}
                    className={`flex w-full items-center gap-4 border p-4 text-left transition ${
                      wantType === option.title
                        ? "border-[#709294] bg-[#e8f0ef]"
                        : "border-[#d4dfdf] bg-white/50 hover:bg-white"
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        wantType === option.title
                          ? "border-[#527b7e] bg-[#527b7e]"
                          : "border-[#aebfc0]"
                      }`}
                    >
                      {wantType === option.title && (
                        <Check
                          size={11}
                          className="text-white"
                        />
                      )}
                    </div>

                    <div>
                      <div className="text-xs tracking-[0.05em]">
                        {option.title}
                      </div>

                      <div className="mt-1 text-[9px] text-[#8a9d9f]">
                        {option.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Specific item */}
              {wantType === "特定のものを探している" && (
                <div className="mt-6">
                  <label className="mb-3 block text-xs tracking-[0.08em]">
                    探しているもの
                  </label>

                  <div className="relative">
                    <Search
                      size={16}
                      strokeWidth={1.2}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#91a5a7]"
                    />

                    <input
                      type="text"
                      placeholder="例：晴るのキーホルダー"
                      className="w-full border border-[#cedcdc] bg-white/70 py-3.5 pl-11 pr-4 text-sm outline-none placeholder:text-[#a7b5b6] focus:border-[#709294] focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Other requests */}
              <div className="mt-6">
                <label className="mb-3 block text-xs tracking-[0.08em]">
                  その他の希望
                </label>

                <textarea
                  rows={3}
                  placeholder="交換条件などがあれば記入してください。"
                  className="w-full resize-none border border-[#cedcdc] bg-white/70 px-4 py-3.5 text-sm leading-7 outline-none placeholder:text-[#a7b5b6] focus:border-[#709294] focus:bg-white"
                />
              </div>
            </section>

            {/* ===================================
                04 現地交換
            ==================================== */}
            <section className="border border-[#cedcdc] bg-[#f9fbfa]/80 p-6 shadow-sm sm:p-8">
              <SectionHeading
                number="04"
                title="受け渡し"
                description="交換は現地で直接行います。"
              />

              <div className="mt-8">
                <div className="border border-[#709294] bg-[#e7efee] p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d1e2e0] text-[#527b7e]">
                      <MapPin
                        size={20}
                        strokeWidth={1}
                      />
                    </div>

                    <div>
                      <div className="text-xs tracking-[0.06em]">
                        現地交換
                      </div>

                      <div className="mt-1 text-[9px] text-[#8a9d9f]">
                        ライブ・イベント会場など、実際に会って交換
                      </div>
                    </div>

                    <div className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#527b7e]">
                      <Check
                        size={11}
                        className="text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-3 border border-[#d6e1e1] bg-[#edf3f2] p-4">
                <Sparkles
                  size={16}
                  strokeWidth={1}
                  className="mt-0.5 shrink-0 text-[#648487]"
                />

                <p className="text-[9px] leading-5 text-[#748b8d]">
                  交換場所は相手とのやり取りの中で決めることができます。
                  安全のため、人の多い公共の場所での交換をおすすめします。
                </p>
              </div>
            </section>

            {/* ===================================
                Submit
            ==================================== */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Link
                href="/"
                className="flex items-center justify-center gap-2 border border-[#c6d6d6] bg-white/50 px-7 py-3.5 text-xs tracking-[0.1em] text-[#6d8587] transition hover:bg-white"
              >
                <ArrowLeft size={14} />
                キャンセル
              </Link>

              <button
                type="button"
                className="group flex items-center justify-center gap-3 bg-[#385c60] px-8 py-3.5 text-xs tracking-[0.12em] text-white shadow-lg shadow-[#385c60]/10 transition hover:bg-[#2d4e52]"
              >
                内容を確認する

                <ArrowRight
                  size={15}
                  className="transition group-hover:translate-x-1"
                />
              </button>
            </div>
          </div>

          {/* =====================================
              Sidebar
          ====================================== */}
          <aside className="hidden lg:block">
            <div className="sticky top-8 border border-[#cedcdc] bg-[#edf3f2]/80 p-6">
              <div className="mb-5 flex items-center gap-3">
                <img src="/deer.svg" alt="" className="h-[18px] w-[18px]" />

                <span className="font-serif text-sm tracking-[0.15em]">
                  登録する前に
                </span>
              </div>

              <div className="space-y-5">
                <Tip
                  number="01"
                  title="写真を用意する"
                  text="実物が分かる写真を掲載すると、交換相手が見つかりやすくなります。"
                />

                <Tip
                  number="02"
                  title="個人情報に注意"
                  text="住所や電話番号などの個人情報は写真に写さないでください。"
                />
              </div>

              <div className="mt-7 border-t border-[#d3dfdf] pt-5">
                <div className="flex items-center gap-2 text-[9px] text-[#82999b]">
                  <Search size={12} />

                  <span>
                    登録後は交換相手を探せます
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* =========================================
          Bottom CTA
      ========================================== */}
      <section className="relative z-10 border-t border-[#d0dddd] bg-[#e8f0ef]">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <div className="mb-5 flex justify-center">
            <img src="/deer.svg" alt="" className="h-6 w-6" />
          </div>

          <p className="text-[9px] tracking-[0.3em] text-[#82999b]">
            あなたの物が、個体さんにつながる。
          </p>

          <p className="mt-4 font-serif text-xl tracking-[0.1em] text-[#526f72]">
            大切なものを、大切にしてくれる人へ。
          </p>
        </div>
      </section>

      {/* =========================================
          Footer
      ========================================== */}
      <footer className="relative z-10 border-t border-[#d0dddd] bg-[#edf3f2]">
        <div className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-serif text-sm tracking-[0.18em]">
                ヨルトレード
              </div>

              <div className="mt-1 text-[8px] tracking-[0.2em] text-[#91a2a4]">
                会場で、個体さんと交換する。
              </div>
            </div>

            <Link
              href="/"
              className="text-[9px] tracking-[0.1em] text-[#82999b] transition hover:text-[#526f72]"
            >
              ホームへ戻る
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* =============================================
   Progress Step
============================================= */

function ProgressStep({
  number,
  label,
  active = false,
}: {
  number: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full text-[8px] ${
          active
            ? "bg-[#385c60] text-white"
            : "border border-[#c4d2d2] text-[#8ba0a2]"
        }`}
      >
        {number}
      </div>

      <span
        className={`hidden text-[9px] tracking-[0.08em] sm:block ${
          active
            ? "text-[#46676a]"
            : "text-[#8ea0a2]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

/* =============================================
   Progress Line
============================================= */

function ProgressLine() {
  return (
    <div className="h-px w-3 bg-[#cbd8d8] sm:w-8" />
  );
}

/* =============================================
   Section Heading
============================================= */

function SectionHeading({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <span className="pt-1 font-mono text-[9px] tracking-[0.1em] text-[#88a0a2]">
        {number}
      </span>

      <div>
        <h2 className="font-serif text-xl tracking-[0.08em]">
          {title}
        </h2>

        <p className="mt-2 text-[10px] leading-5 text-[#879a9c]">
          {description}
        </p>
      </div>
    </div>
  );
}

/* =============================================
   Sidebar Tip
============================================= */

function Tip({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="font-mono text-[8px] text-[#91a5a7]">
        {number}
      </span>

      <div>
        <div className="text-[10px] tracking-[0.08em]">
          {title}
        </div>

        <p className="mt-1.5 text-[9px] leading-5 text-[#879a9c]">
          {text}
        </p>
      </div>
    </div>
  );
}