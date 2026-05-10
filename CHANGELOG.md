# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Changed

- **API**: Hono のキャッチオール（`app/api/[[...route]]`）をやめ、Next.js App Router の標準 Route Handler に分割。URL（`/api/health`、`/api/agent/*`、`/api/guide/*`、`/api/archive/*`）は互換維持。`maxDuration = 300` は文字起こし・抽出など長時間処理が必要な archive 系のみに限定。共通処理は `lib/api/http.ts`（JSON バリデーション・エラー応答）、`lib/api/auth.ts`、`lib/api/agent-access.ts` に集約。依存から `hono` と `@hono/zod-validator` を削除。
- ミドルウェア（`lib/supabase/proxy.ts` の `updateSession`）: Supabase セッションがある場合、`/` と `/login` へのアクセスは `/dashboard` へリダイレクト。`/login` で `returnTo` または `next` が `sanitizeReturnTo` で有効かつ `/` でない場合はそのパスへ遷移（ログイン画面のスキップ時もディープリンク尊重）。`/login` 自身への returnTo は無限ループ防止のため無視。

### Added

- `app/dashboard/` — `/shop/*` と `/successor/*` を `/dashboard/*` に統合。ロール（`shop` / `successor`）で表示・ナビを分岐させる単一ルートを新設
  - `app/dashboard/layout.tsx`: ロール別サイドナビ（shop: 概要/プロフィール/Archive/Agent/設定、successor: +Guide）
  - `app/dashboard/page.tsx`: ロール別ダッシュボードトップ
  - `app/dashboard/profile/page.tsx`: ロール別プロフィールフォーム
  - `app/dashboard/archive/page.tsx`: ロール別（shop: ArchiveContent、successor: タグ閲覧スタブ）
  - `app/dashboard/archive/[id]/page.tsx`: shop 専用インタビュー詳細（successor は `/dashboard/archive` へリダイレクト）
  - `app/dashboard/archive/[id]/_components/transcribe-button.tsx`: 文字起こしボタン（shop 専用詳細ページ用）
  - `app/dashboard/guide/page.tsx`: successor 専用 Guide ページ（shop は `/dashboard` にリダイレクト）
  - `app/dashboard/agent/page.tsx`: ロール別 Agent（shop: ensureShopForProfile、successor: mockShopId で仮置き）
  - `app/dashboard/settings/layout.tsx`: ロール別タブ（shop: 店舗情報/メンバー/アカウント、successor: プロフィール/アカウント）
  - `app/dashboard/settings/page.tsx`: ロール別デフォルトリダイレクト
  - `app/dashboard/settings/shop/page.tsx`, `members/page.tsx`, `profile/page.tsx`, `account/page.tsx`: 設定サブページ（既存フォームを再利用）

- `features/archive/actions.ts`: インタビュー削除用 `deleteInterview`（ストレージ上の音声・動画削除後に DB 削除）および暗黙知タグ削除用 `deleteTacitTag`（埋め込み行を先に削除してからタグ削除）を追加
- `features/archive/components/interviews-list.tsx` / `tacit-tags-list.tsx`: 各一覧に削除ボタン（確認ダイアログ付き）を追加。削除成功後は `router.refresh()` でサーバーデータのみ再取得し、Archive のタブ選択を維持したまま一覧を更新する

### Fixed

