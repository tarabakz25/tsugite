# TSUGITE 現状要件定義書

作成日: 2026-05-06

この文書は、現時点のコード、DB migration、README、機能モジュールから逆算した要件定義です。将来構想ではなく、現在の実装に存在する仕様を中心に整理します。

## 1. プロダクト概要

TSUGITE は、伝統工芸、旅館、老舗飲食などで言語化されにくい「暗黙知」を、次世代の継ぎ手へ渡すための Web プラットフォームである。

中核価値は次の 3 機能で構成される。

- Archive: 先代・店主へのインタビュー動画または音声を保存し、文字起こし、暗黙知タグ抽出、Embedding 化を行う。
- Guide: 現場のカメラ画像を正解状態と比較し、後継者へテキストと音声でフィードバックする。
- Agent: Archive で蓄積した暗黙知を出典として、先代の判断に相談できるチャットを提供する。

加えて、公開マーケティングページ、募集一覧、店・継ぎ手別のオンボーディングとダッシュボードが存在する。ただし、募集・応募管理の多くは現状モックである。

## 2. ステータス凡例

- 実装済み: 画面、DB、API、または Server Action がつながっている。
- 部分実装: 主要 UI または API はあるが、認可、永続化、実運用導線の一部が未完成。
- モック: 固定データまたは見せるための UI で、サーバー永続化や業務処理はない。
- 未実装: コード上、明示的に将来対応またはプレースホルダー扱い。

## 3. 利用者と権限

| 利用者         | 目的                                           | 主な導線                              | 現状                               |
| -------------- | ---------------------------------------------- | ------------------------------------- | ---------------------------------- |
| 匿名訪問者     | サービス理解、募集閲覧、ログイン開始           | `/`, `/opportunities`, `/login`       | 実装済み                           |
| 店・掲載者     | プロフィール登録、募集管理、Archive/Guide 利用 | `/shop/*`, `/register/shop`           | 部分実装                           |
| 継ぎ手         | 募集閲覧、応募履歴確認、Agent 相談             | `/successor/*`, `/register/successor` | 部分実装                           |
| MVP デモ利用者 | 3機能の体験確認                                | `/app/*`                              | 部分実装、未ログイン時はデモデータ |

## 4. 対象スコープ

### 4.1 現在の対象

- Supabase Auth による Google OAuth ログイン。
- 店または継ぎ手のロール選択。
- 店プロフィール、継ぎ手プロフィールの保存。
- 公開ランディング、募集一覧、募集詳細の表示。
- 店向けダッシュボード、募集管理、応募一覧の UI。
- 継ぎ手向けホーム、プロフィール、応募履歴、Agent 画面。
- Archive の動画・MP3アップロード、文字起こし、暗黙知抽出、Embedding 作成。
- Guide の正解シーン登録、カメラ撮影、Vision 分析、正解状態との差分比較、音声フィードバック、観察ログ保存。
- Agent の RAG チャット API、TTS API、チャット UI。
- `/app/*` 配下の MVP 体験導線。

### 4.2 現在の対象外・未完成

- 募集の実DB保存、検索、応募、選考、メッセージング。
- 継ぎ手と店の正式な紐付けモデル。
- 店メンバー招待の実処理。
- 会話履歴の永続化。
- Guide の Archive タグ由来の正解シーン一括生成や編集レビュー導線。
- 管理者機能、課金、通知、監査ログ。
- 本番プライバシー保証、オンデバイス推論、音声クローン。

## 5. 機能要件

### 5.1 認証・オンボーディング

