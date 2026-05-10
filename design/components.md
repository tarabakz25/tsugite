# Component Architecture

TSUGITE のコンポーネント設計方針と対応関係を定義します。

## ディレクトリ構成

- `components/ui/`: プロジェクト全体で再利用可能な汎用UIプリミティブ（ビジネスロジックを持たない）
- `components/layout/`: ページ全体のレイアウトを構成するコンポーネント（`page-container`, `split-layout` など）
- `features/<name>/components/`: 特定の機能ドメインに依存するコンポーネント

## UI Components Mapping

基本的なUI部品は `components/ui/` 配下のものを利用してください。

| コンポーネント名 | ファイルパス                  | 責務・用途                                                                                                    |
| ---------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Button           | `components/ui/button.tsx`    | アクションのトリガー。`variant` (`primary`, `secondary`, `outline`, `ghost`, `danger`) と `size` を指定可能。 |
| Card             | `components/ui/card.tsx`      | 情報のグループ化。                                                                                            |
| Badge            | `components/ui/badge.tsx`     | ステータスや属性の表示。`tone` (`neutral`, `success`, `warning`, `danger`) を指定可能。                       |
| Container        | `components/ui/container.tsx` | コンテンツの最大幅と左右の余白を制御。                                                                        |
| Sheet            | `components/ui/sheet.tsx`     | モバイル向けのボトムシートやサイドパネル。                                                                    |

## 命名規則と状態管理

- コンポーネント名は `PascalCase`、ファイル名は `kebab-case.tsx` とします。
- 汎用UIコンポーネントはビジネスロジックや状態（APIフェッチなど）を持たず、Props経由でデータを受け取るように設計してください。
