# Contributing Guide

## 開発環境セットアップ（Nix）

このプロジェクトは **Nix flakes** で開発環境を管理している。
OS・マシン問わず全員が同一バージョンの bun / git / gh を使える。

### 前提: Nix インストール

```bash
# まだ入っていない場合（Determinate Systems 推奨）
curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install
```

### 方法 A: `nix develop`（手動）

```bash
nix develop   # dev shell に入る（bun, git, gh が使えるようになる）
bun install   # 依存関係インストール
bun dev       # 開発サーバー起動
```

シェルを抜けるときは `exit`。

### 方法 B: `direnv`（自動、推奨）

ディレクトリに入るだけで dev shell が自動で有効になる。

```bash
# 1. direnv をインストール
brew install direnv nix-direnv

# 2. シェルフックを追加（zsh の場合）
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc && source ~/.zshrc

# 3. プロジェクトで許可
cd /path/to/tsugite
direnv allow
```

以降は `cd tsugite` するだけで dev shell が有効になる。

### flake.lock について

`flake.lock` はコミット管理する。nixpkgs のコミットハッシュがピン留めされており、
これにより全員が同じバージョンのツールを使える。

ツールバージョンを上げる場合:

```bash
nix flake update  # flake.lock を更新
git add flake.lock && git commit -m "chore: update nix flake inputs"
```

---

## セットアップ（従来の方法）

Nix を使わない場合。bun が入っていれば動く。

```bash
bun install
```

初回 `bun install` 実行時に Husky のフックが自動セットアップされる。

---

## ブランチ戦略

```
main          # 本番相当。直接 push 禁止
  └── feature/<ticket-or-desc>   # 機能開発
  └── fix/<desc>                  # バグ修正
  └── chore/<desc>                # 設定・ツール系
  └── docs/<desc>                 # ドキュメントのみの変更
```

- **作業はかならず feature/fix/chore ブランチで行う**
- main への直接 push は禁止
- ブランチ名は英語小文字 + ハイフン区切り（例: `feature/user-auth`）

---

## コミット規約（Conventional Commits）

```
<type>(<scope>): <subject>

[optional body]
```

### type 一覧

| type       | 使いどき                             |
| ---------- | ------------------------------------ |
| `feat`     | 新機能                               |
| `fix`      | バグ修正                             |
| `docs`     | ドキュメントのみの変更               |
| `style`    | フォーマット変更（ロジック変更なし） |
| `refactor` | リファクタリング（feat/fix 以外）    |
| `perf`     | パフォーマンス改善                   |
| `test`     | テストの追加・修正                   |
| `chore`    | ビルドプロセス・ツールの変更         |
| `revert`   | コミットの取り消し                   |
| `ci`       | CI/CD 設定の変更                     |

### 例

```
feat(auth): add Google OAuth login
fix(ui): correct button alignment on mobile
chore: upgrade Next.js to 16.3
```

コミット時に commitlint が自動チェックする。違反するとコミットが弾かれる。

---

## コーディング規約

### 全般

- **TypeScript strict モード** を維持する（`tsconfig.json` 変更禁止）
- `any` 型は原則禁止。回避できない場合は `// eslint-disable-next-line` + 理由コメントを付ける
- コードフォーマットは Prettier に完全委任（コミット時に自動修正される）

### 命名

| 対象                 | 規則            | 例                       |
| -------------------- | --------------- | ------------------------ |
| コンポーネント       | PascalCase      | `UserCard.tsx`           |
| フック               | camelCase + use | `useUserProfile.ts`      |
| 関数・変数           | camelCase       | `fetchUserData`          |
| 定数                 | UPPER_SNAKE     | `MAX_RETRY_COUNT`        |
| 型・インターフェース | PascalCase      | `type UserProfile = ...` |

### ディレクトリ構成

```
app/
  (routes)/          # Next.js ルートグループ
  layout.tsx
  page.tsx
components/
  ui/                # Button, Input など再利用 UI primitive
features/
  <feature-name>/    # 機能単位のモジュール
    components/      # その機能固有のコンポーネント
    hooks/           # その機能固有のフック
    utils/           # その機能固有のユーティリティ
    types/           # その機能固有の型定義
lib/                 # グローバルユーティリティ・API クライアント・定数
hooks/               # グローバルカスタムフック
types/               # グローバル型定義
```

### コンポーネント

- `'use client'` は本当に必要な場合のみ（デフォルトは Server Component）
- Props は `interface` ではなく `type` で定義
- コンポーネントファイル 1 つにつき export default 1 つ

---

## PR ルール

1. **PR のタイトル**は Conventional Commits 形式に合わせる
   - 例: `feat(auth): add Google OAuth login`
2. PR は **1機能・1修正単位**で出す（モノリシックな PR は禁止）
3. セルフレビューしてから PR を open する
4. マージは **Squash merge** を使う（main のヒストリーを綺麗に保つ）
5. マージは本人以外がレビュー後に行う（ハッカソン中は最低1人のApproveで可）

---

## 環境変数

- `.env.local` を使う（`.gitignore` で除外済み）
- チームメンバーには Slack/Discord で直接共有
- 追加した際は必ず `.env.example` に **値なし**でキー名を追記する

```bash
# .env.example
APP_ORIGIN=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
DATABASE_URL=
```

---

## ローカル開発

```bash
bun dev        # 開発サーバー起動 (http://localhost:3000)
bun run build  # 本番ビルド確認
bun run lint   # ESLint 実行
bun run db:generate # Drizzle schema から migration 生成
bun run db:push     # Supabase migration 適用
```