- `features/agent/components/agent-chat.tsx`: `cn` のインポートが欠落していたため Vercel ビルドで TypeScript エラーが発生していた。`@/lib/cn` からのインポートを追加。
- `features/agent/components/agent-chat.tsx`: `PageContainer` の `maxWidth` に存在しない値 `"3xl"` を使用していたため TypeScript ビルドエラーが発生していた。有効な値 `"2xl"` に修正。
- `/onboarding/role`: `profiles` 行が未作成のユーザーでもロール選択を保存できるよう、`setUserRole` を `update` から `upsert` に変更。`profiles_insert_own` RLS policy を追加し、認証済みユーザーが自分の profile 行だけ作成できるようにした。店/継ぎ手プロフィール保存でも 0 件 update を成功扱いしないよう検出する。
- ログイン済みユーザーの `/login` → `/dashboard` 自動遷移で、middleware が更新した Supabase セッション Cookie を redirect レスポンスへ引き継ぐよう修正。あわせて dashboard/onboarding 系 layout のログイン判定とプロフィール取得判定を分離し、`profiles` 取得失敗時に `/dashboard` ↔ `/login` の 307 ループが起きないようにした。
- Google OAuth (`/auth/callback`): `exchangeCodeForSession` で付与されるセッション Cookie を、`lib/supabase/oauth-callback.ts` の `createOAuthCallbackSupabase` 経由で返却する同一の `NextResponse.redirect` に書き込むよう変更。コード交換後に別の redirect レスポンスだけ返していたため `Set-Cookie` が欠落し、middleware が未ログイン扱いで `/onboarding`→`/login` になる事象を防ぐ。`setAll` が複数回呼ばれる場合（チャンク分割 JWT 等）は各バッチを `Map` にマージしてから redirect を組み直し、ミドルウェアと同様に `request.cookies` へも反映する。
- Google OAuth 後の既定遷移を要件 `AUTH-03` に合わせ、`profiles.role` が `shop` / `successor` のときは `/shop` / `/successor`、未設定は `/onboarding/role`。`sanitizeReturnTo` で許可された `next` が付いている場合は従来どおりそれを優先。
- `lib/supabase/proxy.ts`: 保護対象に `/shop`・`/successor` を追加。未ログイン時は `/login?returnTo=…` で元のパスへ戻れるようにした。
- `app/onboarding/role`・`onboarding/shop`・`onboarding/successor`、および店/継ぎ手プロフィール保存（`features/register/*-actions`）後のリダイレクト先をロール別ホーム（`/shop` / `/successor`）に統一。
- **`/shop` と `/successor` のコンソール入口を再構成** — 概要とサイドナビを `app/shop/layout.tsx` / `app/successor/layout.tsx` と各 `page.tsx` で提供。機能画面はサイドナビから既存の `/dashboard/*` へ遷移。`/shop/profile`・`/shop/settings`（および successor 側の対応ペア）は `/dashboard/profile`・`/dashboard/settings` へのリダイレクトのみ。

### Added

- `features/dashboard/dashboard-user-nav.tsx`: サイドバー最下部のアカウント情報ボックスを新設
  - ユーザー名、メールアドレス、プロフィールアイコン（頭文字）を表示
  - クリックでプロフィール編集、設定、ログアウトのメニューを展開
- `lucide-react`: アイコンライブラリを追加

### Changed

- `package.json` の `dev` スクリプトに `--hostname 0.0.0.0` を追加。LAN経由（スマホ等）でのローカル開発テストを可能にするため
- `features/guide/utils/vision.ts`: Vision 画像認識を Google Gemini (`gemini-2.0-flash-exp`) から OpenAI (`gpt-4o`) に置き換え。API を OpenAI に統一し、`@google/generative-ai` への依存を解消
  - `@google/generative-ai` パッケージを `package.json` から削除
  - 既存の `analyzeSceneWithVision` の入出力インターフェースは変更なし（既存の呼び出し元に影響なし）
- Agent RAG チャットを、暗黙知タグの参照が回答 UI に残る構成へ変更。`X-Citations` ヘッダーではなく AI SDK の `data-citations` part として参照タグをストリームし、各 assistant message の下に状況・判断理由の出典を表示するようにした
- `/api/agent/chat` に Supabase 認証と shop アクセス確認を追加。店主自身の shop、または暫定的に `profiles.organization_ids` に含まれる shop のみ RAG 参照できるようにした
- `/successor/agent` は固定のモック shopId を使わず、`profiles.organization_ids` の先頭 shop を参照するよう変更。紐づきが無い場合は未設定状態を表示する
- Agent RAG の DB 参照を `DATABASE_URL` での direct Postgres 接続から Supabase HTTP/RPC 経由に変更。ローカルやホスティング環境で 5432 接続が閉じていてもチャットが失敗しないようにした
- **ダッシュボード UI の刷新**:
  - `features/dashboard/dashboard-side-nav.tsx`: 従来のヘッダーメニュー型から、モダンなサイドバーレイアウトに変更。プロフィールと設定のリンクをメインメニューから削除し、下部のアカウントボックスに集約
  - `app/shop/layout.tsx` / `app/successor/layout.tsx`: メインナビゲーションを整理し、サイドバーにユーザー情報を表示するよう更新
  - サイドバー幅を `md:w-52` から `md:w-64` に拡張し、情報密度を最適化
  - デスクトップ表示時にサイドバーを `sticky` にし、スクロールしてもナビゲーションが固定されるよう改善
  - ユーザーナビのホバー表現を微調整
  - **ダッシュボード概要ページの充実**: `app/shop/page.tsx` および `app/successor/page.tsx` に、統計情報やクイックアクセスカードを追加し、ダッシュボードとしての機能性と視認性を大幅に向上

### Added

- `components/layout/`: 共通レイアウトコンポーネントを新設
  - `PageContainer`: 画面の最大幅とパディングを一括管理
  - `PageHeader`: ページタイトル、説明文、アクションエリアを標準化
  - `SplitLayout`: カメラビューとフィードバックなど、2カラムのレスポンシブレイアウトをサポート
  - `GridList`: カード群を並べるレスポンシブグリッドレイアウトを提供
