# DESIGN.md

TSUGITE の UI/UX 設計および実装ルールへの入口です。
AI と人間が同じ判断基準で UI を実装し、レビューするための参照順と正本を定義します。

## Read first

UI実装を行う際は、以下の順序で参照してください。

1. **Tokens SSoT**: `app/globals.css` (Tailwind v4 の CSS 変数定義)
2. **Component Architecture**: `design/components.md` (コンポーネントの責務と命名)
3. **Layout Patterns**: `design/patterns.md` (画面レイアウトと共通パターン)

## Source of truth

- **Tokens SSoT**: `app/globals.css`
  - カラーパレット、タイポグラフィ、スペーシングなどの基礎値はすべてここに定義されています。
- **UI Components**: `components/ui/`
  - 汎用的なUI部品はすべてこのディレクトリに集約されています。

## Rules

- **外部UI語彙の直接導入禁止**
  - 新しいUIパターンが必要な場合は、既存のコンポーネント（`components/ui/*`）の組み合わせで実現できないか検討してください。
- **アクセシビリティの確保**
  - `text-ink-3` や `text-ink-4` などのカラーを使用する際は、背景色とのコントラスト比（WCAG AA基準）に注意してください。
- **利用文脈に合わせたUI設計**
  - 店主（PC/タブレット）と継ぎ手（スマホ）で利用文脈が異なるため、それぞれのデバイスに最適化したレイアウト（サイドナビ vs ボトムナビ）を維持してください。
