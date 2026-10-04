# Phase 18: PWA・モバイル実装と試験記録

確認日: 2026-10-04、仕上げ: 2026-10-05。対象: `Kou-no1/math-planet`。

## 作業範囲と保護したもの

- 実装指示書 `KEISAN_NO_HOSHI_PWA_CODEX_HANDOFF.md` に沿って実装した。レビューだけで終了していない。
- 作業開始時は `codex/kukucchi-mvp` の `ce1174e`（Phase 17）、未コミット変更なし、origin同ブランチと一致。新しいローカルブランチ `codex/keisan-no-hoshi-pwa` で作業した。
- 公開URL `https://manabitane.jp/math-planet/`、base `/math-planet/`、HashRouter、既存の導入・学習・報酬・着せ替えを維持した。
- 公開版は読取り確認だけ行った。確認時の `/math-planet/sw.js` は404。push、本番デプロイ、DNS/CNAME/ドメイン変更は行っていない。
- 試験データは隔離した架空セーブ。利用者の実ブラウザプロファイル・実記録を読取り／書換えしていない。
- 通知、会員登録、クラウド同期、広告、解析、児童データの外部送信、課金サービスは追加していない。

## 実装と設計判断

| 対象 | 変更 |
|---|---|
| `src/pwa/config.ts`、`vite.config.ts`、`index.html` | baseを共有。日本語名、manifest、限定scope、手動更新型generateSW、キャッシュ監査JSON |
| `public/icons/` | オリジナルのくくっち号SVG、192/512 PNG、中央安全領域を持つmaskable512、Apple180 |
| `src/pwa/client.ts`、`public/pwa-coordination.js` | 一か所の登録、実際の追加イベント、準備済みキャッシュ確認、別タブ確認、明示更新 |
| `src/pwa/PwaPanel.tsx`、`preferences.ts`、ホーム・設定 | 任意の追加案内、7日抑制、端末別手順、手動ヘルプ、更新延期 |
| `saveRepository.ts`、`useSaveData.tsx`、`saveData.ts` | 読取り失敗／壊れたJSON／将来版の無断上書き防止、最新メモリ保存、復元前検証・原文バックアップ |
| `BackupPanel.tsx`、`SaveProtectionNotice.tsx` | 先生コード不要のバックアップ・復元、保存失敗時の警告、コピー／ファイル保存失敗の代替 |
| `RouteErrorBoundary.tsx`、アプリ入口 | 遅延チャンク取得失敗時も記録を書き出せる。利用者が保存してホームへ再開するまで強制reloadしない |
| `dailyUsageRepository.ts`、`nameCooldown.ts` | localStorage取得・読取り拒否でも白画面にせず、メモリ上で既存処理を継続 |
| `src/styles/pwa.css` | safe-area、dvhとフォールバック、入力文字16px、主要タップ44px、狭い／低い画面の選択画面を縦スクロール可能に |
| `scripts/verify-pwa.mjs`、`generate-pwa-icons.mjs` | production配信による再現可能なPWA試験、SVGからPNGを生成する補助 |

### 追加案内

初回導入・解答・採点・結果演出に追加ダイアログを自動表示しない。練習完了後にホームへ戻ったときだけ小さな案内を出す。「今はしない」は案内専用キーで7日間抑制し、保存拒否時はそのセッションで抑制する。手動ヘルプはいつでも利用できる。

`beforeinstallprompt` を受信した場合だけネイティブ追加操作を提供し、一度使ったイベントは拒否・失敗でも破棄する。イベント未受信を追加済みとは見なさない。`appinstalled` と現在のstandalone表示状態は別に管理する。[MDNの追加イベント仕様](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event)