- Agent RAG 検索に、embedding 済みタグが不足した場合の最近の暗黙知タグフォールバックを追加。Archive でタグ抽出済みだが embedding が未生成の状態でも、記録を根拠にした回答へ寄せられるようにした
- Agent 用の Supabase migration `20260506130000_agent_rag_rpc_and_access.sql` を追加。pgvector 類似検索 RPC と、`profiles.organization_ids` による継ぎ手向け参照ポリシーを定義した

### Changed

- **UIデザインとカラートークンの一貫性を向上**
  - プロジェクト独自のデザイントークン (`washi`, `ink`, `shu` 等) に全画面のカラー指定を統一。
  - **Archive**: カードをグリッドレイアウトに変更し、ダッシュボードとしての視認性を向上。
  - **Guide**: `SplitLayout` を導入。カメラビューと操作パネルを左右に分離し、作業時の目線移動を最適化。ステータスバッジをカメラにオーバーレイ表示。
  - **Agent**: チャット領域の最大幅を制限し、可読性を向上。入力フォームを画面下部に固定し、モダンなフローティングUIに刷新。サンプル質問を Pill 型のチップに変更。
- Agent RAG チャットを、暗黙知タグの参照が回答 UI に残る構成へ変更。`X-Citations` ヘッダーではなく AI SDK の `data-citations` part として参照タグをストリームし、各 assistant message の下に状況・判断理由の出典を表示するようにした
- `/api/agent/chat` に Supabase 認証と shop アクセス確認を追加。店主自身の shop、または暫定的に `profiles.organization_ids` に含まれる shop のみ RAG 参照できるようにした
- `/successor/agent` は固定のモック shopId を使わず、`profiles.organization_ids` の先頭 shop を参照するよう変更。紐づきが無い場合は未設定状態を表示する
- Agent RAG の DB 参照を `DATABASE_URL` での direct Postgres 接続から Supabase HTTP/RPC 経由に変更。ローカルやホスティング環境で 5432 接続が閉じていてもチャットが失敗しないようにした

### Fixed

- `proxy.ts` を `middleware.ts` にリネームし `export default` に変更。ファイル名・エクスポート形式が誤っていたため Next.js にミドルウェアとして認識されず、セッションリフレッシュと保護ルートの未認証リダイレクトが一切動いていなかった
- `app/auth/callback/route.ts`: `request.url` の origin が dev server のバインドアドレス `0.0.0.0:3000` になる問題を修正。`x-forwarded-host` → `host` ヘッダーの優先順で origin を組み立てるよう変更し、ローカル開発時のログイン後リダイレクトが本番 URL に飛ぶ問題を解消

### Removed

- 各機能画面での個別の `max-w-7xl` や余白指定（`PageContainer` への移行に伴い削除）。
- `app/shop/` と `app/successor/` を完全削除。URL を `/dashboard` に一本化

### Changed

- `lib/supabase/proxy.ts`: `PROTECTED_PREFIXES` を `['/dashboard', '/register', '/onboarding']` に更新（旧 `/shop`, `/successor`）
- `app/auth/callback/route.ts`: ログイン後リダイレクト先を `/dashboard` に変更（旧ロール別 `/shop` / `/successor`）
- `app/onboarding/role/page.tsx`, `shop/page.tsx`, `successor/page.tsx`: ロール確定・不一致時のリダイレクト先を `/dashboard` に変更
- `features/register/shop-actions.ts`, `successor-actions.ts`: 登録完了後のリダイレクト先を `/dashboard` に変更

### Fixed

- `app/dashboard/layout.tsx`: `role ?? undefined` で `UserRole | null` → `'shop' | 'successor' | undefined` 型不一致を解消（`redirect()` 後の TypeScript narrowing 欠如を回避）
- `app/dashboard/settings/layout.tsx`: `role as 'shop' | 'successor'` で同様の型不一致を解消
- `app/dashboard/archive/page.tsx`, `archive/[id]/page.tsx`, `agent/page.tsx`: `ensureShopForProfile` 後の `shop` が possibly null の TS18047 エラーを `shop!.id` で解消（各ページで `redirect()` による非 null 保証済み）

- `app/register/` を廃止し `app/onboarding/` に集約。オンボーディングフローを一箇所に統一
  - `app/register/shop/` → `app/onboarding/shop/`
  - `app/register/successor/` → `app/onboarding/successor/`
  - URL参照を更新: `features/onboarding/actions.ts`, `app/shop/guide/page.tsx`

