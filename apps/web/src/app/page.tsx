"use client";

import { useState } from "react";
import {
  ArrowRight,
  Bell,
  ChevronRight,
  Clock3,
  Compass,
  Guitar,
  Heart,
  Menu,
  MessageCircle,
  Moon,
  Package,
  Plus,
  Search,
  Sparkles,
  Star,
  UserRound,
  X,
} from "lucide-react";

const items = [
  {
    title: "月と猫のダンス",
    category: "グッズ",
    want: "求めています",
    have: "交換できます",
    time: "たった今",
    type: "goods",
  },
  {
    title: "晴る — ギターピック",
    category: "ピック",
    want: "求めています",
    have: "交換できます",
    time: "3分前",
    type: "pick",
  },
  {
    title: "ただ君に晴れ",
    category: "グッズ",
    want: "交換できます",
    have: "探しています",
    time: "8分前",
    type: "goods",
  },
  {
    title: "だから僕は音楽を辞めた",
    category: "グッズ",
    want: "探しています",
    have: "交換できます",
    time: "12分前",
    type: "goods",
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("すべて");

  const filteredItems =
    activeTab === "すべて"
      ? items
      : items.filter((item) => item.category === activeTab);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f3f6f5] text-[#26383a]">
      {/* Background atmosphere */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#dbe8e8] blur-3xl" />
        <div className="absolute -left-40 top-[55%] h-[400px] w-[400px] rounded-full bg-[#e4eeee] blur-3xl" />

        <div className="absolute right-[9%] top-[12%] text-[#a9c5c7] opacity-50">
          <Moon size={150} strokeWidth={0.7} />
        </div>

        <div className="absolute left-[4%] top-[35%] h-px w-32 rotate-[-18deg] bg-[#9eb9bb] opacity-40" />
        <div className="absolute left-[7%] top-[36%] h-px w-20 rotate-[-18deg] bg-[#9eb9bb] opacity-30" />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-[#cad8d8]/70 bg-[#f3f6f5]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-10">
          <a href="#" className="group flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center">
              <Moon
                size={34}
                strokeWidth={1}
                className="text-[#50777a]"
              />
              <span className="absolute left-[18px] top-[7px] h-1.5 w-1.5 rounded-full bg-[#50777a]" />
            </div>

            <div>
              <div className="font-serif text-xl tracking-[0.22em] text-[#26383a]">
                ヨルトレード
              </div>
              <div className="text-[9px] tracking-[0.35em] text-[#759295]">
                会場で、個体さんと交換する。
              </div>
            </div>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#"
              className="text-sm text-[#526d70] transition hover:text-[#26383a]"
            >
              探す
            </a>
            <a
              href="#"
              className="text-sm text-[#526d70] transition hover:text-[#26383a]"
            >
              交換する
            </a>
            <a
              href="#"
              className="text-sm text-[#526d70] transition hover:text-[#26383a]"
            >
              やり取り
            </a>

            <div className="h-5 w-px bg-[#cad8d8]" />

            <button className="relative rounded-full p-2 text-[#526d70] transition hover:bg-white">
              <Bell size={18} strokeWidth={1.5} />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#6f9799]" />
            </button>

            <button className="flex items-center gap-2 rounded-full border border-[#c9d8d8] bg-white/60 px-4 py-2 text-sm transition hover:bg-white">
              <UserRound size={16} strokeWidth={1.5} />
              自分のページ
            </button>
          </nav>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-full p-2 md:hidden"
            aria-label="メニュー"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-[#cad8d8] bg-[#f3f6f5] px-5 py-5 md:hidden">
            <div className="flex flex-col gap-5 text-sm">
              <a href="#">探す</a>
              <a href="#">交換する</a>
              <a href="#">やり取り</a>
              <a href="#">自分のページ</a>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-20 pt-16 lg:px-10 lg:pb-28 lg:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-7 flex items-center gap-3">
              <span className="h-px w-10 bg-[#6f9799]" />
              <span className="text-[11px] tracking-[0.35em] text-[#6f8587]">
                ヨルシカ ファンのための交換所
              </span>
            </div>

            <h1 className="max-w-3xl font-serif text-4xl leading-[1.35] tracking-[0.08em] text-[#26383a] sm:text-5xl lg:text-6xl">
              欲しかったも物を、
              <br />
              <span className="text-[#5c8588]">個体さん同士</span>で。
            </h1>

            <p className="mt-7 max-w-xl text-sm leading-8 tracking-[0.08em] text-[#667d80]">
              会場で引いたガチャ。
              <br />
              余ってしまったグッズ。
              <br />
              そして、ずっと探しているひとつ。
              <br />
              <span className="text-[#425e61]">
                同じ音楽を好きな個体さんと交換しよう。
              </span>
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button className="group flex items-center justify-center gap-3 rounded-full bg-[#385c60] px-7 py-3.5 text-sm tracking-[0.12em] text-white shadow-lg shadow-[#385c60]/15 transition hover:-translate-y-0.5 hover:bg-[#2d4e52]">
                欲しいものを探す
                <ArrowRight
                  size={16}
                  className="transition group-hover:translate-x-1"
                />
              </button>

              <button className="flex items-center justify-center gap-3 rounded-full border border-[#aebfc0] bg-white/60 px-7 py-3.5 text-sm tracking-[0.12em] text-[#486568] transition hover:bg-white">
                <Plus size={16} />
                交換を登録する
              </button>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative mx-auto h-[390px] w-full max-w-[480px]">
            <div className="absolute right-3 top-8 h-[285px] w-[245px] rotate-[7deg] rounded-[3px] border border-[#d1dcdc] bg-[#edf3f2] shadow-xl shadow-[#45686a]/10" />

            <div className="absolute left-6 top-12 h-[300px] w-[260px] rotate-[-7deg] rounded-[3px] border border-[#cbd9d9] bg-[#f8faf9] p-6 shadow-2xl shadow-[#45686a]/10">
              <div className="flex justify-between text-[9px] tracking-[0.3em] text-[#8aa1a3]">
                <span>夜</span>
                <span>01:27</span>
              </div>

              <div className="mt-14 flex justify-center">
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-[#9fbabc]">
                  <div className="absolute h-24 w-24 rounded-full border border-[#c6d6d7]" />
                  <Moon
                    size={62}
                    strokeWidth={0.8}
                    className="text-[#5d8588]"
                  />
                </div>
              </div>

              <div className="mt-10 text-center">
                <div className="font-serif text-lg tracking-[0.2em]">
                  誰かの個体さんへ
                </div>
                <div className="mt-2 text-[9px] tracking-[0.3em] text-[#819799]">
                  YORUTRADE
                </div>
              </div>
            </div>

            <div className="absolute bottom-3 right-0 rounded-[2px] border border-[#c8d8d8] bg-[#f7faf9] px-5 py-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dfeaea]">
                  <Sparkles
                    size={17}
                    strokeWidth={1.2}
                    className="text-[#5e8588]"
                  />
                </div>
                <div>
                  <div className="text-xs tracking-[0.08em]">
                    匿名で交換できます
                  </div>
                  <div className="mt-1 text-[9px] text-[#839799]">
                    個人情報は公開されません
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="relative z-10 border-y border-[#d0dddd] bg-white/35">
        <div className="mx-auto grid max-w-7xl md:grid-cols-3">
          <button className="group flex items-center gap-5 border-b border-[#d0dddd] px-6 py-7 text-left transition hover:bg-white/50 md:border-b-0 md:border-r">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#dfeaea]">
              <Search
                size={20}
                strokeWidth={1.3}
                className="text-[#527b7e]"
              />
            </div>
            <div className="flex-1">
              <div className="text-sm tracking-[0.1em]">探す</div>
              <div className="mt-1 text-xs text-[#829698]">
                欲しいグッズを見つける
              </div>
            </div>
            <ChevronRight
              size={17}
              className="text-[#9bb0b1] transition group-hover:translate-x-1"
            />
          </button>

          <button className="group flex items-center gap-5 border-b border-[#d0dddd] px-6 py-7 text-left transition hover:bg-white/50 md:border-b-0 md:border-r">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#dfeaea]">
              <Package
                size={20}
                strokeWidth={1.3}
                className="text-[#527b7e]"
              />
            </div>
            <div className="flex-1">
              <div className="text-sm tracking-[0.1em]">グッズを交換</div>
              <div className="mt-1 text-xs text-[#829698]">
                持っているものを登録
              </div>
            </div>
            <ChevronRight
              size={17}
              className="text-[#9bb0b1] transition group-hover:translate-x-1"
            />
          </button>

          <button className="group flex items-center gap-5 px-6 py-7 text-left transition hover:bg-white/50">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#dfeaea]">
              <Guitar
                size={20}
                strokeWidth={1.3}
                className="text-[#527b7e]"
              />
            </div>
            <div className="flex-1">
              <div className="text-sm tracking-[0.1em]">ピックを交換</div>
              <div className="mt-1 text-xs text-[#829698]">
                ギターピックを探す
              </div>
            </div>
            <ChevronRight
              size={17}
              className="text-[#9bb0b1] transition group-hover:translate-x-1"
            />
          </button>
        </div>
      </section>

      {/* Listings */}
      <section className="relative z-10 mx-auto max-w-7xl px-5 py-20 lg:px-10">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="text-[10px] tracking-[0.35em] text-[#7b9496]">
                RECENTLY
              </span>
              <span className="h-px w-8 bg-[#9eb7b8]" />
            </div>

            <h2 className="font-serif text-3xl tracking-[0.08em]">
              今、探されています。
            </h2>

            <p className="mt-3 text-xs tracking-[0.08em] text-[#819597]">
              誰かが持っているものを、誰かが探しています。
            </p>
          </div>

          <button className="flex items-center gap-2 text-xs tracking-[0.1em] text-[#5c7e81]">
            すべて見る
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Filter */}
        <div className="mb-7 flex gap-2 overflow-x-auto pb-1">
          {["すべて", "グッズ", "ピック"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-xs tracking-[0.08em] transition ${
                activeTab === tab
                  ? "bg-[#385c60] text-white"
                  : "border border-[#c9d8d8] bg-white/50 text-[#668083] hover:bg-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {filteredItems.map((item) => (
            <article
              key={item.title}
              className="group relative overflow-hidden rounded-[3px] border border-[#d1dddd] bg-[#f9fbfa]/80 p-5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-xl hover:shadow-[#3f6365]/5"
            >
              <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-[#edf3f2]" />

              <div className="relative flex gap-5">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center border border-[#d1dddd] bg-[#e8efee]">
                  {item.type === "pick" ? (
                    <Guitar
                      size={30}
                      strokeWidth={0.9}
                      className="text-[#729093]"
                    />
                  ) : (
                    <Package
                      size={30}
                      strokeWidth={0.9}
                      className="text-[#729093]"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[9px] tracking-[0.18em] text-[#759194]">
                      {item.category}
                    </span>
                    <span className="text-[#b0bfc0]">·</span>
                    <span className="flex items-center gap-1 text-[9px] text-[#91a3a5]">
                      <Clock3 size={10} />
                      {item.time}
                    </span>
                  </div>

                  <h3 className="truncate font-serif text-base tracking-[0.08em]">
                    {item.title}
                  </h3>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-sm bg-[#e2eceb] px-2.5 py-1 text-[9px] text-[#5d7c7e]">
                      {item.want}
                    </span>
                    <span className="rounded-sm border border-[#d0dddd] px-2.5 py-1 text-[9px] text-[#819698]">
                      {item.have}
                    </span>
                  </div>
                </div>

                <button
                  aria-label="お気に入り"
                  className="absolute right-0 top-0 rounded-full p-1.5 text-[#9aadae] transition hover:text-[#557c7f]"
                >
                  <Heart size={16} strokeWidth={1.3} />
                </button>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#e0e8e8] pt-4">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-[#d8e5e4]" />
                  <span className="text-[9px] text-[#899d9f]">
                    匿名ユーザー
                  </span>
                </div>

                <button className="flex items-center gap-1 text-[10px] tracking-[0.08em] text-[#5c7e81] transition group-hover:gap-2">
                  詳細を見る
                  <ChevronRight size={12} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Anonymous exchange section */}
      <section className="relative z-10 overflow-hidden border-y border-[#cad9d9] bg-[#e6eeee]">
        <div className="absolute right-[-50px] top-[-100px] opacity-20">
          <Moon size={320} strokeWidth={0.5} />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-20 lg:px-10">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <Star
                  size={15}
                  strokeWidth={1}
                  className="text-[#5e8588]"
                />
                <span className="text-[10px] tracking-[0.3em] text-[#648487]">
                  ANONYMOUS
                </span>
              </div>

              <h2 className="font-serif text-3xl leading-[1.5] tracking-[0.1em] lg:text-4xl">
                名前を知らなくても、
                <br />
                <span className="text-[#527b7e]">交換</span>はできる。
              </h2>

              <p className="mt-6 max-w-lg text-sm leading-8 tracking-[0.06em] text-[#647d7f]">
                ヨルトレードでは、最初から個人情報を公開する必要はありません。
                <br />
                マッチングした相手とだけ、匿名のやり取りを始められます。
              </p>

              <button className="mt-7 flex items-center gap-2 text-xs tracking-[0.1em] text-[#527b7e]">
                仕組みについて知る
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="mx-auto w-full max-w-md">
              <div className="rotate-[-2deg] border border-[#c6d6d6] bg-[#f8faf9] p-6 shadow-2xl shadow-[#45686a]/10">
                <div className="flex items-center justify-between border-b border-[#d9e3e3] pb-4">
                  <div className="text-[10px] tracking-[0.25em] text-[#81989a]">
                    交換の記録
                  </div>
                  <Clock3
                    size={14}
                    strokeWidth={1}
                    className="text-[#89a0a2]"
                  />
                </div>

                <div className="py-7">
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="mx-auto mb-2 h-11 w-11 rounded-full bg-[#dce8e7]" />
                      <div className="text-[9px] text-[#87999b]">
                        匿名の人
                      </div>
                    </div>

                    <div className="flex flex-1 items-center justify-center gap-2">
                      <span className="h-px w-10 bg-[#a7babb]" />
                      <MessageCircle
                        size={17}
                        strokeWidth={1}
                        className="text-[#648487]"
                      />
                      <span className="h-px w-10 bg-[#a7babb]" />
                    </div>

                    <div className="text-center">
                      <div className="mx-auto mb-2 h-11 w-11 rounded-full bg-[#dce8e7]" />
                      <div className="text-[9px] text-[#87999b]">
                        匿名の人
                      </div>
                    </div>
                  </div>

                  <div className="mt-7 border border-[#d7e2e2] bg-[#f1f6f5] p-4">
                    <div className="text-[9px] tracking-[0.12em] text-[#789093]">
                      交換成立
                    </div>
                    <div className="mt-2 font-serif text-sm tracking-[0.08em]">
                      「大切にします。」
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-4xl px-5 py-24 text-center">
        <div className="mb-6 flex justify-center">
          <Compass
            size={28}
            strokeWidth={0.8}
            className="text-[#6e9193]"
          />
        </div>

        <p className="mb-5 text-[10px] tracking-[0.35em] text-[#82999b]">
          あなたの持っているものが、
        </p>

        <h2 className="font-serif text-3xl leading-[1.6] tracking-[0.1em] sm:text-4xl">
          誰かが探しているものかもしれない。
        </h2>

        <button className="mt-9 rounded-full bg-[#385c60] px-9 py-4 text-sm tracking-[0.15em] text-white shadow-lg shadow-[#385c60]/15 transition hover:bg-[#2d4e52]">
          交換を登録する
        </button>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#d0dddd] bg-[#edf3f2]">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-10">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <div className="font-serif text-lg tracking-[0.2em]">
                ヨルトレード
              </div>
              <p className="mt-2 text-[9px] tracking-[0.2em] text-[#83999b]">
                会場で交換する。
              </p>
            </div>

            <div className="flex flex-wrap gap-x-7 gap-y-3 text-[10px] tracking-[0.1em] text-[#748c8e]">
              <a href="#">利用について</a>
              <a href="#">安全について</a>
              <a href="#">お問い合わせ</a>
              <a href="#">プライバシー</a>
            </div>
          </div>

          <div className="mt-8 border-t border-[#d5e0e0] pt-5 text-[8px] tracking-[0.2em] text-[#9aacad]">
            ヨルトレードはファン同士のグッズ交換を支援するサービスです。
          </div>
        </div>
      </footer>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#cad9d9] bg-[#f4f8f7]/95 px-4 py-2 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around">
          <button className="flex flex-col items-center gap-1 px-4 py-1 text-[#527b7e]">
            <Moon size={18} strokeWidth={1.4} />
            <span className="text-[8px]">ホーム</span>
          </button>

          <button className="flex flex-col items-center gap-1 px-4 py-1 text-[#84999b]">
            <Search size={18} strokeWidth={1.4} />
            <span className="text-[8px]">探す</span>
          </button>

          <button className="flex h-11 w-11 -translate-y-3 items-center justify-center rounded-full bg-[#385c60] text-white shadow-lg">
            <Plus size={21} strokeWidth={1.4} />
          </button>

          <button className="flex flex-col items-center gap-1 px-4 py-1 text-[#84999b]">
            <MessageCircle size={18} strokeWidth={1.4} />
            <span className="text-[8px]">やり取り</span>
          </button>

          <button className="flex flex-col items-center gap-1 px-4 py-1 text-[#84999b]">
            <UserRound size={18} strokeWidth={1.4} />
            <span className="text-[8px]">自分</span>
          </button>
        </div>
      </nav>
    </main>
  );
}