| ID      | 要件                                                                                                                                                             | 現状     |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| AUTH-01 | ユーザーは Google OAuth でログインできる。                                                                                                                       | 実装済み |
| AUTH-02 | OAuth callback は `next` / `returnTo` の相対パスのみ許可し、オープンリダイレクトを防ぐ。                                                                         | 実装済み |
| AUTH-03 | ログイン後、ロールが `shop` なら `/shop`、`successor` なら `/successor`、未設定なら `/onboarding/role` へ遷移する。                                              | 実装済み |
| AUTH-04 | `/shop`, `/successor`, `/register`, `/onboarding` 配下は未ログイン時に `/login?returnTo=...` へリダイレクトする。                                                | 実装済み |
| AUTH-05 | 店用 layout は `shop` 以外を `/successor` または `/onboarding/role` へ逃がす。継ぎ手用 layout は `successor` 以外を `/shop` または `/onboarding/role` へ逃がす。 | 実装済み |
| AUTH-06 | `/sign-in/*` と `/sign-up/*` は `/login` へリダイレクトする。                                                                                                    | 実装済み |
| AUTH-07 | `/app/*` は proxy の保護対象ではなく、未ログイン時はデモデータで表示できる。                                                                                     | 実装済み |

### 5.2 プロフィール

| ID      | 要件                                                                                                         | 現状     |
| ------- | ------------------------------------------------------------------------------------------------------------ | -------- |
| PROF-01 | Supabase Auth ユーザー作成時に `profiles` 行を自動作成する。                                                 | 実装済み |
| PROF-02 | ユーザーは `shop` または `successor` のロールを1つ選択する。                                                 | 実装済み |
| PROF-03 | 店プロフィールは表示名、地域を必須とし、紹介文を任意で保存する。紹介文は 2000 文字以内。                     | 実装済み |
| PROF-04 | 店プロフィール保存時、`shops` 行が存在しなければ作成する。                                                   | 実装済み |
| PROF-05 | 継ぎ手プロフィールは表示名を必須、興味分野と自己紹介を任意で保存する。興味分野と自己紹介は各 2000 文字以内。 | 実装済み |
| PROF-06 | 店・継ぎ手プロフィールは各ダッシュボードから再編集できる。                                                   | 実装済み |

### 5.3 公開ページ・募集閲覧

| ID     | 要件                                                                           | 現状     |
| ------ | ------------------------------------------------------------------------------ | -------- |
| PUB-01 | ランディングページは Archive、Guide、Agent の価値を説明し、`/app` へ誘導する。 | 実装済み |
| PUB-02 | 募集一覧は固定モックの募集を表示する。                                         | モック   |
| PUB-03 | 募集詳細は固定モックの内容、地域、掲載日、処遇メモを表示する。                 | モック   |
| PUB-04 | 募集詳細の応募CTAは `/login` へ誘導するが、応募処理自体は開発中である。        | 部分実装 |
| PUB-05 | 利用規約、プライバシー、お問い合わせページを表示する。                         | 実装済み |

### 5.4 店向けダッシュボード

| ID      | 要件                                                                             | 現状     |
| ------- | -------------------------------------------------------------------------------- | -------- |
| SHOP-01 | 店ユーザーは店ダッシュボードで掲載数、応募数、未読メッセージの指標を見る。       | モック   |
| SHOP-02 | 店ユーザーは募集一覧を確認できる。                                               | モック   |
| SHOP-03 | 店ユーザーは新規募集作成画面、募集編集画面を開ける。保存処理は無効化されている。 | モック   |
| SHOP-04 | 店ユーザーは応募一覧を確認できる。                                               | モック   |
| SHOP-05 | 店ユーザーは Archive と Guide へサイドナビから移動できる。                       | 実装済み |

### 5.5 継ぎ手向けダッシュボード

| ID     | 要件                                                                      | 現状     |
| ------ | ------------------------------------------------------------------------- | -------- |
| SUC-01 | 継ぎ手ユーザーは注目募集と応募状況を見る。                                | モック   |
| SUC-02 | 継ぎ手ユーザーは応募履歴を確認できる。                                    | モック   |
| SUC-03 | 継ぎ手ユーザーは `/successor/agent` で先代女将AIに相談できる。            | 部分実装 |
| SUC-04 | 継ぎ手と店の関係は未実装のため、`/successor/agent` は固定 shopId を使う。 | 部分実装 |

### 5.6 MVP アプリ導線 `/app`

