# 📱 Sands of Time — Pixelホームにインストールする手順

## 必要なもの（すべて無料）
- Google Pixel（Chrome）
- GitHubアカウント → https://github.com
- Vercelアカウント → https://vercel.com（GitHubでログイン可）

---

## STEP 1 — GitHubにリポジトリを作る

1. Pixelの**Chrome**で https://github.com を開く
2. 右上「＋」→「New repository」
3. Repository name: `egypt-app`
4. Private でも Public でもOK
5. 「Create repository」をタップ

---

## STEP 2 — ファイルをアップロードする

GitHubのリポジトリページで：

1. 「uploading an existing file」をタップ
2. 以下のファイルを**順番に**アップロード：
   ```
   index.html
   App.js
   manifest.json
   sw.js
   ```
3. 「Commit changes」をタップ

### アイコンのアップロード（重要）
1. 「Add file」→「Create new file」
2. ファイル名を `icons/icon-192.png` と入力
   （`icons/` と打つと自動でフォルダが作られる）
3. アイコン画像をドラッグするか、
   **`generate-icons.html` をChromeで開いてダウンロード**したPNGを使う

必要なアイコンサイズ：
```
icons/icon-72.png
icons/icon-96.png
icons/icon-128.png
icons/icon-144.png
icons/icon-152.png
icons/icon-192.png   ← 最重要
icons/icon-384.png
icons/icon-512.png
```

> **簡易版**: icon-192.png と icon-512.png の2つだけでもインストール可能

---

## STEP 3 — Vercelにデプロイする

1. https://vercel.com を開く
2. 「Continue with GitHub」でログイン
3. 「Add New Project」→「Import」で `egypt-app` を選択
4. 設定はすべてデフォルトのまま「Deploy」
5. 1〜2分で `https://egypt-app-xxx.vercel.app` のURLが生成される

---

## STEP 4 — PixelのホームにPWAとしてインストール

1. VercelのURL（`https://egypt-app-xxx.vercel.app`）をChromeで開く
2. アドレスバー右端の「⋮（縦3点）」をタップ
3. **「ホーム画面に追加」** をタップ
4. アプリ名が「エジプト」になっていることを確認
5. 「追加」をタップ

ホーム画面にピラミッドアイコンが現れれば完了！

---

## STEP 5 — API Keyの設定（クイズ機能を使う場合）

クイズ機能はAnthropic APIを使います。
Claude.aiから使う場合はAPIキーが自動処理されます。
**デプロイしたアプリからはAPIキーが必要**です。

### 方法A: Vercelの環境変数（推奨）
1. Vercelのプロジェクト設定 → 「Environment Variables」
2. `VITE_ANTHROPIC_API_KEY` を追加
3. ただし**フロントエンドからAPIキーを直接使うのはセキュリティリスクあり**

### 方法B: 安全な方法（Vercel Edge Functions）
`api/quiz.js` というVercel Functions ファイルを追加することで
APIキーをサーバーサイドに隠せます。
→ 必要であればこのファイルも生成します。

---

## トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| ホーム画面に追加が出ない | manifest.jsonのエラー | Chromeの「⋮」→「デスクトップに追加」を試す |
| アイコンが表示されない | iconsフォルダのパス間違い | manifest.jsonのパスを確認 |
| クイズが失敗する | APIキー未設定 | 方法AまたはBでキーを設定 |
| オフラインで動かない | SW未登録 | Chromeで一度オンラインでアクセスしてから試す |

---

## ファイル構成

```
egypt-app/
├── index.html          ← PWAエントリポイント
├── App.js              ← アプリ本体（React）
├── manifest.json       ← PWA設定
├── sw.js               ← Service Worker（オフライン対応）
├── generate-icons.html ← アイコン生成ツール
└── icons/
    ├── icon-192.png
    └── icon-512.png
```