- 認証関連の冗長ルートを削除・整理。`/auth/*` を `app/auth/` 一本に集約
  - `app/sign-in/` — Clerk 残骸（`/sign-in` → `/login` redirect のみ）
  - `app/sign-up/` — Clerk 残骸（`/sign-up` → `/login` redirect のみ）
  - `app/(auth)/auth/login/` — 不要な redirect（`/auth/login` → `/login`）
  - `app/(auth)/auth/role/` — 不要な redirect（`/auth/role` → `/onboarding/role`）
  - `app/(auth)/` ルートグループ — layout なしで意味がなかったため廃止
- `app/(auth)/auth/signup/page.tsx` を `app/auth/signup/page.tsx` に移動（`/auth/*` を一箇所に集約）

- マッチング機能（募集・応募）に関するすべてのUI・ルート・型・モックデータを削除。tsugiteはマッチング機能を提供しないため
  - `app/shop/listings/` — 募集一覧・作成・編集ページ
  - `app/(marketing)/opportunities/` — 公開募集一覧・詳細ページ
  - `app/shop/applications/page.tsx` — 店側応募者一覧
  - `app/successor/applications/page.tsx` — 継ぎ手側応募履歴
  - `types/opportunity.ts` — Opportunity 型定義
  - `lib/mock-listings.ts` — ShopListingDraft 型・モックデータ
  - `lib/mock-opportunities.ts` — MOCK_OPPORTUNITIES・getOpportunityById
- `app/shop/layout.tsx`: ナビから「募集管理」「応募」リンクを削除
- `app/successor/layout.tsx`: ナビから「応募一覧」リンクを削除
- `app/(marketing)/page.tsx`: Hero の「継ぎ手として探す」ボタン、店主カードの「後継者募集の掲載・応募者管理」、継ぎ手カードの「全国の後継者募集を一覧で探す」・「募集を探す」ボタンを削除
- `app/successor/page.tsx`: MOCK_OPPORTUNITIES 参照・応募状況ダミーブロックを削除し、シンプルなダッシュボードに置き換え

### Fixed

- `app/shop/archive/[id]/page.tsx`: `getSignedInterviewUrl` を `features/hackathon/real-data` から直接 Supabase Storage の `createSignedUrl` 呼び出しにインライン化。hackathon モジュール依存を除去
- `app/successor/archive/page.tsx`: `getAppData` (hackathon) を除去し、アプリケーション機能の実装まで「近日公開予定」プレースホルダーに置き換え（元々 successor では常に fallback mock データを返していた）

### Removed

- `features/hackathon/`: ハッカソン用デモコード（`mvp-ui.tsx`、`mvp-data.ts`、`real-data.ts`、`agent-demo-chat.tsx`、`archive-upload-card.tsx`、`live-guide-demo.tsx`）を完全削除。本番ルートからの全 import を除去したことを確認済み

- `interviews-list.tsx`: `onProcess` が例外を投げた場合に `setProcessingId(null)` が呼ばれず、処理ボタンが「処理中...」のまま固まるバグを `try/finally` で修正
- `archive-content.tsx`: `fetch()` 自体が例外を投げた場合（ネットワークエラー等）を `try/catch` で補足し、エラー内容を `alert()` で表示するよう修正。エラーアラートにステータスコードと実際のエラーメッセージを含めるよう改善
- `archive.ts`: Whisper API の 25MB ファイルサイズ制限を事前チェックし、超過時に 422 と分かりやすいエラーメッセージを返すよう追加。ストレージダウンロード・DB更新・Whisper呼び出し各フェーズのエラーメッセージを詳細化
- `route.ts`: `maxDuration = 300`（5分）を追加。MP4動画の文字起こしは時間がかかるため、Vercel本番でのタイムアウトを防ぐ
- Archive の暗黙知タグ抽出で `gpt-4o` を使用し、レスポンス形式を明示的な JSON に固定することでタグ解析の安定性を改善
- Archive アップロードで音声ファイル（MP3）をアップロードすると `403 new row violates row-level security policy` で失敗する問題を修正。`storage.objects` の INSERT RLS ポリシーが `public.shops` をサブクエリで直接参照していたため、storage の RLS 評価コンテキストと shops 側の RLS（`to authenticated`）が競合しサブクエリが空を返していた。`SECURITY DEFINER` 関数 `storage.is_interview_path_owner()` を追加し、SELECT/INSERT/DELETE の各ポリシーをこの関数経由に切り替えることで修正（migration: `20260506120000_fix_storage_rls_cross_schema`）

### Added

- `app/shop/settings/` および `app/successor/settings/`: ロール別設定セクションを新設
  - `shop/settings/shop/page.tsx`: 既存の `ShopProfileForm` を再利用し、現在の `shop_profile` を初期値としてプリフィルする店舗情報編集ページ
  - `shop/settings/members/page.tsx`: メンバー管理プレースホルダー（近日公開予定）
  - `shop/settings/account/page.tsx`: アカウント設定プレースホルダー（近日公開予定）
  - `successor/settings/profile/page.tsx`: 既存の `SuccessorProfileForm` を再利用し、現在の `successor_profile` を初期値としてプリフィルするプロフィール編集ページ
  - `successor/settings/account/page.tsx`: アカウント設定プレースホルダー（近日公開予定）
