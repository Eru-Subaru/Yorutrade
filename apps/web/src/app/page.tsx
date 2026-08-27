"use client";

import { useState } from "react";

type Item = {
  id: number;
  name: string;
};

type GachaType = "keychain" | "pick";
type Mode = "want" | "offer";
type PageState = "selection" | "searching";

const keychains: Item[] = Array.from({ length: 20 }, (_, index) => ({
  id: index + 1,
  name: String(index + 1).padStart(2, "0"),
}));

const guitarPicks: Item[] = Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  name: String(index + 1).padStart(2, "0"),
}));

export default function Home() {
  const [gacha, setGacha] = useState<GachaType>("keychain");
  const [mode, setMode] = useState<Mode>("want");

  const [selectedWant, setSelectedWant] = useState<number[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<number[]>([]);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pageState, setPageState] = useState<PageState>("selection");

  const items = gacha === "keychain" ? keychains : guitarPicks;

  const selected = mode === "want" ? selectedWant : selectedOffer;

  function toggleItem(id: number) {
    if (mode === "want") {
      setSelectedWant((current) =>
        current.includes(id)
          ? current.filter((item) => item !== id)
          : [...current, id]
      );
    } else {
      setSelectedOffer((current) =>
        current.includes(id)
          ? current.filter((item) => item !== id)
          : [...current, id]
      );
    }
  }

  function handleSearch() {
    setShowConfirmation(false);
    setPageState("searching");
  }

  function handleEdit() {
    setPageState("selection");
  }

  function formatItems(itemIds: number[]) {
    return itemIds
      .sort((a, b) => a - b)
      .map((id) => String(id).padStart(2, "0"))
      .join("　");
  }

  return (
    <main className="min-h-screen bg-[#f3eee4] text-[#40382f]">
      <div className="mx-auto min-h-screen max-w-md border-x border-[#d5cbbb] bg-[#f7f3eb]">
        {/* =========================================================
            SELECTION PAGE
        ========================================================= */}
        {pageState === "selection" && (
          <>
            {/* Header */}
            <header className="px-6 pb-8 pt-10 text-center">
              <p className="mb-3 text-[10px] tracking-[0.35em] text-[#8c8173]">
                YORUTRADE
              </p>

              <h1 className="font-serif text-3xl tracking-[0.18em]">
                交換帖
              </h1>

              <div className="mx-auto mt-4 h-px w-12 bg-[#9b8c79]" />

              <p className="mt-4 text-xs leading-6 text-[#857a6d]">
                あなたの「求」と「譲」を
                <br />
                選んでください。
              </p>
            </header>

            {/* Gacha selection */}
            <section className="border-y border-[#d5cbbb]">
              <div className="grid grid-cols-2">
                <button
                  onClick={() => setGacha("keychain")}
                  className={`border-r border-[#d5cbbb] px-4 py-5 text-sm tracking-[0.18em] transition ${
                    gacha === "keychain"
                      ? "bg-[#e7dfd2] text-[#40382f]"
                      : "text-[#9a8e80] hover:bg-[#f0ebe2]"
                  }`}
                >
                  キーホルダー
                </button>

                <button
                  onClick={() => setGacha("pick")}
                  className={`px-4 py-5 text-sm tracking-[0.18em] transition ${
                    gacha === "pick"
                      ? "bg-[#e7dfd2] text-[#40382f]"
                      : "text-[#9a8e80] hover:bg-[#f0ebe2]"
                  }`}
                >
                  ギターピック
                </button>
              </div>
            </section>

            {/* Want / Offer */}
            <section className="px-5 pt-7">
              <div className="flex border-b border-[#cfc4b5]">
                <button
                  onClick={() => setMode("want")}
                  className={`relative flex-1 pb-4 text-center font-serif text-2xl tracking-[0.25em] ${
                    mode === "want" ? "text-[#40382f]" : "text-[#aaa092]"
                  }`}
                >
                  求

                  {mode === "want" && (
                    <span className="absolute bottom-0 left-1/2 h-px w-10 -translate-x-1/2 bg-[#5c5145]" />
                  )}
                </button>

                <button
                  onClick={() => setMode("offer")}
                  className={`relative flex-1 pb-4 text-center font-serif text-2xl tracking-[0.25em] ${
                    mode === "offer" ? "text-[#40382f]" : "text-[#aaa092]"
                  }`}
                >
                  譲

                  {mode === "offer" && (
                    <span className="absolute bottom-0 left-1/2 h-px w-10 -translate-x-1/2 bg-[#5c5145]" />
                  )}
                </button>
              </div>

              <div className="py-5 text-center">
                <p className="text-xs tracking-[0.12em] text-[#766b5e]">
                  {mode === "want"
                    ? "欲しいものを選んでください"
                    : "譲れるものを選んでください"}
                </p>
              </div>

              {/* Items */}
              <div className="grid grid-cols-3 gap-3">
                {items.map((item) => {
                  const isSelected = selected.includes(item.id);

                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={`group relative aspect-square overflow-hidden border transition ${
                        isSelected
                          ? "border-[#6e5d4d] bg-[#e4dacb]"
                          : "border-[#d8cdbd] bg-[#eee8dd] hover:border-[#aa9c8a]"
                      }`}
                    >
                      {/* Image placeholder */}
                      <div className="flex h-full flex-col items-center justify-center">
                        <div
                          className={`flex h-16 w-16 items-center justify-center rounded-full border font-serif text-lg ${
                            isSelected
                              ? "border-[#796a58] bg-[#d8cbb9]"
                              : "border-[#c7baaa] bg-[#e7dfd3]"
                          }`}
                        >
                          {item.name}
                        </div>

                        <span className="mt-3 text-[10px] tracking-[0.2em] text-[#776c5f]">
                          ITEM
                        </span>
                      </div>

                      {/* Selection mark */}
                      <span
                        className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center border text-[10px] ${
                          isSelected
                            ? "border-[#625344] bg-[#625344] text-[#f7f3eb]"
                            : "border-[#b8aa98] text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Current selection */}
              <div className="py-7 text-center">
                <p className="text-[10px] tracking-[0.18em] text-[#9a8e80]">
                  SELECTED
                </p>

                <p className="mt-2 min-h-7 font-serif text-lg">
                  {selected.length === 0 ? "—" : formatItems(selected)}
                </p>
              </div>

              {/* Search button */}
              <button
                onClick={() => setShowConfirmation(true)}
                disabled={
                  selectedWant.length === 0 || selectedOffer.length === 0
                }
                className={`mb-10 w-full border py-4 text-sm tracking-[0.2em] transition ${
                  selectedWant.length > 0 && selectedOffer.length > 0
                    ? "border-[#6e5d4d] bg-[#6e5d4d] text-[#f8f4ec] hover:bg-[#594b3e]"
                    : "cursor-not-allowed border-[#d3c8b9] bg-[#e6dfd4] text-[#aaa092]"
                }`}
              >
                交換相手を探す
              </button>
            </section>

            {/* Footer */}
            <footer className="border-t border-[#d5cbbb] px-6 py-8 text-center">
              <p className="text-[9px] tracking-[0.3em] text-[#9b8f81]">
                YORUTRADE
              </p>

              <p className="mt-3 text-[10px] leading-5 text-[#aaa092]">
                匿名で利用できます。
                <br />
                交換相手と出会うための場所です。
              </p>
            </footer>
          </>
        )}

        {/* =========================================================
            SEARCHING PAGE
        ========================================================= */}
        {pageState === "searching" && (
          <div className="flex min-h-screen flex-col">
            {/* Header */}
            <header className="px-6 pb-8 pt-10 text-center">
              <p className="mb-3 text-[10px] tracking-[0.35em] text-[#8c8173]">
                YORUTRADE
              </p>

              <h1 className="font-serif text-3xl tracking-[0.18em]">
                交換帖
              </h1>

              <div className="mx-auto mt-4 h-px w-12 bg-[#9b8c79]" />
            </header>

            <section className="flex flex-1 flex-col px-6">
              {/* Status */}
              <div className="py-10 text-center">
                <p className="font-serif text-2xl tracking-[0.18em]">
                  交換相手を
                  <br />
                  探しています
                </p>

                <div className="mt-6 flex justify-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-[#817365]" />
                  <span className="h-1 w-1 rounded-full bg-[#a99d8e]" />
                  <span className="h-1 w-1 rounded-full bg-[#c4b8a9]" />
                </div>

                <p className="mt-6 text-xs leading-6 text-[#8c8173]">
                  条件の合う交換相手が見つかるまで
                  <br />
                  このページを開いておいてください。
                </p>
              </div>

              {/* Trade summary */}
              <div className="border-y border-[#d5cbbb] py-8">
                <div className="mb-7 text-center">
                  <p className="text-[10px] tracking-[0.25em] text-[#9a8e80]">
                    {gacha === "keychain" ? "キーホルダー" : "ギターピック"}
                  </p>
                </div>

                {/* Want */}
                <div className="text-center">
                  <p className="font-serif text-xl tracking-[0.2em]">求</p>

                  <p className="mt-3 font-serif text-lg">
                    {formatItems(selectedWant)}
                  </p>
                </div>

                <div className="mx-auto my-7 h-px w-8 bg-[#cfc3b4]" />

                {/* Offer */}
                <div className="text-center">
                  <p className="font-serif text-xl tracking-[0.2em]">譲</p>

                  <p className="mt-3 font-serif text-lg">
                    {formatItems(selectedOffer)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="py-8">
                <button
                  onClick={handleEdit}
                  className="w-full border border-[#8e8172] bg-transparent py-4 text-sm tracking-[0.2em] text-[#66594c] transition hover:bg-[#eee8dd]"
                >
                  内容を変更
                </button>

                {/* Temporary testing button */}
                <button
                  onClick={() =>
                    alert(
                      "マッチング機能はまだ実装されていません。\n次のステップで作成します。"
                    )
                  }
                  className="mt-4 w-full py-3 text-[10px] tracking-[0.18em] text-[#aaa092] underline underline-offset-4"
                >
                  テスト：マッチを発生させる
                </button>
              </div>

              <div className="flex-1" />

              {/* Footer */}
              <footer className="border-t border-[#d5cbbb] px-6 py-8 text-center">
                <p className="text-[9px] tracking-[0.3em] text-[#9b8f81]">
                  YORUTRADE
                </p>

                <p className="mt-3 text-[10px] leading-5 text-[#aaa092]">
                  匿名で利用できます。
                </p>
              </footer>
            </section>
          </div>
        )}
      </div>

      {/* =========================================================
          CONFIRMATION MODAL
      ========================================================= */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#40382f]/30 px-5 backdrop-blur-[2px]">
          <div className="w-full max-w-sm border border-[#cfc3b4] bg-[#f7f3eb] px-6 py-7 shadow-xl">
            {/* Modal title */}
            <div className="text-center">
              <p className="text-[10px] tracking-[0.3em] text-[#9a8e80]">
                CONFIRM
              </p>

              <h2 className="mt-3 font-serif text-2xl tracking-[0.15em]">
                交換内容の確認
              </h2>

              <div className="mx-auto mt-4 h-px w-8 bg-[#9b8c79]" />
            </div>

            {/* Gacha type */}
            <p className="mt-7 text-center text-xs tracking-[0.18em] text-[#766b5e]">
              {gacha === "keychain" ? "キーホルダー" : "ギターピック"}
            </p>

            {/* Want */}
            <div className="mt-7 border-t border-[#ddd3c5] pt-5">
              <p className="font-serif text-lg tracking-[0.2em]">求</p>

              <p className="mt-3 text-center font-serif text-lg">
                {formatItems(selectedWant)}
              </p>
            </div>

            {/* Offer */}
            <div className="mt-5 border-t border-[#ddd3c5] pt-5">
              <p className="font-serif text-lg tracking-[0.2em]">譲</p>

              <p className="mt-3 text-center font-serif text-lg">
                {formatItems(selectedOffer)}
              </p>
            </div>

            {/* Explanation */}
            <p className="mt-7 text-center text-xs leading-6 text-[#857a6d]">
              この内容で
              <br />
              交換相手を探します。
            </p>

            {/* Modal buttons */}
            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="border border-[#c5b9aa] bg-transparent py-4 text-xs tracking-[0.18em] text-[#766b5e] transition hover:bg-[#eee8dd]"
              >
                戻る
              </button>

              <button
                onClick={handleSearch}
                className="border border-[#6e5d4d] bg-[#6e5d4d] py-4 text-xs tracking-[0.18em] text-[#f8f4ec] transition hover:bg-[#594b3e]"
              >
                交換相手を探す
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}