| ID     | 要件                                                                     | 現状     |
| ------ | ------------------------------------------------------------------------ | -------- |
| APP-01 | `/app` は Archive、Guide、Agent の3ステップと主要指標を表示する。        | 実装済み |
| APP-02 | ログイン済みで `shops` 行が作れる場合は Supabase の実データを表示する。  | 実装済み |
| APP-03 | 未ログイン、または実データ取得不可の場合は固定デモデータを表示する。     | 実装済み |
| APP-04 | `/app/settings/*` は店舗情報、メンバー、アカウントの静的表示を提供する。 | モック   |

### 5.7 Archive

| ID     | 要件                                                                                                               | 現状     |
| ------ | ------------------------------------------------------------------------------------------------------------------ | -------- |
| ARC-01 | 店ユーザーは動画または MP3 音声をアップロードできる。対応形式は `video/*`, MP3, `.mp3`、最大 100MB。               | 実装済み |
| ARC-02 | アップロードファイルは Supabase Storage の private bucket `interview-videos` に保存する。                          | 実装済み |
| ARC-03 | ファイル本体はブラウザから署名付きアップロードURLへ直接送信し、Server Action は署名URL発行と完了登録のみ行う。     | 実装済み |
| ARC-04 | 保存パスは `{shopId}/{interviewId}.{ext}` とし、完了登録時に UUID、shopId、拡張子、Storage object 存在を検証する。 | 実装済み |
| ARC-05 | アップロード完了後、`interviews` に `shop_id` と `storage_path` を保存する。                                       | 実装済み |
| ARC-06 | 店ユーザーはインタビュー一覧と暗黙知タグ一覧を確認できる。                                                         | 実装済み |
| ARC-07 | 未文字起こしのインタビューに対して、文字起こし、暗黙知抽出、Embedding 作成を手動実行できる。                       | 実装済み |
| ARC-08 | 文字起こしは Supabase Storage から media を取得し、OpenAI Whisper `whisper-1`、日本語指定で実行する。              | 実装済み |
| ARC-09 | 暗黙知抽出は transcript から `状況`、`判断`、`理由` の3層タグを JSON で抽出し、`tacit_tags` に保存する。           | 実装済み |
| ARC-10 | Embedding は `text-embedding-3-small` で作成し、`tag_embeddings` に保存する。                                      | 実装済み |
| ARC-11 | `/app/archive/[id]` は Storage の署名付きURLを生成し、動画または MP3 を再生できる。                                | 実装済み |
| ARC-12 | インタビュー削除、タグ編集、処理キュー、処理失敗時の詳細リトライ管理はない。                                       | 未実装   |

### 5.8 Guide

| ID     | 要件                                                                                                                                                   | 現状     |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| GDE-01 | 店ユーザーは登録済み reference scene を選択して Guide を開始できる。                                                                                   | 実装済み |
| GDE-02 | reference scene は `scene_name`, `correct_state`, `season` を持つ。                                                                                    | 実装済み |
| GDE-03 | カメラは `navigator.mediaDevices.getUserMedia` を使い、可能なら背面カメラ、1280x720 を優先する。                                                       | 実装済み |
| GDE-04 | Guide 開始中は 2 秒間隔で video frame を JPEG data URL として取得する。                                                                                | 実装済み |
| GDE-05 | `/api/guide/analyze` は画像と `sceneId` を受け取り、サーバー側で `reference_scenes.correct_state` を取得し、OpenAI `gpt-4o` で見える物品を抽出する。   | 実装済み |
| GDE-06 | 正解状態との差分比較は、`correct_state` の有効値を期待項目として、文字列包含で `missing` / `extra` / `status` を算出する。                             | 実装済み |
| GDE-07 | 差分をもとに GPT-4o が先代の口調で 2-3 文のフィードバックを生成する。                                                                                  | 実装済み |
| GDE-08 | `/api/guide/tts` は OpenAI TTS `tts-1`、voice `nova` で音声を生成し、base64 MP3 を返す。                                                               | 実装済み |
| GDE-09 | Guide の結果は `observation_logs` に `shop_id`, `scene_id`, `vision_result`, `llm_feedback` として保存する。                                           | 実装済み |
| GDE-10 | 観察ログ履歴専用画面は未実装。ログ自体は `observation_logs` に保存する。                                                                               | 未実装   |
| GDE-11 | `/shop/guide/scenes/new` は暫定の JSON 入力ルートとして残す。通常導線では Archive の `tacit_tags` から生成する。                                       | 実装済み |
| GDE-12 | Archive の `tacit_tags` から OpenAI `gpt-4o` で `reference_scenes` を自動生成し、`source_tag_id` で元タグに紐づける。                                  | 実装済み |
| GDE-13 | `/shop/guide/scenes` で登録済み Guide シーンを一覧し、不要な `reference_scenes` を削除できる。削除時、過去ログの `scene_id` は DB 制約で null になる。 | 実装済み |
| GDE-14 | 画像はクラウド Vision API に送信されるため、画面上でデモモードかつプライバシー保証なしと表示する。                                                     | 実装済み |

