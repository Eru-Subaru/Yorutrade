"use client";

import Image from "next/image";
import { useState } from "react";
import keychain01 from "../img/01. playsick.png";
import keychain02 from "../img/02. aporia.png";
import keychain03 from "../img/03. moonbath.png";
import keychain04 from "../img/04. mashou.png";
import keychain05 from "../img/05. hanamozawameku.png";
import keychain06 from "../img/06. shura.png";
import keychain07 from "../img/07. post haru.png";
import keychain08 from "../img/08. kumoninaru.png";
import keychain09 from "../img/09. kaseijin.png";
import keychain10 from "../img/10. wasuretekudasai.png";
import keychain11 from "../img/11. umeki.png";
import keychain12 from "../img/12. taiyou.png";
import keychain13 from "../img/13. haru.png";
import keychain14 from "../img/14. rubato.png";
import keychain15 from "../img/15. kasou.png";
import keychain16 from "../img/16. chidori.png";
import keychain17 from "../img/17. hebi.png";
import keychain18 from "../img/18. kai.png";
import keychain19 from "../img/19. hitchcock.png";
import keychain20 from "../img/20. kitsutsuki.png";
import pick01 from "../img/pick 01.png";
import pick02 from "../img/pick 02.png";
import pick03 from "../img/pick 03.png";
import pick04 from "../img/pick 04.png";
import pick05 from "../img/pick 05.png";
import pick06 from "../img/pick 06.png";
import pick07 from "../img/pick 07.png";
import pick08 from "../img/pick 08.png";
import pick09 from "../img/pick 09.png";
import pick10 from "../img/pick 10.png";

type Item = {
  id: number;
  name: string;
  image?: string | { src: string };
};

type GachaType = "keychain" | "pick";
type Mode = "want" | "offer";
type PageState =
  | "selection"
  | "searching"
  | "matched"
  | "chat"
  | "completed";

const keychainImages = [
  keychain01,
  keychain02,
  keychain03,
  keychain04,
  keychain05,
  keychain06,
  keychain07,
  keychain08,
  keychain09,
  keychain10,
  keychain11,
  keychain12,
  keychain13,
  keychain14,
  keychain15,
  keychain16,
  keychain17,
  keychain18,
  keychain19,
  keychain20,
];

const keychainNames = [
  "プレイシック",
  "アポリア",
  "月光浴",
  "魔性",
  "花も騒めく",
  "修羅",
  "ポスト春",
  "雲になる",
  "火星人",
  "忘れてください",
  "うめき",
  "太陽",
  "晴る",
  "ルバート",
  "火葬",
  "千鳥",
  "へび",
  "櫂",
  "ヒッチコック",
  "啄木鳥",
];

const keychains: Item[] = Array.from({ length: 20 }, (_, index) => ({
  id: index + 1,
  name: keychainNames[index],
  image: keychainImages[index],
}));

const pickImages = [
  pick01,
  pick02,
  pick03,
  pick04,
  pick05,
  pick06,
  pick07,
  pick08,
  pick09,
  pick10,
];

const guitarPicks: Item[] = Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  name: String(index + 1).padStart(2, "0"),
  image: pickImages[index],
}));