iPhone/iPadはSafariの「共有 → ホーム画面に追加 → 追加」を案内し、表示される場合の「ウェブアプリとして開く」も説明する。共有の位置を固定して説明しない。[Appleの手順](https://support.apple.com/ja-jp/guide/iphone/iphea86e5236/ios)

SNS内／不明な環境は利用者情報・hash・queryを含めない開始URLをコピーし、通常ブラウザへの手動貼付けを案内する。クリップボード拒否時は選択可能なURLを表示する。通常リンクだけで外部ブラウザへ移動できるとは表示しない。

### 更新の安全条件

`generateSW`・prompt方式を採用。React用仮想登録フックは使わず、`main.tsx` からネイティブAPIのsingletonを起動する。StrictModeによる二重登録やWorkboxの自動reloadを避け、独自の保存・別タブ判定を一か所に集めた。React/Viteの更新や互換性無視のインストールはしていない。[Vite PWAのReact案内](https://vite-pwa-org.netlify.app/frameworks/react.html)、[prompt更新方式](https://vite-pwa-org.netlify.app/guide/prompt-for-update.html)

- 更新操作はホームだけ。設定では案内を表示し、ホームに戻ってから更新する。導入中・ゲーム中・結果中・保存エラー・モーダル／入力操作中は更新しない。
- 利用者のクリック後、同じアプリscope内の他ウィンドウを確認し、最新メモリデータの保存成功を確認する。
- 相手の活動を推測せず、同一アプリの別タブが一つでもあると止める。返答不明も止め、すべて閉じて次に開く自然更新を案内する。
- 待機SWがactivation直前にもう一度別タブを確認する。`skipWaiting` はこの明示操作だけ。`clientsClaim`、無条件controllerchange reloadは使わない。
- 起動元だけを再読込みし、他アプリのウィンドウ・SW・キャッシュには干渉しない。新しくタブを開く操作との完全なトランザクションを保証するものではない。
- 古いタブの未読込みチャンクを旧キャッシュから開ける。取得できない場合はバックアップ付きの復旧画面へ進める。

### 保存キー・バックアップ

SaveDataは **v15据え置き**。PWA用の学習データ移行や保存形式の全面変更はない。

| キー | 扱い |
|---|---|
| `kukucchi-save-v1` | 既存主キーを維持 |
| `kukucchi-save-before-migration` | 既存移行前原文バックアップを維持 |
| `kukucchi-save-before-restore` | 明示復元直前の原文を退避する補助キーを追加 |
| `keisan-no-hoshi-pwa-install-v1` | 追加案内だけの設定。SaveDataには含めない |

読取り例外、壊れたJSON、将来バージョンは初期値で無断上書きしない。読取り可能な原文とメモリ上の現状を別に書き出せる。読取り拒否時は原文を取得できない旨を区別し、サイトデータ削除を勧めない。

JSON復元は構造・版を検証してから確認し、バックアップと書込みが成功してからメモリを置き換える。復元失敗時は元データを保持する。別タブの新しい保存値を検知した古いタブからの上書きも止める。ただしlocalStorageの読取り・書込み全体を複数プロセス間の原子的処理に変えたわけではない。

保存領域はオリジン・利用環境に依存する。同じオリジンの単なるパス変更だけで必ず保存領域が別になるとは説明しない。Safari・ホーム画面版・SNS内・Chrome間の自動共有も保証しない。プライベート利用、利用者の削除、ブラウザ／OSの容量管理による消失は防ぎ切れない。[MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)、[保存容量と削除条件](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)

## 依存とコマンド結果

Node v24.14.1、Vite v8.0.16、React v19.2.6。PWA追加依存は `vite-plugin-pwa` **2.0.0**、`workbox-build` **7.4.1**。`workbox-window` 7.4.1は推移依存で、登録には使用しない。peer整合を確認し、`--force` / `--legacy-peer-deps` は使っていない。

CA検証が必要な環境では `NODE_OPTIONS=--use-system-ca` を使用した。TLS検証は無効化していない。npm解決に伴い、既存のBabel関連、Browserslist・caniuse等10個のビルド用推移依存も更新された。React/Viteのメジャー更新や無関係の強制audit修正は行っていない。

| コマンド | 開始前 | 最終結果 |
|---|---|---|
| `npm run lint` | 成功 | 成功、exit 0 |
| `npm run test` | 175テスト成功 | **198テスト／7ファイル成功**、exit 0 |
| `npm run build` | 成功 | 成功、155 modules、manifest・SW・32事前キャッシュ項目を生成、exit 0 |
| `npm audit --omit=dev` | 未記録 | **0件** |
| `npm audit` | 未記録 | **開発依存に11件（moderate 2 / high 9）**。未解消 |

全依存auditの残件はVitest/mocker、brace-expansion、gh-pages由来のglobby/fast-glob/micromatch/braces、nanoid、postcss、undici等の開発ツール経路。すべて既存だったとは断定していない。production依存0件はSWを含む全生成コードの無欠陥保証ではない。開発環境・公開工程の依存更新は互換性を確認して別途対応が必要。今回は `gh-pages` を実行していない。

## production build自動試験

隔離したheadless Edge **154.0.4258.53**、Playwrightを使用。Vite devではなく静的production生成物をlocalhostで配信した。実ブラウザのユーザープロファイルには接続していない。

試験用URL: `http://127.0.0.1:64693/math-planet/`（試験終了後に停止）。build A: `phase-18-pwa`、更新用build B: `phase-18-qa-B`。最後に通常の `npm run build` を実行して、`dist` をbuild Aに戻した。

仕上げ時の確認用production preview: `http://127.0.0.1:5188/math-planet/`。アプリ・manifest・SW・PNG4種の200応答とMIMEを再確認した。localhostの別オリジンなので、本番記録を自動引継ぎしない。試験する場合は架空データを使うこと。本番には公開していない。

試験原本・56枚のスクリーンショット・2版の生成物:

`C:\Users\shudi\AppData\Local\Temp\keisan-pwa-qa-18-final\report.json`

一時保存先なのでGitには含めない。恒久的な試験仕様は `scripts/verify-pwa.mjs` に含めた。

| 項目 | 実際の確認結果 |
|---|---|
| manifest・scope・アイコン | 日本語名、id/start_url/scope `/math-planet/`、standalone、PNG192/512/180、全参照200。scope外を制御しない |
| 追加状態・イベント | 単体/UI試験で実イベント受信時のみ有効、一回使用、未受信fallback、standalone抑制、installedとstandaloneの区別を確認。実際のOS追加ダイアログは未確認 |
| 小さな追加案内 | 初回は非表示。練習→結果→ホーム後の表示、閉じてreload後の抑制、7日判定、保存拒否時のセッション抑制を確認 |
| 基本オフライン | 準備後にネット切断しcold reload→ホーム→lazyな九九練習→5問正解→結果・コイン/EXP保存を完了 |
| 更新待機 | プレイ／結果でbuild Bが待機し、解答を中断しない。古い未読込の図鑑をサーバー切替後にオフラインで開けた |
| 更新と保存エラー | quota失敗時はreloadを止め、メモリを保持。保存再試行後に明示更新できた |
| 別タブ・他アプリ | 同一アプリの活動中タブが更新を止める。閉じてから保存・明示更新すると架空セーブを保持。他アプリSW・キャッシュを維持 |
| 読取り・保存拒否 | localStorage getter/getItem拒否、setItem quota、壊れたJSON、将来版で白画面にせず原文を変更しない。メモリのJSONを書き出せた |
| 復元 | 不正JSONは確認ダイアログ前に拒否。正常JSONは確認後に復元し、直前原文を正確にバックアップ |
| 書出し失敗 | clipboard拒否・ダウンロードを利用できない場合も、選択可能なJSONと操作案内へ進めた |
| lazy取得失敗 | Learnチャンク取得を拒否しても復旧画面・バックアップを表示。明示的な保存後のホーム再開を確認 |
| モバイル | 下表6サイズで横あふれ・主要ボタン44px・回答hit test・customカード内の文字収まりを確認。閉じる／Escapeとフォーカス復帰も確認 |
| プライバシー | 試験中の外部リクエスト・ブラウザ未捕捉エラーなし。データ送信／通知機構を追加していない |

### 表示試験

全サイズでホーム、追加ヘルプ、たしざん準備、4択、整数テンキー、カスタム、図鑑、設定を確認した。

| portrait / desktop | 高さ縮小シミュレーション | landscapeシミュレーション | 結果 |
|---|---|---|---|
| 320×568 | 320×320 | 568×320 | 合格 |
| 360×740 | 360×460 | 740×360 | 合格 |
| 390×844 | 390×564 | 844×390 | 合格 |
| 430×932 | 430×652 | 932×430 | 合格 |
| 768×1024 | 対象外 | 対象外 | 合格 |
| 1366×768 | 対象外 | 対象外 | 合格 |

320pxの準備画面は内容を隠さず縦スクロールし、6エリア・こたえかた・スタートを表示できる。既存の大きなカスタムカードを縮めず、小さい操作だけ44px以上にした。OSキーボードを開かない自前整数テンキーを維持。safe-area・dvh・ズーム許可を実装したが、ブラウザの高さ変更は実際のOSキーボード／ノッチ試験の代わりではない。

## キャッシュ一覧と容量

最終build `phase-18-pwa` の `dist/pwa-cache-report.json` から記録。以下はすべて `/math-planet/` 配下。**32項目、838,568 bytes（約818.91 KiB）**。SW関連2ファイル **25,082 bytes** を加えた静的配信量は **863,650 bytes（約843.41 KiB）**。非圧縮ファイルサイズで、HTTP圧縮量・キャッシュ管理メタデータ量ではない。

Workboxのコンソール表示741.78 KiBは追加icon資産の容量を含まないため、採用値は実ファイルのstatを使った監査JSON。容量上限を引き上げて警告を抑制していない。[Vite PWAの静的資産処理](https://vite-pwa-org.netlify.app/guide/static-assets.html)

| ファイル（共通prefix省略） | bytes |
|---|---:|
| index.html | 931 |
| assets/UfoBadge-DRchtM1x.js | 660 |
| assets/TreasureIcon-C7W-ZweI.js | 3,581 |
| assets/SpeedPage-CSbXEQil.js | 8,936 |
| assets/ShopPage-CK7CeGU4.js | 3,926 |
| assets/shopItems-xFdFLbyn.js | 152,964 |
| assets/rocketBadges-vxWQ9vUK.js | 1,235 |
| assets/ReviewPage-BaOeCDY6.js | 5,591 |
| assets/ResultPage-bckCoThg.js | 11,517 |
| assets/numeric-BT3IFzOW.js | 3,978 |
| assets/MonsterBookPage-C3umzyXC.js | 25,462 |
| assets/ModeStartScreen-BOvA8D6S.js | 1,218 |
| assets/MiniGamePage-C4QFPKWm.js | 17,529 |
| assets/LearnPage-DxloowDC.js | 15,620 |
| assets/index-C5mDsGj5.js | 308,357 |
| assets/id-Dcn_oeqJ.js | 14,669 |
| assets/DailyBudgetNoticeModal-DwpQGy3-.js | 904 |
| assets/CustomPage-CnSvwZjr.js | 12,098 |
| assets/CalculationHint-vZSJZlMD.js | 4,816 |
| assets/BossBattlePage-CIPyK9PI.js | 11,971 |
| assets/advancedPixelSprites-BaoS3WWJ.js | 3,285 |
| assets/AdvancedPage-KoIHChFe.js | 4,926 |
| assets/AdvancedBossSprite-DNLr3uvN.js | 1,062 |
| assets/index-CDkg2Pl3.css | 144,351 |
| icons.svg | 5,031 |
| icons/app-icon.svg | 1,308 |
| icons/pwa-maskable-512.png | 23,406 |
| icons/pwa-512.png | 26,770 |
| icons/pwa-192.png | 10,361 |
| icons/apple-touch-icon-180.png | 9,727 |
| pwa-coordination.js | 1,880 |
| manifest.webmanifest | 498 |

SW関連（上記32項目外）: `sw.js` 3,244 bytes、`workbox-634c55b2.js` 21,838 bytes。

現在のSVG教材・着せ替えは主にコード内で生成され、JS/CSS依存グラフ全体も1 MiB未満。遅延チャンクを含めることで旧版未読込み画面も保護する。全画像・動画・外部フォントを無差別取得していない。実行時画像キャッシュは同一オリジンかつ登録scope内だけ、40件・7日。`/guide/`・別アプリ・外部サイトは対象外。自アプリprecacheの古いentryだけをactivation時に整理し、他キャッシュの一括削除はしない。

オフライン保証の確認済み範囲は **準備後の起動・ホーム・基本の九九練習・採点・結果保存**。初回未準備、キャッシュ削除後、全ゲーム／全星の完全なオフライン網羅、全音声・読み上げは保証していない。準備表示はnavigator.onLineだけでなく実キャッシュの主要資産を確認する。Manifestの表示scopeとSW制御scopeは別設定として同じbaseに制限した。[MDN manifest scope](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/scope)

## 実機未確認項目

以下は **すべて未実施**。headless Edgeの表示試験やイベントmockを実機合格として扱わない。

| 実機環境 | 配信URL・build | 端末／OS／アプリ版 | 残る確認 |
|---|---|---|---|
| iPhone Safari → ホーム画面 | 未配信 | 未記録 | 共有手順、名前の省略、mask、単独起動、保存領域、翌日再開 |
| iPhone SNS内ブラウザ | 未配信 | 未記録 | 無料学習、URLコピー、外部ブラウザへの手動移動、JSONひきつぎ |
| Android Chrome → ホーム画面 | 未配信 | 未記録 | 実際の追加dialog／メニュー、単独起動、翌日再開、通信切断、更新延期 |
| Android SNS内ブラウザ | 未配信 | 未記録 | その場の学習、コピー拒否fallback、通常ブラウザへの移動 |
| iPad／Androidタブレット | 未配信 | 未記録 | 端末回転、safe-area、キーボード、学習・設定・復元 |
| PCの通常ウィンドウ／追加アプリ | 未配信 | 未記録 | 実追加、複数ウィンドウ、実ファイル保存・復元、音声 |

各実機試験で端末名、OS、ブラウザ・SNSアプリ版、HTTPS配信URL、build識別子、既存セーブと翌日再開結果を記録する必要がある。LANの通常HTTPは安全なSW試験条件ではないため、それだけで未対応と判定しない。

## 保護者向け案内と公開前チェック

案内文: **「追加しなくても遊べます。記録は、この端末・この開き方で使う保存領域に入ります。別の端末やブラウザへ自動では移りません。大切な記録は『せってい → データをほぞんする』でJSONの控えを残してください。」**

Safariは共有から追加、対応Android/PCは追加ボタンまたはメニュー。SNSから移動する場合は開始URLをコピーし、記録をJSONで保存して移動先の「データをひきつぐ」を使う。保存に失敗した場合はJSONテキストを選択／コピーできる。削除・機種変更・ブラウザ変更前に控えを残す。クラウド同期や保存永久保証はない。

本番公開はこの作業では行わない。別途明示承認を得た公開前に次を確認する。

1. 開発依存auditの残件を確認し、互換性を守って必要な更新を行う。
2. 本番相当HTTPSでmanifest・SW・iconsの200、MIME、scope、更新可能なSW/HTMLのHTTPキャッシュ設定を確認する。
3. 上記実機表、ノッチ／ブラウザバー／OSキーボード／音声／ズームを実測する。
4. 導入前の架空v15セーブを用意し、導入後・オフライン・更新・JSON移動・翌日起動の進捗を比較する。利用者実記録の無断移行はしない。
5. 同じドメインの別アプリSW・キャッシュ、複数タブ学習、キャッシュ削除時の案内が影響を受けないことを再確認する。
6. 公開URL・保存キー・manifest IDを維持し、本番公開は別の作業として実施する。