### 5.9 Agent

| ID     | 要件                                                                                                                              | 現状     |
| ------ | --------------------------------------------------------------------------------------------------------------------------------- | -------- |
| AGT-01 | `/api/agent/chat` は AI SDK の UI messages と `shopId` を受け取り、最新ユーザー発話を処理する。                                   | 実装済み |
| AGT-02 | Agent はユーザー質問を `text-embedding-3-small` で Embedding 化する。                                                             | 実装済み |
| AGT-03 | Supabase RPC `match_tacit_tags_for_agent` 経由で pgvector 類似検索を実行し、同一 `shopId` の類似 `tacit_tags` 上位5件を検索する。 | 実装済み |
| AGT-04 | 関連タグに紐づく transcript ありの `interviews` を最大3件取得する。                                                               | 実装済み |
| AGT-05 | 取得したタグとインタビューを根拠に、GPT-4o が先代店主の口調でストリーミング回答する。                                             | 実装済み |
| AGT-06 | API は参照タグを AI SDK の `data-citations` part としてストリームし、回答本文と同じ assistant message に紐づける。                | 実装済み |
| AGT-07 | `/api/agent/tts` は回答テキストを OpenAI TTS `tts-1`, voice `nova` で音声化する。                                                 | 実装済み |
| AGT-08 | `/successor/agent` のチャット UI はサンプル質問、送信、ストリーミング表示、回答音声再生を提供する。                               | 実装済み |
| AGT-09 | Agent UI は `data-citations` を読み取り、参照した暗黙知タグを回答ごとに表示する。                                                 | 実装済み |
| AGT-10 | `/app/agent` は RAG API ではなく、取得済みタグからローカルにデモ回答を組み立てる。                                                | モック   |
| AGT-11 | 会話履歴は永続化しない。                                                                                                          | 未実装   |
| AGT-12 | 類似検索対象の embedding が足りない場合は、同一 shop の最近の暗黙知タグを補助コンテキストとして渡す。                             | 実装済み |

## 6. データ要件

| テーブル / Storage                     | 主な役割                              | 主な列・構造                                                                    | 現状     |
| -------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------- | -------- |
| `profiles`                             | Auth ユーザーごとのアプリプロフィール | `id`, `display_name`, `avatar_url`, `role`, `shop_profile`, `successor_profile` | 実装済み |
| `shops`                                | 店アカウントの実体                    | `owner_profile_id`, `name`, `profile`                                           | 実装済み |
| `interviews`                           | Archive の素材メタデータ              | `shop_id`, `storage_path`, `transcript`, `duration_sec`                         | 実装済み |
| `tacit_tags`                           | 暗黙知の最小単位                      | `situation`, `judgment`, `reason`, `is_inferred`, `meta`                        | 実装済み |
| `tag_embeddings`                       | Agent 検索用ベクトル                  | `tag_id`, `embedding vector(1536)`                                              | 実装済み |
| `reference_scenes`                     | Guide の正解状態                      | `shop_id`, `source_tag_id`, `scene_name`, `correct_state`, `season`             | 実装済み |
| `observation_logs`                     | Guide の観察履歴                      | `shop_id`, `scene_id`, `vision_result`, `llm_feedback`                          | 実装済み |
| `storage.objects` / `interview-videos` | Archive media の保存                  | private bucket、shopId folder 配下                                              | 実装済み |