- `features/settings/settings-tab-nav.tsx`: 設定画面内のタブナビゲーション用クライアントコンポーネントを新設。`role` prop で shop（朱色）/ successor（藍）のアクティブ色を切り替え
- `app/shop/layout.tsx` / `app/successor/layout.tsx`: ダッシュボードサイドナビに「設定」リンクを追加

- `app/shop/archive/[id]/page.tsx`: インタビュー詳細ページを新設。動画・音声プレイヤー、処理状態バッジ、文字起こしテキスト、暗黙知タグ一覧を表示
- `app/shop/archive/[id]/_components/transcribe-button.tsx`: 文字起こし→暗黙知抽出→embedding の pipeline をクライアントで実行するボタンコンポーネントを新設。成功後に `router.refresh()` でページを更新
- `app/shop/agent/page.tsx`: 店側向け Agent ページを新設。実際の `shopId` を DB から取得して `AgentChat` に渡す
- `app/successor/archive/page.tsx`: 継ぎ手向け Archive 閲覧ページを新設（読み取り専用・モックデータ）
- コードから逆算した現状要件定義書 `docs/current-requirements.md` を追加。認証、ロール、Archive、Guide、Agent、DB/API、モック範囲、未決事項を整理

### Changed

- `features/dashboard/dashboard-side-nav.tsx`: `role?: 'shop' | 'successor'` prop を追加。shop は shu（朱色）、successor は ink-3（藍）でアクティブ色とタイトル色を切り替えることで、役割を視覚的に区別
- `app/shop/layout.tsx`: `SHOP_NAV` に `{ href: '/shop/agent', label: 'Agent - AI相談' }` を追加。`DashboardSideNav` に `role="shop"` を渡す
- `app/successor/layout.tsx`: `SUCCESSOR_NAV` に Archive閲覧・Agent の2項目を追加。`DashboardSideNav` に `role="successor"` を渡す
- `features/hackathon/archive-upload-card.tsx`: アップロード成功後のリダイレクト先を `/app/archive/${id}` から `/shop/archive/${id}` に変更。文字起こしボタンが存在しない `/app/*` ルートへの流入を解消

- Archive アップロードを Server Action 経由のファイル送信から Supabase Storage 署名アップロードへ変更。音声・動画ファイル本体をブラウザから直接 Storage に送ることで、Next.js Server Action の 1MB body 制限を回避
- Archive アップロードでMP3音声ファイルを受け付けるように変更。フォームの許可形式、Server Action の検証、文字起こしAPIへ渡すファイル名、詳細画面の音声再生表示を動画・音声両対応にした
- **デザイン言語を全ページで washi/ink/shu トークンに統一**（マーケティング側が zinc ベースだった断絶を解消）
  - `features/marketing/site-header.tsx`: `zinc` クラスを washi/ink トークンに置換、`dark:` クラスを削除
  - `features/marketing/site-footer.tsx`: 同上
  - `app/(marketing)/page.tsx`: Hero グラジェントを `washi/shu-3` ベースの和紙テクスチャ風に再設計、CTA ボタンを `bg-shu` に変更、機能カードのリンクを `text-shu` に統一
  - `app/(marketing)/opportunities/page.tsx`: zinc → washi/ink/shu 置換、prefecture バッジを `bg-shu-3 text-shu` に変更
  - `app/(marketing)/contact/page.tsx`, `privacy/page.tsx`, `terms/page.tsx`: zinc → ink/ink-3 置換、`dark:` クラス削除
- **Noto Serif JP を見出し用 serif フォントとして追加**
  - `app/layout.tsx`: `Noto_Serif_JP`（weight 400/600）を `--font-noto-serif-jp` 変数で注入
  - `app/globals.css`: `--font-serif` トークンを `@theme inline` に追加
  - LP h1、`PageHeader` タイトル、`SectionTitle`、各ページ h1 に `font-serif` を適用
- **アプリナビにアクティブ状態を追加**
  - `app/app/layout.tsx`: `usePathname()` で現在パスを検出し、一致する nav アイテムに `bg-white text-ink` を常時適用（`'use client'` に変換）
- **アプリホームの重複セクションを削除**
  - `app/app/page.tsx`: Guide/Archive/Agent を重複表示していた2つ目の機能カードグループを削除

### Removed

- `/demo/ryokan` ページを削除（内容を `/app` ホームに統合）
- `/demo/pitch` ページを削除
- `app/(public)/` ルートグループを削除
- `/app` ヘッダーの「デモ導線」ボタンを削除

