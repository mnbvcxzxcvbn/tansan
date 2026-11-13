# シュワッと！コーラ飛ばし 🥤💨

スマホを振って炭酸をため、コーラをどこまで飛ばせるか競うブラウザゲームです。

- 遊ぶ: https://mnbvcxzxcvbn.github.io/tansan/ （GitHub Pages 有効化後）
- 操作:
  1. 5秒間スマホを全力で振る（PCはクリック連打やマウスをブンブン動かす）
  2. 角度メーターが45°付近になったらタップ
  3. 飛距離が出たら X(Twitter) でポスト、ランキングに登録

ファイル構成:

| ファイル | 内容 |
|---|---|
| `index.html` | ゲーム本体（HTML/CSS/JS 1枚） |
| `config.js` | ランキングURLやシェア用URLの設定 |
| `ogp.png` | X(Twitter) でURLを貼ったときに出るカード画像 |
| `gas/Code.gs` | ランキング用サーバー（Google Apps Script） |

## 1. GitHub Pages で公開する

1. このブランチを `main` にマージする
2. GitHub のリポジトリで **Settings → Pages**
3. **Source** を「Deploy from a branch」、Branch を `main` / `/ (root)` にして Save
4. 1〜2分で `https://mnbvcxzxcvbn.github.io/tansan/` が見られるようになります

> リポジトリが private の場合、無料プランでは Pages が使えません。public にしてください。

## 2. ランキングを有効にする（無料・Google アカウントだけでOK）

1. [Google スプレッドシート](https://sheets.new) を新規作成（名前は何でもOK）
2. メニュー **拡張機能 → Apps Script** を開く
3. 最初からある `コード.gs` の中身を全部消して、`gas/Code.gs` の中身を貼り付けて保存
4. 右上 **デプロイ → 新しいデプロイ**
   - 種類: **ウェブアプリ**
   - 次のユーザーとして実行: **自分**
   - アクセスできるユーザー: **全員**
5. 「デプロイ」→ Google の権限確認を許可（「詳細」→「安全ではないページに移動」と出ても自分のスクリプトなので OK）
6. 表示された **ウェブアプリURL**（`https://script.google.com/macros/s/.../exec`）をコピー
7. `config.js` の `rankingEndpoint` に貼り付けて commit / push

```js
window.GAME_CONFIG = {
  rankingEndpoint: "https://script.google.com/macros/s/XXXXXXXX/exec",
  ...
};
```

スコアはスプレッドシートの `scores` シートに溜まります。変なスコアや名前は行を消すだけで削除できます。

> Apps Script のコードを変更したら「デプロイを管理 → 編集 → バージョン: 新バージョン」で更新してください（URLはそのまま）。

## 3. X(Twitter) で遊んでもらう

- リザルト画面の「𝕏 で結果をポスト」で、飛距離・ハッシュタグ `#コーラ飛ばし`・URL 付きの投稿画面が開きます
- URL を貼ると `ogp.png` のカードが表示されます（[Card Validator](https://cards-dev.twitter.com/validator) は廃止されているので、実際にポストして確認してください）

## メモ・注意

- **振る操作は HTTPS が必須**です（GitHub Pages は HTTPS なのでOK）。iPhone では「はじめる」を押したときにモーションセンサーの許可ダイアログが出ます。
- X アプリ内ブラウザでセンサーが使えない場合は、タップ連打でも遊べます（振ったほうが強い）。
- ランキングはブラウザから送る簡易方式なので、本気の改ざんは防げません。サーバー側で上限（400m）・名前の長さ・連投（4秒）だけチェックしています。
- ローカルで確認: `python3 -m http.server` → `http://localhost:8000/`（スマホのセンサーは HTTPS でないと動きません）