### 6.1 データ所有権

- `profiles` は本人のみ select/update できる。
- `shops` は `owner_profile_id = auth.uid()` のユーザーのみ select/insert/update できる。
- `interviews`, `tacit_tags`, `tag_embeddings`, `reference_scenes`, `observation_logs` は、所有 shop の owner のみ all 操作できる。
- Agent API は `shops.owner_profile_id = auth.uid()` または `profiles.organization_ids` に shopId が含まれるユーザーのみ RAG 参照できる（継ぎ手の正式な店舗紐づけテーブルができるまでの暫定アクセスリスト）。
- `interview-videos` bucket は、Storage object の第一階層 folder が shopId と一致し、その shop owner である場合のみ upload/read/delete できる。

### 6.2 データ依存関係

Archive で作った `interviews` と `tacit_tags` が Agent の根拠になる。`tag_embeddings` がないタグは pgvector 検索対象にならないが、Agent は最近の `tacit_tags` を補助コンテキストとして利用する。

Guide は `reference_scenes.correct_state` を正解状態として利用し、実行結果を `observation_logs` に保存する。正解シーンの通常導線は、Archive の `tacit_tags` から `reference_scenes` を自動生成する流れに統一する。Archive 由来の正解シーンは `reference_scenes.source_tag_id` で元タグに紐づく。`/shop/guide/scenes/new` は暫定の JSON 入力ルートとして残すが、通常 UI からは直接案内しない。

## 7. API 要件