### Changed

- ヘッダーブランド名 `TSUGITE MVP` → `TSUGITE`
- LP の CTA を3ボタン（旅館デモ/ピッチ/MVP本体）から1ボタン「はじめる」→ `/app` に統一
- `/app` ホームに「使い方」3ステップ（Archive→Guide→Agent）を統合
- 全 `/app/*` ページからハッカソン・審査員・MVP・低優先度などの内部向け文言を削除
- `mvpMetrics` の `note` を内部向け表記から製品向け表記に変更（"旅館デモ用"→"所作判定", "モック周期"→"応答速度"）

### Changed (追記)

- `features/hackathon/live-guide-demo.tsx` のモック実装を `GuideInterface`（本物）に差し替え
  - 算術スコア・固定チェックリスト・タイマーループを削除
  - `/api/guide/analyze`（Gemini Vision + GPT-4o）と `/api/guide/tts`（OpenAI TTS）に接続
  - `AppScene` → `SceneState` 変換を内部で実施（`name` → `sceneName`）
  - `shopId: null` 時はログイン誘導メッセージを表示
- `app/app/guide/scenes/[id]/live/page.tsx`: description をリアルカメラ判定の実態に合わせて更新

### Added (追記)

- Supabase コア機能スキーマ適用（migration: `20260505090000_core_feature_schema`）
  - テーブル作成: shops, interviews, tacit_tags, tag_embeddings, reference_scenes, observation_logs
  - 全テーブルに RLS 適用済み（owner のみ自分のデータにアクセス可能）
  - vector 拡張インストール（tag_embeddings の 1536 次元ベクトル用）
- Supabase Storage bucket 作成（migration: `20260505100000_storage_buckets`）
  - `interview-videos` bucket（private）
  - アップロード・読み取り・削除の RLS ポリシー設定済み
- デモデータ投入: shop（"デモ店舗"）と reference_scene（"客室のお茶出し準備"）を DB に直接 seed

### Added

- ハッカソン審査向けのMVPページマップを追加。既存の店／継ぎ手ダッシュボードとは別に、デモで迷わない `/demo/*` と `/app/*` の体験導線を作成
  - `/demo/ryokan` に旅館固定デモシナリオを追加。Archive、Guide、Agentを審査員向けのクリック順で提示
  - `/demo/pitch` に30秒プレゼン用の大画面ビジュアルを追加
  - `/auth/login`、`/auth/signup`、`/auth/role` を追加。ハッカソンでは仮ログイン導線として `/app` に入れる構成
  - `/app` に3機能のエントリーカードとサマリーを追加
  - `/app/guide`、`/app/guide/scenes/new`、`/app/guide/scenes/[id]`、`/app/guide/scenes/[id]/live`、`/app/guide/logs` を追加。ライブ判定ページはカメラ風UIと判定モックでMVP核心を表現
  - `/app/archive`、`/app/archive/upload`、`/app/archive/[id]`、`/app/archive/tags`、`/app/archive/timeline` を追加。動画詳細と抽出タグを審査で見せやすくした
  - `/app/agent`、`/app/agent/history`、`/app/agent/sources` を追加。チャット本体は出典付きのモック会話で確実に見せる構成
  - `/app/settings/shop`、`/app/settings/members`、`/app/settings/account` を追加。低優先度設定ページは固定情報表示に留めた
  - `features/hackathon/` にMVP用の固定データ、共通UI、ライブ判定デモ、Agentチャットデモを追加
  - Playwright確認で見つかったモバイル幅のライブ判定UI横はみ出しを修正
  - `/app/*` のMVP画面をSupabase実データ対応に変更。ログイン中は `reference_scenes`、`interviews`、`tacit_tags`、`observation_logs` を表示し、未ログイン時だけデモデータにフォールバック
  - `/app/guide/scenes/[id]/live` から観察ログを `observation_logs` に保存できるように変更
  - `/app/archive/upload` を実アップロードフォームに差し替え、Supabase Storage と `interviews` レコード作成へ接続
  - `/app/agent` の出典表示と返答生成を実 `tacit_tags` ベースに変更

- Archive機能を実装。店主のインタビュー動画から暗黙知を抽出・蓄積する機能
  - Supabase Storage に動画をアップロードする機能（`interview-videos` バケット）
  - OpenAI Whisper API による文字起こし機能
  - GPT-4 による暗黙知タグ抽出（状況・判断・理由の3層構造）
  - OpenAI Embeddings API による埋め込みベクトル生成
  - `/shop/archive` ページでインタビュー一覧、暗黙知タグ一覧を表示
  - `features/archive/` に VideoUploadForm、InterviewsList、TacitTagsList コンポーネントを追加
  - `/api/archive/transcribe/:id`、`/api/archive/extract/:id`、`/api/archive/embed/:id` API エンドポイントを追加
