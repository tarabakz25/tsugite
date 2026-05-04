# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added

- Drizzle を導入し、`drizzle.config.ts` と `db/schema.ts` に `profiles` / `shops` / Archive / Guide / Agent のDBスキーマを定義。DB構造をTypeScriptから確認・生成できるようにした
- `supabase/migrations/20260505090000_core_feature_schema.sql` で `shops`、`interviews`、`tacit_tags`、`tag_embeddings`、`reference_scenes`、`observation_logs` と RLS policy を追加。ArchiveをGuideとAgentのデータソースにする依存関係へ整理した
- `package.json` に `db:generate` / `db:studio` scripts を追加。Drizzle Kit 経由のmigration生成とschema確認をBunで実行できるようにした
- `.gitignore` と `.prettierignore` に `.clerk/.tmp/` と `supabase/.temp/` を追加。ローカル生成ファイルがstatusやformat checkを汚さないようにした
- `supabase/migrations/20260504210000_profiles_insert_own.sql` で `profiles_insert_own` RLS policy を追加。Auth トリガー未適用時や既存ユーザーで `profiles` 行が無い場合も、ログイン済みユーザーが自分のプロフィール行を作れるようにした
- `package.json` に `db:init` / `db:link` / `db:push` scripts を追加。Supabase CLI の初期化、プロジェクトリンク、migration 適用を Bun 経由で実行できるようにした
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

- `getCurrentProfile()` でログイン済みユーザーの `profiles` 行が見つからない場合、Google のユーザーメタデータから自分のプロフィール行を作成してオンボーディングへ進めるようにした
- OAuth ログイン後の既定遷移先を `/` から `/onboarding/role` に変更。LP のログインリンクから入った場合も、ログイン済みユーザーはロール選択または該当ダッシュボードへ進めるようにした
- ルート `/` はマーケ用ランディング（`app/(marketing)/page.tsx`）。`/sign-in`・`/sign-up` は `/login` へ誘導
- オンボーディング・店／継ぎ手プロフィールの永続化は Clerk `publicMetadata` ではなく `public.profiles` の `role` / `shop_profile` / `successor_profile` に統一
- `.env.example` を Supabase（`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`）と `APP_ORIGIN` に合わせ、`GOOGLE_*` と `AUTH_SESSION_SECRET` の記載を廃止
- ESLint の `@typescript-eslint/no-unused-vars` で `_` 接頭辞の未使用変数・引数を無視するようにした（Supabase サーバークライアントの `setAll` などで利用）