| Method | Path                                   | 目的                                     | 認証・認可の現状                                                                                                          |
| ------ | -------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/health`                          | ヘルスチェック                           | 認証なし                                                                                                                  |
| POST   | `/api/archive/transcribe/:interviewId` | media を文字起こしし、transcript 保存    | Supabase user 必須、interview owner 確認あり                                                                              |
| POST   | `/api/archive/extract/:interviewId`    | transcript から暗黙知タグ抽出            | Supabase user 必須、interview owner 確認あり                                                                              |
| POST   | `/api/archive/embed/:tagId`            | tag の Embedding 作成                    | Supabase user 必須、tag owner 確認あり                                                                                    |
| POST   | `/api/guide/analyze`                   | 画像解析、正解状態との差分、LLM feedback | Supabase user 必須、`sceneId` の `reference_scenes` を RLS で所有確認                                                     |
| POST   | `/api/guide/tts`                       | Guide feedback の TTS                    | Supabase user 必須                                                                                                        |
| POST   | `/api/agent/chat`                      | RAG チャットのストリーミング回答         | Supabase user 必須、shop owner または `profiles.organization_ids` によるアクセス確認あり。DB参照は Supabase HTTP/RPC 経由 |
| POST   | `/api/agent/tts`                       | Agent 回答の TTS                         | Supabase user 必須                                                                                                        |

## 8. ルート要件

### 8.1 公開・認証

- `/`: ランディング。
- `/opportunities`: 募集一覧。
- `/opportunities/[id]`: 募集詳細。
- `/terms`, `/privacy`, `/contact`: 法務・問い合わせ。
- `/login`: Google ログイン。
- `/auth/callback`: Supabase OAuth callback。
- `/sign-in/*`, `/sign-up/*`: `/login` へリダイレクト。
- `/auth/login`: `/login?returnTo=/app` へリダイレクト。
- `/auth/signup`, `/auth/role`: デモ用の静的導線。

### 8.2 店

- `/onboarding/role`: role 選択。
- `/register/shop`: 店プロフィール登録。
- `/shop`: 店ダッシュボード。
- `/shop/profile`: 店プロフィール編集。
- `/shop/listings`: 募集一覧モック。
- `/shop/listings/new`: 新規募集 UI。
- `/shop/listings/[id]/edit`: 募集編集 UI。
- `/shop/applications`: 応募一覧モック。
- `/shop/archive`: Archive 本体。
- `/shop/guide`: Guide 本体。
- `/shop/guide/scenes`: Guide 正解シーン管理。
- `/shop/guide/scenes/new`: Guide 正解シーン作成。暫定 JSON 入力ルートで、通常導線からは非表示。

### 8.3 継ぎ手

- `/register/successor`: 継ぎ手プロフィール登録。
- `/successor`: 継ぎ手ホーム。
- `/successor/profile`: 継ぎ手プロフィール編集。
- `/successor/applications`: 応募履歴モック。
- `/successor/agent`: RAG Agent チャット。

### 8.4 MVP アプリ

- `/app`: 3機能のホーム。
- `/app/archive`, `/app/archive/upload`, `/app/archive/[id]`, `/app/archive/tags`, `/app/archive/timeline`: Archive デモ・実データ表示。
- Guide の現行ルートは `/shop/guide`、`/shop/guide/scenes`、`/shop/guide/scenes/new` に統一。`/app/guide*` は現行ルート未配置。
- `/app/agent`, `/app/agent/history`, `/app/agent/sources`: Agent デモ。
- `/app/settings/shop`, `/app/settings/members`, `/app/settings/account`: 設定の静的表示。

## 9. 非機能要件

### 9.1 技術スタック

- Next.js 16 App Router、React 19、TypeScript strict。
- Tailwind CSS v4。
- Bun をパッケージマネージャとして使う。
- Supabase Auth、Postgres、Storage、RLS。
- `/api/*` は App Router の Route Handler（`app/api/**/route.ts`）で提供する。
- Drizzle schema を DB 構造の TypeScript 定義として持つ。

### 9.2 セキュリティ

- protected prefix は `proxy.ts` で匿名アクセスを拒否する。
- role mismatch は server layout 側でリダイレクトする。
- OAuth return path は同一オリジン相対パスに制限する。
- DB と Storage は RLS で shop owner のみアクセス可能にする。
- 現状、`/app/*` と一部 AI API は API レベルの認証チェックがないため、本番化前に認可設計が必要である。

### 9.3 プライバシー

- Guide は画像をクラウド Vision API に送信する。
- 画面上ではデモモードとしてプライバシー保証がない旨を表示する。
- Archive media は private bucket に保存するが、AI 文字起こし時に OpenAI API へ送信される。

### 9.4 パフォーマンス・UX

- Archive upload は browser direct upload により Server Action body size の制約を避ける。
- Archive upload の最大ファイルサイズは 100MB。
- Guide は 2 秒間隔で画像解析する。
- Agent はストリーミングで回答を表示し、音声生成は回答後に非同期で行う。

### 9.5 必須環境変数

- `APP_ORIGIN`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `DATABASE_URL`（Drizzle migration / db:studio 用。Agent の実行時参照は Supabase HTTP/RPC 経由）
- `OPENAI_API_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`

## 10. 現状の主な未決事項

- 公開募集、店の募集管理、応募管理を実データ化するスキーマが未定。
- 継ぎ手と shop の正式な関係モデルが未定。現状 Agent は暫定的に `profiles.organization_ids` を参照する。
- `/app/*` をデモ公開のままにするか、ログイン必須にするか未定。
- Agent API の一部認証・認可境界と、Guide の Archive タグ由来シーンの編集レビュー導線が未完成。
- Agent の citation header をチャット UI へ反映していない。
- Archive のタグ編集、重複 Embedding 対策、削除、処理キューが未実装。
- マーケティングヘッダーに `/demo/ryokan` へのリンクが残っているが、現状該当ルートは存在しない。
- ハッカソン由来のデモ文脈と本番プロダクト文脈が一部混在している。