- `openai`、`zod`、`ai` パッケージを dependencies に追加
- `.env.example` に `OPENAI_API_KEY` を追加
- `supabase/migrations/20260505100000_storage_buckets.sql` でストレージバケットとRLSポリシーを追加
- `lib/openai.ts` に OpenAI クライアントを追加
- AI Agent機能を実装。後継者が先代女将に相談できるRAGベースのチャットインターフェース（`/successor/agent`）を追加
- `ai` (Vercel AI SDK)、`openai`、`zod`、`@ai-sdk/openai`、`@hono/zod-validator` を依存関係に追加。LLMストリーミング、Embedding生成、TTS音声合成を実現
- `types/agent.ts` を追加。`ChatMessage`、`ChatCitation`、`RAGContext` などのAgent機能用型定義
- `lib/agent/rag.ts` を追加。OpenAI Embedding生成、pgvectorによる類似タグ検索、関連インタビュー取得、RAGプロンプト生成の実装
- `POST /api/agent/chat` エンドポイントを追加。質問をEmbedding化し、tacit_tagsとinterviewsを参照してGPT-4による回答をストリーミング生成
- `POST /api/agent/tts` エンドポイントを追加。OpenAI TTS APIで回答テキストを音声化
- `features/agent/components/agent-chat.tsx` を追加。チャットUI、メッセージ履歴、音声再生、出典表示、サンプル質問を実装
- `app/successor/agent/page.tsx` を追加。継ぎ手ダッシュボードから先代女将に相談できるページ
- `.env.example` に `OPENAI_API_KEY` を追加（OpenAI API利用のため）
- **Guide機能 (AI弟子モード) を実装**。スマホカメラで現場をかざすと、Vision APIが画像認識し、先代の正しい所作（`reference_scenes`）と照合してフィードバックする
  - WebRTCでカメラ映像を取得し、1〜2秒ごとにスナップショット撮影
  - Gemini 2.0 Flash (Google Generative AI) でクラウドVision推論を実施（MVPはオンデバイス推論を見送り）
  - GPT-4oでフィードバック文を生成（先代の口調で優しく指導）
  - OpenAI TTS APIで音声読み上げ
  - `observation_logs`テーブルへ観察結果を自動保存
  - `/shop/guide`ページと`features/guide/`モジュールを追加
  - デモシナリオ: 「客室のお茶出し準備」の参照シーンを作成可能