export default function Home() {
  const [gacha, setGacha] = useState<GachaType>("keychain");
  const [mode, setMode] = useState<Mode>("want");

  const [selectedWant, setSelectedWant] = useState<number[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<number[]>([]);

  const [showConfirmation, setShowConfirmation] = useState(false);

  const [pageState, setPageState] = useState<PageState>("selection");

  // Chat
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<
    {
      id: number;
      text: string;
      mine: boolean;
      time: string;
      images?: { url: string; name: string }[];
    }[]
  >([]);

  const [showMenu, setShowMenu] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  // Step 7
  const [showCompleteConfirmation, setShowCompleteConfirmation] =
    useState(false);

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

  /*
   * Temporary test function.
   * Later this will be replaced by the real
   * PostgreSQL matching system.
   */
  function handleFakeMatch() {
    setPageState("matched");
  }

  function handleOpenChat() {
    setPageState("chat");

    if (messages.length === 0) {
      setMessages([
        {
          id: 1,
          text: "こんにちは！",
          mine: false,
          time: "17:21",
        },
        {
          id: 2,
          text: "03と01の交換、大丈夫です！",
          mine: true,
          time: "17:22",
        },
        {
          id: 3,
          text: "ありがとうございます！",
          mine: false,
          time: "17:22",
        },
      ]);
    }
  }

  function sendMessage() {
    const trimmed = message.trim();

    if (!trimmed) return;

    const now = new Date();

    const time = now.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        text: trimmed,
        mine: true,
        time,
      },
    ]);

    setMessage("");
  }

  function sendImages(files: FileList | null) {
    if (!files?.length) return;

    const now = new Date();
    const time = now.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        text: "",
        images: Array.from(files).map((file) => ({
          url: URL.createObjectURL(file),
          name: file.name,
        })),
        mine: true,
        time,
      },
    ]);
    setShowAttachmentMenu(false);
  }

  function formatItems(itemIds: number[]) {
    return [...itemIds]
      .sort((a, b) => a - b)
      .map((id) => String(id).padStart(2, "0"))
      .join("　");
  }

  /*
   * ============================================================
   * STEP 1 — SELECTION
   * ============================================================
   */

  if (pageState === "selection") {
    return (
      <main className="min-h-screen bg-[#f3eee4] text-[#40382f]">
        <div className="mx-auto min-h-screen max-w-md border-x border-[#d5cbbb] bg-[#f7f3eb]">
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
                    <div className="flex h-full flex-col items-center justify-center p-2">
                      {item.image ? (
                        <Image
                          src={typeof item.image === "string" ? item.image : item.image.src}
                          alt={item.name}
                          width={64}
                          height={64}
                          unoptimized
                          className="h-16 w-16 rounded-full border border-[#c7baaa] object-cover"
                        />
                      ) : (
                        <div
                          className={`flex h-16 w-16 items-center justify-center rounded-full border font-serif text-lg ${
                            isSelected
                              ? "border-[#796a58] bg-[#d8cbb9]"
                              : "border-[#c7baaa] bg-[#e7dfd3]"
                          }`}
                        >
                          {item.name}
                        </div>
                      )}

                      <span className="mt-3 text-center text-[10px] tracking-[0.12em] text-[#776c5f]">
                        {item.name}
                      </span>
                    </div>

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

            <div className="py-7 text-center">
              <p className="text-[10px] tracking-[0.18em] text-[#9a8e80]">
                SELECTED
              </p>

              <p className="mt-2 min-h-7 font-serif text-lg">
                {selected.length === 0 ? "—" : formatItems(selected)}
              </p>
            </div>

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
        </div>

        {/* Confirmation */}
        {showConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#40382f]/30 px-5 backdrop-blur-[2px]">
            <div className="w-full max-w-sm border border-[#cfc3b4] bg-[#f7f3eb] px-6 py-7 shadow-xl">
              <div className="text-center">
                <p className="text-[10px] tracking-[0.3em] text-[#9a8e80]">
                  CONFIRM
                </p>

                <h2 className="mt-3 font-serif text-2xl tracking-[0.15em]">
                  交換内容の確認
                </h2>

                <div className="mx-auto mt-4 h-px w-8 bg-[#9b8c79]" />
              </div>

              <p className="mt-7 text-center text-xs tracking-[0.18em] text-[#766b5e]">
                {gacha === "keychain" ? "キーホルダー" : "ギターピック"}
              </p>

              <div className="mt-7 border-t border-[#ddd3c5] pt-5">
                <p className="font-serif text-lg tracking-[0.2em]">求</p>

                <p className="mt-3 text-center font-serif text-lg">
                  {formatItems(selectedWant)}
                </p>
              </div>

              <div className="mt-5 border-t border-[#ddd3c5] pt-5">
                <p className="font-serif text-lg tracking-[0.2em]">譲</p>

                <p className="mt-3 text-center font-serif text-lg">
                  {formatItems(selectedOffer)}
                </p>
              </div>

              <p className="mt-7 text-center text-xs leading-6 text-[#857a6d]">
                この内容で
                <br />
                交換相手を探します。
              </p>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="border border-[#c5b9aa] py-4 text-xs tracking-[0.18em] text-[#766b5e] hover:bg-[#eee8dd]"
                >
                  戻る
                </button>

                <button
                  onClick={handleSearch}
                  className="border border-[#6e5d4d] bg-[#6e5d4d] py-4 text-xs tracking-[0.18em] text-[#f8f4ec] hover:bg-[#594b3e]"
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

  /*
   * ============================================================
   * SEARCHING
   * ============================================================
   */

  if (pageState === "searching") {
    return (
      <main className="min-h-screen bg-[#f3eee4] text-[#40382f]">
        <div className="mx-auto flex min-h-screen max-w-md flex-col border-x border-[#d5cbbb] bg-[#f7f3eb]">
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
                条件の合う交換相手を
                <br />
                探しています。
              </p>
            </div>

            <div className="border-y border-[#d5cbbb] py-8">
              <div className="mb-7 text-center">
                <p className="text-[10px] tracking-[0.25em] text-[#9a8e80]">
                  {gacha === "keychain" ? "キーホルダー" : "ギターピック"}
                </p>
              </div>

              <div className="text-center">
                <p className="font-serif text-xl tracking-[0.2em]">求</p>
                <p className="mt-3 font-serif text-lg">
                  {formatItems(selectedWant)}
                </p>
              </div>

              <div className="mx-auto my-7 h-px w-8 bg-[#cfc3b4]" />

              <div className="text-center">
                <p className="font-serif text-xl tracking-[0.2em]">譲</p>
                <p className="mt-3 font-serif text-lg">
                  {formatItems(selectedOffer)}
                </p>
              </div>
            </div>

            <div className="py-8">
              <button
                onClick={handleEdit}
                className="w-full border border-[#8e8172] bg-transparent py-4 text-sm tracking-[0.2em] text-[#66594c] hover:bg-[#eee8dd]"
              >
                内容を変更
              </button>

              <button
                onClick={handleFakeMatch}
                className="mt-5 w-full py-3 text-[10px] tracking-[0.18em] text-[#aaa092] underline underline-offset-4"
              >
                テスト：マッチを発生させる
              </button>
            </div>

            <div className="flex-1" />

            <footer className="border-t border-[#d5cbbb] px-6 py-8 text-center">
              <p className="text-[9px] tracking-[0.3em] text-[#9b8f81]">
                YORUTRADE
              </p>
            </footer>
          </section>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * MATCH FOUND
   * ============================================================
   */

  if (pageState === "matched") {
    const myOffer = selectedOffer[0] ?? 3;
    const myWant = selectedWant[0] ?? 1;

    return (
      <main className="min-h-screen bg-[#f3eee4] text-[#40382f]">
        <div className="mx-auto flex min-h-screen max-w-md flex-col border-x border-[#d5cbbb] bg-[#f7f3eb]">
          <header className="px-6 pb-7 pt-10 text-center">
            <p className="mb-3 text-[10px] tracking-[0.35em] text-[#8c8173]">
              YORUTRADE
            </p>

            <div className="mx-auto h-px w-12 bg-[#9b8c79]" />
          </header>

          <section className="flex flex-1 flex-col px-6">
            <div className="py-8 text-center">
              <p className="font-serif text-2xl tracking-[0.16em]">
                交換相手が
                <br />
                見つかりました
              </p>

              <p className="mt-4 text-xs text-[#8c8173]">
                条件の合う交換が見つかりました。
              </p>
            </div>

            <div className="border-y border-[#d5cbbb] py-8">
              <p className="text-center text-[10px] tracking-[0.25em] text-[#9a8e80]">
                {gacha === "keychain" ? "キーホルダー" : "ギターピック"}
              </p>

              <div className="mt-8 flex items-center justify-center gap-5">
                <div className="text-center">
                  <p className="text-[10px] tracking-[0.15em] text-[#9a8e80]">
                    あなた
                  </p>

                  <div className="mx-auto mt-3 flex h-20 w-20 items-center justify-center rounded-full border border-[#796a58] bg-[#e4dacb] font-serif text-2xl">
                    {String(myOffer).padStart(2, "0")}
                  </div>

                  <p className="mt-3 text-[10px] tracking-[0.15em] text-[#766b5e]">
                    譲る
                  </p>
                </div>

                <div className="text-xl text-[#8b7c6b]">⇄</div>

                <div className="text-center">
                  <p className="text-[10px] tracking-[0.15em] text-[#9a8e80]">
                    交換相手
                  </p>

                  <div className="mx-auto mt-3 flex h-20 w-20 items-center justify-center rounded-full border border-[#796a58] bg-[#e4dacb] font-serif text-2xl">
                    {String(myWant).padStart(2, "0")}
                  </div>

                  <p className="mt-3 text-[10px] tracking-[0.15em] text-[#766b5e]">
                    譲る
                  </p>
                </div>
              </div>

              <div className="mt-8 border-t border-[#ddd3c5] pt-6 text-center">
                <p className="text-xs text-[#857a6d]">あなたが譲る</p>

                <p className="mt-1 font-serif text-lg">
                  {formatItems(selectedOffer)}
                </p>

                <div className="mx-auto my-4 h-px w-6 bg-[#cfc3b4]" />

                <p className="text-xs text-[#857a6d]">相手が譲る</p>

                <p className="mt-1 font-serif text-lg">
                  {formatItems(selectedWant)}
                </p>
              </div>
            </div>

            <div className="py-7 text-center">
              <p className="text-[10px] tracking-[0.18em] text-[#9a8e80]">
                匿名の交換相手です
              </p>

              <p className="mt-3 text-xs leading-6 text-[#958a7d]">
                チャットで場所や時間を
                <br />
                相談してください。
              </p>
            </div>

            <button
              onClick={handleOpenChat}
              className="w-full border border-[#6e5d4d] bg-[#6e5d4d] py-4 text-sm tracking-[0.2em] text-[#f8f4ec] hover:bg-[#594b3e]"
            >
              チャットする
            </button>

            <div className="flex-1" />
          </section>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * STEP 6 — CHAT
   * ============================================================
   */

  if (pageState === "chat") {
    return (
      <main className="min-h-screen bg-[#f3eee4] text-[#40382f]">
        <div className="mx-auto flex min-h-screen max-w-md flex-col border-x border-[#d5cbbb] bg-[#f7f3eb]">
          {/* Header */}
          <header className="relative border-b border-[#d5cbbb] px-5 py-5">
            <div className="flex items-center">
              <button
                onClick={() => setPageState("matched")}
                className="mr-4 text-lg text-[#766b5e]"
              >
                ←
              </button>

              <div className="flex-1">
                <p className="text-[10px] tracking-[0.2em] text-[#9a8e80]">
                  交換
                </p>

                <p className="mt-1 font-serif text-lg tracking-[0.12em]">
                  {String(selectedOffer[0] ?? 3).padStart(2, "0")} ⇄{" "}
                  {String(selectedWant[0] ?? 1).padStart(2, "0")}
                </p>
              </div>

              <button
                onClick={() => setShowMenu((current) => !current)}
                className="px-2 text-xl text-[#766b5e]"
              >
                ⋯
              </button>
            </div>

            {showMenu && (
              <div className="absolute right-4 top-16 z-20 w-48 border border-[#d1c5b6] bg-[#f7f3eb] shadow-lg">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setPageState("matched");
                  }}
                  className="block w-full border-b border-[#ddd3c5] px-4 py-4 text-left text-xs tracking-[0.08em] text-[#766b5e] hover:bg-[#eee8dd]"
                >
                  この交換をキャンセル
                </button>

                <button
                  onClick={() => setShowMenu(false)}
                  className="block w-full px-4 py-4 text-left text-xs tracking-[0.08em] text-[#766b5e] hover:bg-[#eee8dd]"
                >
                  相手を報告
                </button>
              </div>
            )}
          </header>

          {/* Status */}
          <div className="border-b border-[#d5cbbb] px-5 py-3 text-center">
            <span className="text-[10px] tracking-[0.18em] text-[#9a8e80]">
              ● 交換前
            </span>
          </div>

          {/* Messages */}
          <section className="flex-1 overflow-y-auto px-5 py-7">
            <div className="mb-8 text-center">
              <p className="text-[10px] tracking-[0.18em] text-[#aaa092]">
                匿名の交換相手
              </p>
            </div>

            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.mine ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[78%] ${
                      msg.mine ? "text-right" : "text-left"
                    }`}
                  >
                    <div
                      className={`inline-block border px-4 py-3 text-sm leading-6 ${
                        msg.mine
                          ? "border-[#d1c4b4] bg-[#e8dfd3]"
                          : "border-[#ddd3c5] bg-[#f1ece4]"
                      }`}
                    >
                      {msg.images && (
                        <div className="grid max-w-[15rem] grid-cols-2 gap-2">
                          {msg.images.map((image) => (
                            <Image
                              key={image.url}
                              src={image.url}
                              alt={image.name}
                              width={120}
                              height={120}
                              unoptimized
                              className="aspect-square w-full object-cover"
                            />
                          ))}
                        </div>
                      )}

                      {msg.text && <span>{msg.text}</span>}
                    </div>

                    <p className="mt-1 text-[9px] text-[#aaa092]">
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Complete trade */}
          <div className="border-t border-[#d5cbbb] px-5 py-4 text-center">
            <button
              onClick={() => setShowCompleteConfirmation(true)}
              className="text-[10px] tracking-[0.15em] text-[#8c8173] underline underline-offset-4"
            >
              交換済みにする
            </button>
          </div>

          {/* Input */}
          <div className="relative border-t border-[#d5cbbb] bg-[#f7f3eb] px-4 py-3">
            <input
              id="chat-photo-library"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                sendImages(event.target.files);
                event.target.value = "";
              }}
            />

            <input
              id="chat-photo-camera"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                sendImages(event.target.files);
                event.target.value = "";
              }}
            />

            {showAttachmentMenu && (
              <div className="absolute bottom-20 left-4 z-20 w-44 border border-[#d1c5b6] bg-[#f7f3eb] shadow-lg">
                <label
                  htmlFor="chat-photo-camera"
                  className="block cursor-pointer border-b border-[#ddd3c5] px-4 py-3 text-xs tracking-[0.08em] text-[#766b5e] hover:bg-[#eee8dd]"
                >
                  カメラで撮影
                </label>

                <label
                  htmlFor="chat-photo-library"
                  className="block cursor-pointer px-4 py-3 text-xs tracking-[0.08em] text-[#766b5e] hover:bg-[#eee8dd]"
                >
                  ライブラリから選択
                </label>
              </div>
            )}

            <div className="flex items-end gap-2">
              <button
                onClick={() =>
                  setShowAttachmentMenu((current) => !current)
                }
                aria-label="写真を追加"
                className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#cfc3b4] text-lg text-[#766b5e] hover:bg-[#eee8dd]"
              >
                +
              </button>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="メッセージ…"
                rows={1}
                className="max-h-28 min-h-11 flex-1 resize-none border border-[#cfc3b4] bg-[#f1ece4] px-4 py-3 text-sm text-[#40382f] outline-none placeholder:text-[#aaa092] focus:border-[#8e8172]"
              />

              <button
                onClick={sendMessage}
                disabled={!message.trim()}
                className={`flex h-11 w-11 shrink-0 items-center justify-center border ${
                  message.trim()
                    ? "border-[#6e5d4d] bg-[#6e5d4d] text-[#f8f4ec]"
                    : "border-[#d3c8b9] bg-[#e6dfd4] text-[#aaa092]"
                }`}
              >
                ↑
              </button>
            </div>

            <p className="mt-2 px-1 text-[9px] leading-4 text-[#aaa092]">
              場所や時間はご自身で相談してください。
            </p>
          </div>

          {/* Complete confirmation modal */}
          {showCompleteConfirmation && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#40382f]/30 px-5 backdrop-blur-[2px]">
              <div className="w-full max-w-sm border border-[#cfc3b4] bg-[#f7f3eb] px-6 py-7 shadow-xl">
                <div className="text-center">
                  <p className="text-[10px] tracking-[0.3em] text-[#9a8e80]">
                    COMPLETE
                  </p>

                  <h2 className="mt-3 font-serif text-2xl tracking-[0.15em]">
                    交換を完了しますか？
                  </h2>

                  <div className="mx-auto mt-4 h-px w-8 bg-[#9b8c79]" />
                </div>

                <div className="mt-7 border-y border-[#ddd3c5] py-6 text-center">
                  <p className="font-serif text-xl tracking-[0.2em]">
                    {String(selectedOffer[0] ?? 3).padStart(2, "0")}
                    <span className="mx-3 text-[#8b7c6b]">⇄</span>
                    {String(selectedWant[0] ?? 1).padStart(2, "0")}
                  </p>

                  <p className="mt-4 text-xs leading-6 text-[#857a6d]">
                    実際に交換が完了した場合のみ
                    <br />
                    「交換完了」を押してください。
                  </p>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowCompleteConfirmation(false)}
                    className="border border-[#c5b9aa] py-4 text-xs tracking-[0.18em] text-[#766b5e] hover:bg-[#eee8dd]"
                  >
                    戻る
                  </button>

                  <button
                    onClick={() => {
                      setShowCompleteConfirmation(false);
                      setPageState("completed");
                    }}
                    className="border border-[#6e5d4d] bg-[#6e5d4d] py-4 text-xs tracking-[0.18em] text-[#f8f4ec] hover:bg-[#594b3e]"
                  >
                    交換完了
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * STEP 7 — COMPLETED
   * ============================================================
   */

  return (
    <main className="min-h-screen bg-[#f3eee4] text-[#40382f]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col border-x border-[#d5cbbb] bg-[#f7f3eb]">
        <header className="px-6 pb-7 pt-10 text-center">
          <p className="mb-3 text-[10px] tracking-[0.35em] text-[#8c8173]">
            YORUTRADE
          </p>

          <div className="mx-auto h-px w-12 bg-[#9b8c79]" />
        </header>

        <section className="flex flex-1 flex-col px-6">
          <div className="py-14 text-center">
            {/* Simple completion mark */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#9b8c79]">
              <span className="font-serif text-3xl text-[#6e5d4d]">✓</span>
            </div>

            <p className="mt-8 font-serif text-2xl tracking-[0.18em]">
              交換が
              <br />
              完了しました
            </p>

            <p className="mt-5 text-xs leading-6 text-[#8c8173]">
              おつかれさまでした。
              <br />
              無事に交換できました。
            </p>
          </div>

          {/* Trade summary */}
          <div className="border-y border-[#d5cbbb] py-8 text-center">
            <p className="text-[10px] tracking-[0.25em] text-[#9a8e80]">
              {gacha === "keychain" ? "キーホルダー" : "ギターピック"}
            </p>

            <div className="mt-6 flex items-center justify-center gap-5">
              <div>
                <p className="text-[10px] tracking-[0.15em] text-[#9a8e80]">
                  あなた
                </p>

                <div className="mx-auto mt-3 flex h-16 w-16 items-center justify-center rounded-full border border-[#796a58] bg-[#e4dacb] font-serif text-xl">
                  {String(selectedOffer[0] ?? 3).padStart(2, "0")}
                </div>
              </div>

              <span className="text-xl text-[#8b7c6b]">⇄</span>

              <div>
                <p className="text-[10px] tracking-[0.15em] text-[#9a8e80]">
                  相手
                </p>

                <div className="mx-auto mt-3 flex h-16 w-16 items-center justify-center rounded-full border border-[#796a58] bg-[#e4dacb] font-serif text-xl">
                  {String(selectedWant[0] ?? 1).padStart(2, "0")}
                </div>
              </div>
            </div>

            <p className="mt-6 text-[10px] tracking-[0.18em] text-[#9a8e80]">
              匿名での交換
            </p>
          </div>

          {/* Future options */}
          <div className="py-8 text-center">
            <p className="text-[10px] tracking-[0.18em] text-[#aaa092]">
              THANK YOU
            </p>

            <p className="mt-3 text-xs leading-6 text-[#958a7d]">
              また交換したくなったら
              <br />
              いつでも利用してください。
            </p>
          </div>

          <div className="mt-auto pb-10">
            <button
              onClick={() => {
                setSelectedWant([]);
                setSelectedOffer([]);
                setMessages([]);
                setPageState("selection");
              }}
              className="w-full border border-[#6e5d4d] bg-[#6e5d4d] py-4 text-sm tracking-[0.2em] text-[#f8f4ec] hover:bg-[#594b3e]"
            >
              もう一度交換相手を探す
            </button>
          </div>

          <footer className="border-t border-[#d5cbbb] px-6 py-8 text-center">
            <p className="text-[9px] tracking-[0.3em] text-[#9b8f81]">
              YORUTRADE
            </p>
          </footer>
        </section>
      </div>
    </main>
  );
}