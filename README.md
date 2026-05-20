# Bug Bounty Learning Path

**from Zero to First Valid Report** — バグバウンティを体系的に学ぶ HTML 学習サイト。

🔗 **https://hiyokosauna37.github.io/bb-learning-path/**

## Overview

Web セキュリティの基礎から実際のレポート提出まで、6 Phase / 56 モジュールで段階的に学べるロードマップ。

| Phase | テーマ | モジュール数 |
|-------|--------|-------------|
| 0 | Foundation — HTTP, Browser Security, 認証, ツール | 7 |
| 1 | Core Vulnerabilities — XSS, SQLi, SSRF, IDOR 等 | 12 |
| 2 | Source Code Audit — OSS Whitebox (huntr 向け) | 10 |
| 3 | Recon & Blackbox — HackerOne / Intigriti 向け | 8 |
| 4 | Advanced — Exploit Chain, Race Condition, OAuth 等 | 9 |
| 5 | Operations — Report, CVSS, Dup 回避, 税務, Mindset | 10 |

## Features

- **56 学習モジュール** — 各脆弱性クラスの仕組み + 防御 bypass + HackerOne 実レポート解析
- **18 Quiz (90問)** — 基礎 / 中級 / 上級の理解度チェック (localStorage で進捗管理)
- **30-Day Timeline** — 1日1-2時間で30日後に最初のレポートを書けるスケジュール
- **Visual Reference** — Mermaid.js による攻撃フロー図、判断ツリー、ワークフロー図解
- **進捗トラッキング** — モジュール完了 + Quiz スコアを localStorage で別枠管理
- **オフライン対応** — Pure HTML/CSS/JS、ビルド不要 (Mermaid のみ CDN)

## Tech Stack

- HTML / CSS / JavaScript (vanilla, no framework)
- [Mermaid.js](https://mermaid.js.org/) — ダイアグラム描画 (CDN)
- GitHub Pages — ホスティング
- localStorage — 進捗管理 (サーバー不要)

## Content Sources

- [PortSwigger Web Security Academy](https://portswigger.net/web-security) — Lab リンク
- [HackerOne Hacktivity](https://hackerone.com/hacktivity) — 実レポートデータ
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/) — テスト手法
- 実際の BB 調査経験に基づく Lessons Learned

## Getting Started

1. [サイトを開く](https://hiyokosauna37.github.io/bb-learning-path/)
2. 「30-Day Timeline」で学習計画を確認
3. Phase 0 Module 00 (HTTP Protocol) から順番に進める
4. 各モジュールの WSA Lab を最低1つクリアしてから次へ
5. Phase ごとに Quiz で理解度チェック

## Local Development

```bash
git clone https://github.com/HiyokoSauna37/bb-learning-path.git
cd bb-learning-path
# 任意のローカルサーバーで開く
python -m http.server 8080
# → http://localhost:8080
```

## License

Educational content. Feel free to learn from it.