- Guide feature用のAPI routeを追加（`/api/guide/analyze`, `/api/guide/tts`）
- `.env.example`に`GOOGLE_GENERATIVE_AI_API_KEY`と`OPENAI_API_KEY`を追加
- 店向けダッシュボードナビゲーションに「Guide (AI弟子)」リンクを追加
- Guide feature用の依存関係を追加：`openai`, `@google/generative-ai`, `ai` (Vercel AI SDK)
- Drizzle を導入し、`drizzle.config.ts` と `db/schema.ts` に `profiles` / `shops` / Archive / Guide / Agent のDBスキーマを定義。DB構造をTypeScriptから確認・生成できるようにした
- `supabase/migrations/20260505090000_core_feature_schema.sql` で `shops`、`interviews`、`tacit_tags`、`tag_embeddings`、`reference_scenes`、`observation_logs` と RLS policy を追加。ArchiveをGuideとAgentのデータソースにする依存関係へ整理した
- `package.json` に `db:generate` / `db:studio` scripts を追加。Drizzle Kit 経由のmigration生成とschema確認をBunで実行できるようにした
- `.gitignore` と `.prettierignore` に `.clerk/.tmp/` と `supabase/.temp/` を追加。ローカル生成ファイルがstatusやformat checkを汚さないようにした
- TSUGITE のデザイントークンを `app/globals.css` に定義。和紙、墨、朱、状態色、focus / disabled の基準を Tailwind CSS v4 のクラスから参照できるようにした
- `components/ui/` に Button、Input、Textarea、Select、Checkbox、Toggle、Badge、StatusBadge、Card、Dialog、Sheet、Tabs、EmptyState、InlineFeedback、AppShell を追加。後続画面で共有できる UI プリミティブとして整備した
- デザインシステム UI カタログを `/design-system` に配置（旧ルート `app/page.tsx` 相当）
- Supabase（Postgres + Auth）を導入。`@supabase/supabase-js` と `@supabase/ssr`、`lib/supabase/` のブラウザ／サーバー／プロキシ用クライアント、ルートの `proxy.ts` でセッション更新する。匿名でも `/` は公開のままにする（未ログイン全局リダイレクトはしない）
- Google のみの OAuth 用に `/login` と `/auth/callback`（PKCE のコード交換）を追加
- `supabase/migrations/20260504120000_profiles.sql` で `public.profiles`（RLS・認証ユーザー作成時のトリガー・`updated_at` トリガー）を定義
- `supabase/migrations/20260504200000_profile_role_and_json.sql` で `profiles.role`（`shop` / `successor`）と `shop_profile` / `successor_profile`（jsonb）を追加
- アプリ側のプロフィール型を `types/profile.ts` に追加
- ランディングとマーケ用 `app/(marketing)/`（共通ヘッダ／フッタ）、募集一覧・詳細（`lib/mock-opportunities.ts`）、法務ドラフト（`/terms` `/privacy` `/contact`）
- 店／継ぎ手フロー：`/onboarding/role`、プロフィールフォーム（`/register/shop` `/register/successor`、上記 `profiles` 列に保存）、各ダッシュボード・募集管理 UI（モック中心）
- `proxy.ts`（Next.js 16）で `/shop/*`、`/successor/*`、`/register/*`、`/onboarding/*` をログイン必須にし、未ログイン時は `/login?returnTo=…` へリダイレクト
- `components/ui/container` と `app/not-found.tsx` / `app/error.tsx`
- `hono` を導入。`app/api/[[...route]]/route.ts` のキャッチオールルートにマウントし、Next.js Route Handler 経由で Vercel にデプロイできる構成にした。動作確認用に `GET /api/health` を追加
- Prettier + eslint-config-prettier を導入。コードフォーマットを自動化し、スタイル議論をゼロにする
- Husky + lint-staged によるpre-commitフック。コミット時にステージングファイルを自動フォーマット＆lint
- commitlint によるConventional Commits強制。チーム間のコミットメッセージを統一する
- ディレクトリ構成を確立 (`components/ui/`, `features/`, `lib/`, `hooks/`, `types/`)
- `CONTRIBUTING.md` を作成。ブランチ戦略・コミット規約・PR ルール・コーディング規約を定義
- `AGENTS.md` にプロジェクトルールを追記。AI エージェントがプロジェクト規約に従って動作するよう設定
- `.github/workflows/ci.yml` を追加。PRとmainへのpushでtypecheck・lint・format check・buildを自動実行
- `.github/pull_request_template.md` を追加。PRの概要・変更内容・動作確認チェックリストを標準化
- `.claude/skills/create-pr/SKILL.md` を追加。プロジェクト規約に沿ったPR作成をAIに行わせるプロジェクトレベルskill
- `flake.nix` を追加。Nix flakes で bun / git / gh を管理し、OS問わず開発環境を再現可能にする
- `flake.lock` を生成。nixpkgs `15f4ee4` (2026-04-30) にピン留め
- `.envrc` を追加。direnv 対応で `cd` するだけで dev shell が自動有効化される
- `.gitignore` に `.direnv/` と `result` を追加
- `CONTRIBUTING.md` に Nix セットアップ手順（`nix develop` / direnv 両方）を追記
- `README.md` を整備。プロジェクト概要・tech stack・セットアップ手順・コマンド一覧・ディレクトリ構成を記載

### Removed

- Hono の `/api/auth/*`、独自 Google トークン交換、`jose` のセッション署名クッキー、インメモリユーザーストアを削除（認証は Supabase に一本化）

### Changed

- Googleログイン後に戻り先指定が無い場合、ランディングではなくユーザーのroleに応じて `/shop`、`/successor`、未設定なら `/onboarding/role` へ遷移するようにした
- 店プロフィール登録済みでも `shops` 行が未作成のユーザーが、Archiveで概要へ戻されGuideで `/register/shop` へ飛ばされる問題を修正。新規保存時と既存ユーザーの機能ページ表示時に `shops` 行を補完するようにした
- 主要機能PR（Archive / Agent / Guide）を `develop` ベースで統合。共通APIルート、Bun依存管理、既存UIプリミティブ、AI SDK v6 APIに合わせて競合とビルドエラーを解消した
- ルート `/` はマーケ用ランディング（`app/(marketing)/page.tsx`）。`/sign-in`・`/sign-up` は `/login` へ誘導
- オンボーディング・店／継ぎ手プロフィールの永続化は Clerk `publicMetadata` ではなく `public.profiles` の `role` / `shop_profile` / `successor_profile` に統一
- `.env.example` を Supabase（`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`）と `APP_ORIGIN` に合わせ、`GOOGLE_*` と `AUTH_SESSION_SECRET` の記載を廃止
- ESLint の `@typescript-eslint/no-unused-vars` で `_` 接頭辞の未使用変数・引数を無視するようにした（Supabase サーバークライアントの `setAll` などで利用）
