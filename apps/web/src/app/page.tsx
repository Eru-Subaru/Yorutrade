"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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

type LocalImage = string | { src: string };

type Item = {
  id: string;
  name: string;
  category: "KEYCHAIN" | "PICK";
  image_url?: string | null;
  image?: LocalImage;
};

type GachaType = "keychain" | "pick";
type Mode = "want" | "offer";

type PageState =
  | "selection"
  | "searching"
  | "matched"
  | "chat"
  | "completed";

type ChatMessage = {
  id: number;
  text: string;
  mine: boolean;
  time: string;
  images?: {
    url: string;
    name: string;
  }[];
};

const keychainImageMap: Record<string, LocalImage> = {
  プレイシック: keychain01,
  アポリア: keychain02,
  月光浴: keychain03,
  魔性: keychain04,
  花も騒めく: keychain05,
  修羅: keychain06,
  ポスト春: keychain07,
  雲になる: keychain08,
  火星人: keychain09,
  忘れてください: keychain10,
  うめき: keychain11,
  太陽: keychain12,
  晴る: keychain13,
  ルバート: keychain14,
  火葬: keychain15,
  千鳥: keychain16,
  へび: keychain17,
  櫂: keychain18,
  ヒッチコック: keychain19,
  啄木鳥: keychain20,
};

const pickImageMap: Record<string, LocalImage> = {
  "01": pick01,
  "02": pick02,
  "03": pick03,
  "04": pick04,
  "05": pick05,
  "06": pick06,
  "07": pick07,
  "08": pick08,
  "09": pick09,
  "10": pick10,
};

