import Link from 'next/link'

import Card from '@/components/ui/card'
import Container from '@/components/ui/container'

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-washi-2 py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(240,216,208,0.55),transparent_55%),linear-gradient(to_bottom,#eef0ec,#dde2dc)]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />
        <Container className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-ink-4">
            — 小さくなる伝統に、新たな継ぎ手を —
          </p>
          <h1 className="mt-6 max-w-3xl font-serif text-4xl font-semibold tracking-tight text-ink md:text-5xl">
            見て覚えろ、をAIで残して継ぐ
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-3">
            記録で先代の判断を残し、指南で現場の所作を判定し、相談で迷った瞬間に聞ける。
            職人・旅館・老舗飲食——言語化されてこなかった技と判断を、次の世代へ渡す。
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/auth/signup"
              className="inline-flex h-11 min-w-[9rem] items-center justify-center rounded-lg bg-shu px-5 text-sm font-semibold text-white transition hover:bg-shu-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-shu"
            >
              店主として始める
            </Link>
          </div>
        </Container>
      </section>

      {/* 3機能説明 */}
      <section className="py-16 md:py-24">
        <Container>
          <h2 className="text-center font-serif text-2xl font-semibold tracking-tight text-ink">
            3つの機能で、暗黙知を資産に変える
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-4">記録</p>
              <h3 className="mt-3 text-lg font-semibold text-ink">先代の判断を残す</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-3">
                先代へのインタビュー動画から、状況・判断・理由の3層タグを自動抽出します。
                蓄積した暗黙知は指南と相談の原資になります。
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-4">指南</p>
              <h3 className="mt-3 text-lg font-semibold text-ink">現場の所作を判定する</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-3">
                正解の所作と現場をリアルタイムで比較し、ズレた点だけを短く返します。
                後継者がひとりで現場に立てる日を早めます。
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-4">相談</p>
              <h3 className="mt-3 text-lg font-semibold text-ink">迷った瞬間に相談する</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-3">
                記録から抽出した暗黙知を出典に、先代の判断を再現するAIに相談できます。
                「あの時どうしてたっけ」をいつでも引き出せます。
              </p>
            </Card>
          </div>
        </Container>
      </section>

      {/* 誰向けか */}
      <section className="border-t border-washi-2 py-16">
        <Container>
          <h2 className="text-center font-serif text-2xl font-semibold tracking-tight text-ink">
            店主と継ぎ手、それぞれの使い方
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <Card className="p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-4">
                店主・先代
              </p>
              <h3 className="mt-3 text-xl font-semibold text-ink">
                暗黙知を蓄積して後継者を育てる
              </h3>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink-3">
                <li>— インタビュー動画を記録に登録</li>
                <li>— 正解シーンを指南に設定</li>
                <li>— 後継者からの相談に相談機能が自動応答</li>
              </ul>
              <div className="mt-6">
                <Link
                  href="/auth/signup"
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-shu px-4 text-sm font-semibold text-white transition hover:bg-shu-2"
                >
                  店主として登録する
                </Link>
              </div>
            </Card>
            <Card className="p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-4">
                継ぎ手・後継者
              </p>
              <h3 className="mt-3 text-xl font-semibold text-ink">現場で学ぶ</h3>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-ink-3">
                <li>— 記録で先代の考え方を事前に学ぶ</li>
                <li>— 指南で現場の所作をリアルタイム確認</li>
                <li>— 相談で判断に迷ったとき即相談</li>
              </ul>
            </Card>
          </div>
        </Container>
      </section>

      {/* ベータ告知 */}
      <section className="border-t border-washi-2 py-12">
        <Container className="text-center">
          <p className="text-sm text-ink-3">
            TSUGITE は現在ベータ開発中です。掲載内容・利用規約は正式リリース前に更新されます。
          </p>
          <Link
            className="mt-4 inline-block text-sm font-medium text-ink hover:text-shu"
            href="/terms"
          >
            利用規約
          </Link>
        </Container>
      </section>
    </main>
  )
}
