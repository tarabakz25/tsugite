import PageContainer from '@/components/layout/page-container'
import Badge from '@/components/ui/badge'
import Button from '@/components/ui/button'
import Card from '@/components/ui/card'
import Checkbox from '@/components/ui/checkbox'
import Dialog from '@/components/ui/dialog'
import EmptyState from '@/components/ui/empty-state'
import InlineFeedback from '@/components/ui/inline-feedback'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Sheet from '@/components/ui/sheet'
import StatusBadge, { type StatusKind } from '@/components/ui/status-badge'
import Tabs from '@/components/ui/tabs'
import Textarea from '@/components/ui/textarea'
import Toggle from '@/components/ui/toggle'

const statuses: StatusKind[] = [
  'completed',
  'incomplete',
  'unknown',
  'loading',
  'error',
  'disabled',
]

const taskTemplates = [
  { count: '12', label: '公開中テンプレート' },
  { count: '4', label: '判定待ちタスク' },
  { count: '98%', label: '入力完了率' },
]

export default function DesignSystemCatalog() {
  return (
    <PageContainer>
      <section className="grid gap-5" id="top">
        <div className="grid gap-3">
          <Badge tone="shu">Issue #1 UI Catalog</Badge>
          <div className="grid max-w-3xl gap-3">
            <h1 className="text-3xl font-bold leading-tight text-ink sm:text-4xl">
              現場で迷わず使える TSUGITE の操作基準
            </h1>
            <p className="text-base leading-7 text-ink-3">
              和紙、墨、朱を基調に、状態確認と次アクションを優先したフロントエンドの基準を定義します。
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {taskTemplates.map((item) => (
            <Card className="p-4" key={item.label}>
              <p className="text-2xl font-bold text-ink">{item.count}</p>
              <p className="mt-1 text-sm text-ink-4">{item.label}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4" id="catalog">
        <div className="grid gap-1">
          <h2 className="text-xl font-bold text-ink">カラーと状態</h2>
          <p className="text-sm leading-6 text-ink-4">
            色だけに依存せず、ラベルと記号を併用して完了、未完了、判定不能、エラーを区別します。
          </p>
        </div>
        <Card className="grid gap-4 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TokenSwatch className="bg-washi text-ink" label="Washi" value="#eef0ec" />
            <TokenSwatch className="bg-ink text-washi" label="Ink" value="#142028" />
            <TokenSwatch className="bg-shu text-white" label="Shu" value="#8a3a2a" />
            <TokenSwatch className="bg-success text-white" label="Success" value="#2f6b4f" />
          </div>
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <StatusBadge key={status} status={status} />
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4">
        <div className="grid gap-1">
          <h2 className="text-xl font-bold text-ink">基本操作</h2>
          <p className="text-sm leading-6 text-ink-4">
            タップしやすい高さ、明確な focus、hover、active、disabled を共通化します。
          </p>
        </div>
        <Card className="grid gap-4 p-4">
          <div className="flex flex-wrap gap-2">
            <Button>保存する</Button>
            <Button variant="secondary">下書き</Button>
            <Button variant="outline">戻る</Button>
            <Button variant="ghost">詳細</Button>
            <Button variant="danger">削除</Button>
            <Button isLoading>判定中</Button>
            <Button disabled>無効</Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Input
              helperText="現場で読み上げやすい名称にします。"
              label="テンプレート名"
              placeholder="朝礼前点検"
            />
            <Select label="判定モード" defaultValue="camera">
              <option value="camera">カメラ判定</option>
              <option value="manual">手動確認</option>
              <option value="voice">音声レコメンド</option>
            </Select>
            <Input error="担当者名を入力してください。" label="担当者" placeholder="未入力" />
          </div>
          <Textarea
            helperText="作業者に表示する短い補足です。"
            label="確認メモ"
            placeholder="工具の向きと固定状態を確認"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Checkbox
              defaultChecked
              description="状態をラベルとログの両方に残します。"
              label="判定結果を作業記録に保存"
            />
            <Toggle
              defaultChecked
              description="次アクションを音声で提案します。"
              label="音声レコメンド"
            />
          </div>
        </Card>
      </section>

      <section className="grid gap-4">
        <div className="grid gap-1">
          <h2 className="text-xl font-bold text-ink">主要ユースケース</h2>
          <p className="text-sm leading-6 text-ink-4">
            ログイン導線、タスク一覧、タスク詳細、カメラ判定、チャット表示を同じ部品で確認します。
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <Card className="p-4">
            <div className="flex items-start justify-between gap-3 border-b border-washi-2 pb-4">
              <div>
                <h3 className="text-base font-semibold text-ink">ログイン導線</h3>
                <p className="mt-1 text-sm leading-6 text-ink-4">
                  現場端末でも操作対象が明確な開始画面。
                </p>
              </div>
              <Badge tone="unknown">認証前</Badge>
            </div>
            <div className="grid gap-3 pt-4">
              <Input label="メールアドレス" placeholder="name@example.com" type="email" />
              <Button size="lg">Google で続行</Button>
              <InlineFeedback title="補足" tone="info">
                認証処理は後続 issue の対象です。ここでは余白、状態、文言量の基準だけを示します。
              </InlineFeedback>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-washi-2 p-4">
              <div>
                <h3 className="text-base font-semibold text-ink">タスクテンプレート一覧</h3>
                <p className="mt-1 text-sm text-ink-4">
                  同じ高さと状態ラベルでスキャンしやすくします。
                </p>
              </div>
              <Button size="sm">新規作成</Button>
            </div>
            <div className="divide-y divide-washi-2">
              <TaskRow status="completed" title="朝礼前点検" />
              <TaskRow status="incomplete" title="資材受け渡し確認" />
              <TaskRow status="unknown" title="カメラ位置合わせ" />
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-ink">カメラ判定結果</h2>
              <p className="mt-1 text-sm leading-6 text-ink-4">
                次に何を確認するかを先頭に出します。
              </p>
            </div>
            <StatusBadge status="incomplete" />
          </div>
          <div className="mt-4 aspect-video rounded-lg border border-washi-3 bg-ink p-4 text-washi">
            <div className="flex h-full flex-col justify-between">
              <span className="w-fit rounded-md bg-warning-bg px-2 py-1 text-xs font-semibold text-warning">
                固定具が未検出
              </span>
              <p className="max-w-sm text-sm leading-6 text-washi-2">
                左下の固定具が画角外です。端末を少し引いて再判定してください。
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button>再判定</Button>
            <Button variant="outline">手動で完了</Button>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-xl font-bold text-ink">チャット / 音声レコメンド</h2>
          <div className="mt-4 grid gap-3">
            <MessageBubble speaker="TSUGITE" tone="system">
              次は固定具の向きを確認してください。未完了の場合は再撮影を推奨します。
            </MessageBubble>
            <MessageBubble speaker="作業者" tone="user">
              固定具を直しました。もう一度判定してください。
            </MessageBubble>
            <InlineFeedback title="音声入力待機中" tone="success">
              マイク状態、処理中、失敗時の表示は同じ feedback パターンで扱います。
            </InlineFeedback>
          </div>
        </Card>
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-bold text-ink">補助パターン</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <EmptyState
            action={<Button variant="outline">テンプレートを作成</Button>}
            description="まだ利用できるタスクテンプレートがありません。最初の作業手順を登録してください。"
            title="テンプレート未登録"
          />
          <Card className="p-4">
            <Tabs
              activeValue="detail"
              items={[
                {
                  content: '手順、判定条件、作業者向けメモをまとめて表示します。',
                  label: '詳細',
                  value: 'detail',
                },
                {
                  content: '判定履歴とエラーの傾向を確認します。',
                  label: '履歴',
                  value: 'history',
                },
                {
                  content: '音声で案内する次アクションを確認します。',
                  label: '音声',
                  value: 'voice',
                },
              ]}
            />
          </Card>
          <Card className="p-4">
            <InlineFeedback title="保存できませんでした" tone="danger">
              通信状態を確認し、数秒後にもう一度保存してください。
            </InlineFeedback>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Dialog
            description="判定結果を手動で完了に変更します。"
            isPreview
            open
            title="手動完了の確認"
          >
            カメラ判定を上書きするため、作業記録に操作履歴を残します。
          </Dialog>
          <Sheet
            description="モバイルでは下から表示する補助パネルを想定します。"
            isPreview
            open
            title="タスク詳細"
          >
            <p className="text-sm leading-6 text-ink-3">
              固定具、資材、担当者確認の順に作業します。
            </p>
          </Sheet>
        </div>
      </section>
    </PageContainer>
  )
}

type TokenSwatchProps = {
  className: string
  label: string
  value: string
}

function TokenSwatch({ className, label, value }: TokenSwatchProps) {
  return (
    <div className={`${className} min-h-24 rounded-lg p-4`}>
      <p className="text-sm font-bold">{label}</p>
      <p className="mt-6 font-mono text-xs">{value}</p>
    </div>
  )
}

type TaskRowProps = {
  status: StatusKind
  title: string
}

function TaskRow({ status, title }: TaskRowProps) {
  return (
    <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 p-4">
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-1 text-sm text-ink-4">最終更新: 今日 09:24</p>
      </div>
      <StatusBadge status={status} />
    </div>
  )
}

type MessageBubbleProps = {
  children: string
  speaker: string
  tone: 'system' | 'user'
}

function MessageBubble({ children, speaker, tone }: MessageBubbleProps) {
  const classes =
    tone === 'system'
      ? 'justify-self-start bg-washi text-ink'
      : 'justify-self-end bg-ink-2 text-white'

  return (
    <div className={`${classes} max-w-[88%] rounded-lg p-3`}>
      <p className="text-xs font-semibold opacity-75">{speaker}</p>
      <p className="mt-1 text-sm leading-6">{children}</p>
    </div>
  )
}