export default function Home() {
  const [gacha, setGacha] = useState<GachaType>("keychain");
  const [mode, setMode] = useState<Mode>("want");

  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  const [selectedWant, setSelectedWant] = useState<string[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<string[]>([]);

  const [showConfirmation, setShowConfirmation] = useState(false);

  const [pageState, setPageState] =
    useState<PageState>("selection");

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: "こんにちは！",
      mine: false,
      time: "12:01",
    },
    {
      id: 2,
      text: "03と01の交換、大丈夫です！",
      mine: false,
      time: "12:02",
    },
    {
      id: 3,
      text: "ありがとうございます！",
      mine: true,
      time: "12:03",
    },
  ]);

  const [showMenu, setShowMenu] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] =
    useState(false);
  const [showCompleteConfirmation, setShowCompleteConfirmation] =
    useState(false);

  /*
   * Load items from PostgreSQL through /api/items
   */
  useEffect(() => {
    async function loadItems() {
      try {
        setLoadingItems(true);

        const response = await fetch("/api/items", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || "Failed to fetch items"
          );
        }

        const normalizedItems: Item[] = data.items.map(
          (item: Item) => ({
            ...item,
            image:
              item.image_url ||
              (item.category === "KEYCHAIN"
                ? keychainImageMap[item.name]
                : pickImageMap[item.name]),
          })
        );

        setItems(normalizedItems);
      } catch (error) {
        console.error("Failed to load items:", error);
      } finally {
        setLoadingItems(false);
      }
    }

    loadItems();
  }, []);

  /*
   * Items for the currently selected gacha.
   */
  const currentItems = items.filter(
    (item) =>
      item.category ===
      (gacha === "keychain" ? "KEYCHAIN" : "PICK")
  );

  /*
   * Get the display number of an item.
   *
   * Database uses UUIDs, but the UI uses 01, 02, 03...
   */
  function getDisplayNumber(id?: string) {
    if (!id) {
      return "--";
    }

    const index = currentItems.findIndex(
      (item) => item.id === id
    );

    if (index === -1) {
      return "--";
    }

    return String(index + 1).padStart(2, "0");
  }

  /*
   * Convert selected UUIDs into display numbers.
   *
   * Example:
   * [
   *   "632dda4b-08a0-41a1-9606-16eac1fb58f9",
   *   "2b8fd8cd-3c1b-4c70-a984-2c961d56a6f5"
   * ]
   *
   * becomes:
   * "01　02"
   */
  function formatItems(itemIds: string[]) {
    return itemIds
      .map((id) => {
        const index = currentItems.findIndex(
          (item) => item.id === id
        );

        return index;
      })
      .filter((index) => index >= 0)
      .sort((a, b) => a - b)
      .map((index) =>
        String(index + 1).padStart(2, "0")
      )
      .join("　");
  }

  /*
   * Select / deselect an item.
   *
   * IMPORTANT:
   * id is now a PostgreSQL UUID string.
   */
  function toggleItem(id: string) {
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

  /*
   * Open confirmation modal.
   */
  function handleOpenConfirmation() {
    if (
      selectedWant.length === 0 ||
      selectedOffer.length === 0
    ) {
      return;
    }

    setShowConfirmation(true);
  }

  /*
   * Fake search for now.
   *
   * Later this will POST listings to PostgreSQL.
   */
  function handleSearch() {
    setShowConfirmation(false);
    setPageState("searching");
  }

  /*
   * Return from searching to edit selections.
   */
  function handleEdit() {
    setPageState("selection");
  }

  /*
   * Fake match.
   */
  function handleFakeMatch() {
    setPageState("matched");
  }

  /*
   * Open chat.
   */
  function handleOpenChat() {
    setPageState("chat");
  }

  /*
   * Send text message.
   */
  function sendMessage() {
    const trimmed = message.trim();

    if (!trimmed) {
      return;
    }

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

  /*
   * Add photos locally for now.
   *
   * Later this will upload to Cloudflare R2
   * and save the storage key in PostgreSQL.
   */
  function sendImages(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    const now = new Date();

    const time = now.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const images = Array.from(files).map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
    }));

    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        text: "",
        mine: true,
        time,
        images,
      },
    ]);

    setShowAttachmentMenu(false);
  }

  /*
   * Complete exchange.
   */
  function handleComplete() {
    setShowCompleteConfirmation(false);
    setPageState("completed");
  }

  /*
   * ---------------------------------------------------------
   * SELECTION PAGE
   * ---------------------------------------------------------
   */
  if (pageState === "selection") {
    return (
      <main className="min-h-screen bg-[#f3eee5] text-[#3f3329]">
        <div className="mx-auto min-h-screen w-full max-w-md bg-[#f8f4ec] shadow-sm">
          {/* Header */}
          <header className="border-b border-[#d8cfc2] px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-[0.12em]">
                  ヨルトレード
                </h1>

                <p className="mt-1 text-[10px] tracking-[0.2em] text-[#88786a]">
                  YORUSHIKA GACHA TRADE
                </p>
              </div>

              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8cfc2] text-lg"
                onClick={() => setShowMenu(!showMenu)}
              >
                ⋮
              </button>
            </div>

            {showMenu && (
              <div className="mt-3 rounded-xl border border-[#d8cfc2] bg-[#fffdf8] p-3 text-xs shadow-sm">
                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2 text-left hover:bg-[#f3eee5]"
                  onClick={() => setShowMenu(false)}
                >
                  このサイトについて
                </button>

                <button
                  type="button"
                  className="mt-1 w-full rounded-lg px-3 py-2 text-left hover:bg-[#f3eee5]"
                  onClick={() => setShowMenu(false)}
                >
                  使い方
                </button>
              </div>
            )}
          </header>

          {/* Intro */}
          <section className="px-5 pb-3 pt-6">
            <p className="text-xs tracking-[0.12em] text-[#88786a]">
              会場で、個体さんと交換する。
            </p>

            <h2 className="mt-2 text-lg font-medium tracking-[0.08em]">
              交換相手を探す
            </h2>
          </section>

          {/* Gacha tabs */}
          <section className="px-5 pt-2">
            <div className="grid grid-cols-2 rounded-xl border border-[#d8cfc2] bg-[#eee7dc] p-1">
              <button
                type="button"
                onClick={() => {
                  setGacha("keychain");
                  setSelectedWant([]);
                  setSelectedOffer([]);
                }}
                className={`rounded-lg py-2.5 text-xs tracking-[0.12em] transition ${
                  gacha === "keychain"
                    ? "bg-[#fffdf8] font-medium shadow-sm"
                    : "text-[#88786a]"
                }`}
              >
                キーホルダー
              </button>

              <button
                type="button"
                onClick={() => {
                  setGacha("pick");
                  setSelectedWant([]);
                  setSelectedOffer([]);
                }}
                className={`rounded-lg py-2.5 text-xs tracking-[0.12em] transition ${
                  gacha === "pick"
                    ? "bg-[#fffdf8] font-medium shadow-sm"
                    : "text-[#88786a]"
                }`}
              >
                ギターピック
              </button>
            </div>
          </section>

          {/* Want / Offer */}
          <section className="px-5 pt-4">
            <div className="grid grid-cols-2 rounded-xl border border-[#d8cfc2] bg-[#eee7dc] p-1">
              <button
                type="button"
                onClick={() => setMode("want")}
                className={`rounded-lg py-2.5 text-xs tracking-[0.16em] transition ${
                  mode === "want"
                    ? "bg-[#fffdf8] font-medium shadow-sm"
                    : "text-[#88786a]"
                }`}
              >
                求
              </button>

              <button
                type="button"
                onClick={() => setMode("offer")}
                className={`rounded-lg py-2.5 text-xs tracking-[0.16em] transition ${
                  mode === "offer"
                    ? "bg-[#fffdf8] font-medium shadow-sm"
                    : "text-[#88786a]"
                }`}
              >
                譲
              </button>
            </div>
          </section>

          {/* Selected summary */}
          <section className="px-5 pt-4">
            <div className="rounded-xl border border-[#d8cfc2] bg-[#fffdf8] px-4 py-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#88786a]">求</span>

                <span className="font-medium tracking-[0.1em]">
                  {formatItems(selectedWant) || "未選択"}
                </span>
              </div>

              <div className="my-2 border-t border-[#eee7dc]" />

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#88786a]">譲</span>

                <span className="font-medium tracking-[0.1em]">
                  {formatItems(selectedOffer) || "未選択"}
                </span>
              </div>
            </div>
          </section>

          {/* Item selection */}
          <section className="px-5 pb-28 pt-5">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-[10px] tracking-[0.18em] text-[#a09284]">
                  SELECT
                </p>

                <h3 className="mt-1 text-sm tracking-[0.08em]">
                  {mode === "want"
                    ? "欲しいもの"
                    : "交換に出すもの"}
                </h3>
              </div>

              <span className="text-[10px] text-[#a09284]">
                {currentItems.length} items
              </span>
            </div>

            {loadingItems ? (
              <div className="rounded-xl border border-[#d8cfc2] bg-[#fffdf8] py-16 text-center">
                <p className="text-xs tracking-[0.12em] text-[#88786a]">
                  読み込み中…
                </p>
              </div>
            ) : currentItems.length === 0 ? (
              <div className="rounded-xl border border-[#d8cfc2] bg-[#fffdf8] py-16 text-center">
                <p className="text-xs tracking-[0.12em] text-[#88786a]">
                  アイテムがありません。
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {currentItems.map((item, index) => {
                  const isSelected =
                    mode === "want"
                      ? selectedWant.includes(item.id)
                      : selectedOffer.includes(item.id);

                  const displayNumber = String(
                    index + 1
                  ).padStart(2, "0");

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      className={`group relative overflow-hidden rounded-xl border bg-[#fffdf8] text-left transition ${
                        isSelected
                          ? "border-[#6c5a4b] ring-2 ring-[#6c5a4b]/20"
                          : "border-[#d8cfc2] hover:border-[#a99887]"
                      }`}
                    >
                      {/* Selection indicator */}
                      <div
                        className={`absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border text-[9px] transition ${
                          isSelected
                            ? "border-[#6c5a4b] bg-[#6c5a4b] text-white"
                            : "border-[#cbbfaf] bg-[#fffdf8]/90 text-transparent"
                        }`}
                      >
                        ✓
                      </div>

                      {/* Image */}
                      <div className="relative aspect-square w-full bg-[#eee7dc]">
                        {item.image ? (
                          <Image
                            src={
                              typeof item.image === "string"
                                ? item.image
                                : item.image.src
                            }
                            alt={item.name}
                            fill
                            className="object-contain p-2"
                            sizes="(max-width: 768px) 33vw, 150px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-[#a09284]">
                            NO IMAGE
                          </div>
                        )}
                      </div>

                      {/* Item information */}
                      <div className="px-2.5 py-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] tracking-[0.12em] text-[#a09284]">
                            {displayNumber}
                          </span>

                          <span className="text-[9px] text-[#a09284]">
                            {item.category === "KEYCHAIN"
                              ? "KEYCHAIN"
                              : "PICK"}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-[11px] font-medium tracking-[0.04em]">
                          {item.name}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Bottom action */}
          <div className="fixed bottom-0 left-0 right-0 z-20 mx-auto max-w-md border-t border-[#d8cfc2] bg-[#f8f4ec]/95 px-5 py-4 backdrop-blur">
            <button
              type="button"
              disabled={
                selectedWant.length === 0 ||
                selectedOffer.length === 0 ||
                loadingItems
              }
              onClick={handleOpenConfirmation}
              className={`w-full rounded-xl py-3.5 text-xs tracking-[0.16em] transition ${
                selectedWant.length > 0 &&
                selectedOffer.length > 0 &&
                !loadingItems
                  ? "bg-[#4b3d32] text-[#fffdf8] hover:bg-[#3e3229]"
                  : "cursor-not-allowed bg-[#d8cfc2] text-[#a09284]"
              }`}
            >
              交換相手を探す
            </button>
          </div>

          {/* Confirmation modal */}
          {showConfirmation && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 px-4 pb-4">
              <div className="w-full max-w-md rounded-2xl border border-[#d8cfc2] bg-[#fffdf8] p-5 shadow-xl">
                <div className="text-center">
                  <p className="text-[10px] tracking-[0.2em] text-[#a09284]">
                    CONFIRM
                  </p>

                  <h3 className="mt-2 text-base tracking-[0.08em]">
                    交換内容を確認
                  </h3>
                </div>

                <div className="mt-5 rounded-xl bg-[#f3eee5] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#88786a]">
                      求
                    </span>

                    <span className="text-sm font-medium tracking-[0.12em]">
                      {formatItems(selectedWant)}
                    </span>
                  </div>

                  <div className="my-3 border-t border-[#d8cfc2]" />

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#88786a]">
                      譲
                    </span>

                    <span className="text-sm font-medium tracking-[0.12em]">
                      {formatItems(selectedOffer)}
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-center text-[10px] leading-5 text-[#a09284]">
                  この内容で交換相手を探します。
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmation(false)
                    }
                    className="rounded-xl border border-[#d8cfc2] py-3 text-xs tracking-[0.12em]"
                  >
                    戻る
                  </button>

                  <button
                    type="button"
                    onClick={handleSearch}
                    className="rounded-xl bg-[#4b3d32] py-3 text-xs tracking-[0.12em] text-[#fffdf8]"
                  >
                    探す
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
   * ---------------------------------------------------------
   * SEARCHING PAGE
   * ---------------------------------------------------------
   */
  if (pageState === "searching") {
    return (
      <main className="min-h-screen bg-[#f3eee5] text-[#3f3329]">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#f8f4ec] px-5">
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-[10px] tracking-[0.25em] text-[#a09284]">
              SEARCHING
            </p>

            <div className="mt-7 flex h-20 w-20 items-center justify-center rounded-full border border-[#cbbfaf]">
              <div className="h-3 w-3 animate-pulse rounded-full bg-[#6c5a4b]" />
            </div>

            <h2 className="mt-7 text-lg tracking-[0.1em]">
              交換相手を探しています
            </h2>

            <p className="mt-3 text-xs leading-6 text-[#88786a]">
              条件の合う人が見つかるまで
              <br />
              少しお待ちください。
            </p>

            <div className="mt-7 rounded-xl border border-[#d8cfc2] bg-[#fffdf8] px-5 py-4">
              <div className="flex items-center justify-between gap-8 text-xs">
                <span className="text-[#88786a]">求</span>

                <span className="font-medium tracking-[0.12em]">
                  {formatItems(selectedWant)}
                </span>
              </div>

              <div className="my-3 border-t border-[#eee7dc]" />

              <div className="flex items-center justify-between gap-8 text-xs">
                <span className="text-[#88786a]">譲</span>

                <span className="font-medium tracking-[0.12em]">
                  {formatItems(selectedOffer)}
                </span>
              </div>
            </div>
          </div>

          <div className="pb-8">
            <button
              type="button"
              onClick={handleEdit}
              className="w-full rounded-xl border border-[#cbbfaf] py-3 text-xs tracking-[0.14em]"
            >
              条件を変更する
            </button>

            <button
              type="button"
              onClick={handleFakeMatch}
              className="mt-3 w-full rounded-xl bg-[#4b3d32] py-3 text-xs tracking-[0.14em] text-[#fffdf8]"
            >
              【テスト】マッチさせる
            </button>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * MATCHED PAGE
   * ---------------------------------------------------------
   */
  if (pageState === "matched") {
    return (
      <main className="min-h-screen bg-[#f3eee5] text-[#3f3329]">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#f8f4ec] px-5">
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-[10px] tracking-[0.25em] text-[#a09284]">
              MATCH FOUND
            </p>

            <div className="mt-7 flex h-20 w-20 items-center justify-center rounded-full border border-[#cbbfaf] bg-[#fffdf8]">
              <span className="text-2xl">↔</span>
            </div>

            <h2 className="mt-7 text-lg tracking-[0.1em]">
              交換相手が見つかりました
            </h2>

            <p className="mt-3 text-xs leading-6 text-[#88786a]">
              お互いに条件が一致しています。
              <br />
              チャットで交換場所を相談できます。
            </p>

            <div className="mt-7 w-full rounded-xl border border-[#d8cfc2] bg-[#fffdf8] p-5">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-[9px] tracking-[0.16em] text-[#a09284]">
                    YOUR OFFER
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {getDisplayNumber(selectedOffer[0])}
                  </p>
                </div>

                <span className="text-[#a09284]">⇄</span>

                <div className="text-right">
                  <p className="text-[9px] tracking-[0.16em] text-[#a09284]">
                    THEIR OFFER
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {getDisplayNumber(selectedWant[0])}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pb-8">
            <button
              type="button"
              onClick={handleOpenChat}
              className="w-full rounded-xl bg-[#4b3d32] py-3.5 text-xs tracking-[0.16em] text-[#fffdf8]"
            >
              チャットを開く
            </button>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * CHAT PAGE
   * ---------------------------------------------------------
   */
  if (pageState === "chat") {
    return (
      <main className="min-h-screen bg-[#f3eee5] text-[#3f3329]">
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#f8f4ec]">
          {/* Chat header */}
          <header className="border-b border-[#d8cfc2] bg-[#f8f4ec] px-5 py-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPageState("matched")}
                className="text-lg text-[#88786a]"
              >
                ←
              </button>

              <div className="text-center">
                <p className="text-xs font-medium tracking-[0.1em]">
                  交換チャット
                </p>

                <p className="mt-1 text-[9px] tracking-[0.12em] text-[#a09284]">
                  {getDisplayNumber(selectedOffer[0])} ⇄{" "}
                  {getDisplayNumber(selectedWant[0])}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="text-lg text-[#88786a]"
              >
                ⋮
              </button>
            </div>

            {showMenu && (
              <div className="mt-3 rounded-xl border border-[#d8cfc2] bg-[#fffdf8] p-3 text-xs shadow-sm">
                <button
                  type="button"
                  onClick={() => setShowMenu(false)}
                  className="w-full rounded-lg px-3 py-2 text-left hover:bg-[#f3eee5]"
                >
                  交換をキャンセル
                </button>
              </div>
            )}
          </header>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5 pb-28">
            {messages.map((chatMessage) => (
              <div
                key={chatMessage.id}
                className={`flex ${
                  chatMessage.mine
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[78%] ${
                    chatMessage.mine
                      ? "items-end"
                      : "items-start"
                  }`}
                >
                  {chatMessage.images &&
                    chatMessage.images.length > 0 && (
                      <div className="mb-1 grid grid-cols-2 gap-2">
                        {chatMessage.images.map((image) => (
                          <div
                            key={image.url}
                            className="overflow-hidden rounded-xl border border-[#d8cfc2] bg-[#eee7dc]"
                          >
                            <Image
                              src={image.url}
                              alt={image.name}
                              width={128}
                              height={128}
                              className="h-32 w-32 object-cover"
                              unoptimized
                            />
                          </div>
                        ))}
                      </div>
                    )}

                  {chatMessage.text && (
                    <div
                      className={`rounded-2xl px-4 py-3 text-xs leading-5 ${
                        chatMessage.mine
                          ? "rounded-br-md bg-[#4b3d32] text-[#fffdf8]"
                          : "rounded-bl-md border border-[#d8cfc2] bg-[#fffdf8]"
                      }`}
                    >
                      {chatMessage.text}
                    </div>
                  )}

                  <p
                    className={`mt-1 text-[9px] text-[#a09284] ${
                      chatMessage.mine
                        ? "text-right"
                        : "text-left"
                    }`}
                  >
                    {chatMessage.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Chat controls */}
          <div className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-md border-t border-[#d8cfc2] bg-[#f8f4ec]/95 px-4 py-3 backdrop-blur">
            {showAttachmentMenu && (
              <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl border border-[#d8cfc2] bg-[#fffdf8] p-2 shadow-sm">
                <label className="cursor-pointer rounded-lg px-3 py-3 text-center text-xs hover:bg-[#f3eee5]">
                  📷 カメラ
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(event) =>
                      sendImages(event.target.files)
                    }
                  />
                </label>

                <label className="cursor-pointer rounded-lg px-3 py-3 text-center text-xs hover:bg-[#f3eee5]">
                  🖼 ライブラリ
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) =>
                      sendImages(event.target.files)
                    }
                  />
                </label>
              </div>
            )}

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setShowAttachmentMenu(
                    !showAttachmentMenu
                  )
                }
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#cbbfaf] text-lg"
              >
                +
              </button>

              <textarea
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="メッセージを入力"
                rows={1}
                className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-[#cbbfaf] bg-[#fffdf8] px-4 py-3 text-xs outline-none placeholder:text-[#b2a497]"
              />

              <button
                type="button"
                onClick={sendMessage}
                disabled={!message.trim()}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm ${
                  message.trim()
                    ? "bg-[#4b3d32] text-[#fffdf8]"
                    : "bg-[#d8cfc2] text-[#a09284]"
                }`}
              >
                ↑
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowCompleteConfirmation(true)
              }
              className="mt-2 w-full py-1 text-[9px] tracking-[0.12em] text-[#a09284]"
            >
              交換完了にする
            </button>
          </div>

          {/* Complete confirmation */}
          {showCompleteConfirmation && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 px-4 pb-4">
              <div className="w-full max-w-md rounded-2xl border border-[#d8cfc2] bg-[#fffdf8] p-5 shadow-xl">
                <div className="text-center">
                  <p className="text-[10px] tracking-[0.2em] text-[#a09284]">
                    COMPLETE
                  </p>

                  <h3 className="mt-2 text-base tracking-[0.08em]">
                    交換を完了しますか？
                  </h3>

                  <p className="mt-3 text-[10px] leading-5 text-[#88786a]">
                    実際に交換が完了したことを確認してから
                    <br />
                    完了ボタンを押してください。
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setShowCompleteConfirmation(false)
                    }
                    className="rounded-xl border border-[#d8cfc2] py-3 text-xs tracking-[0.12em]"
                  >
                    キャンセル
                  </button>

                  <button
                    type="button"
                    onClick={handleComplete}
                    className="rounded-xl bg-[#4b3d32] py-3 text-xs tracking-[0.12em] text-[#fffdf8]"
                  >
                    完了する
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
   * ---------------------------------------------------------
   * COMPLETED PAGE
   * ---------------------------------------------------------
   */
  return (
    <main className="min-h-screen bg-[#f3eee5] text-[#3f3329]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#f8f4ec] px-5">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-[10px] tracking-[0.25em] text-[#a09284]">
            COMPLETED
          </p>

          <div className="mt-7 flex h-20 w-20 items-center justify-center rounded-full border border-[#cbbfaf] bg-[#fffdf8]">
            <span className="text-2xl">✓</span>
          </div>

          <h2 className="mt-7 text-lg tracking-[0.1em]">
            交換完了
          </h2>

          <p className="mt-3 text-xs leading-6 text-[#88786a]">
            おつかれさまでした。
            <br />
            素敵な交換になりますように。
          </p>

          <div className="mt-7 w-full rounded-xl border border-[#d8cfc2] bg-[#fffdf8] p-5">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-[9px] tracking-[0.16em] text-[#a09284]">
                  YOUR OFFER
                </p>

                <p className="mt-1 text-sm font-medium">
                  {getDisplayNumber(selectedOffer[0])}
                </p>
              </div>

              <span className="text-[#a09284]">⇄</span>

              <div className="text-right">
                <p className="text-[9px] tracking-[0.16em] text-[#a09284]">
                  THEIR OFFER
                </p>

                <p className="mt-1 text-sm font-medium">
                  {getDisplayNumber(selectedWant[0])}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pb-8">
          <button
            type="button"
            onClick={() => {
              setSelectedWant([]);
              setSelectedOffer([]);
              setPageState("selection");
            }}
            className="w-full rounded-xl bg-[#4b3d32] py-3.5 text-xs tracking-[0.16em] text-[#fffdf8]"
          >
            新しい交換を探す
          </button>
        </div>
      </div>
    </main>
  );
}