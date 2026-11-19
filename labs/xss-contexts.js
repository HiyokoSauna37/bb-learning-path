'use strict';

const element = id => document.getElementById(id);

function htmlText(value) {
    const escapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return value.replace(/[&<>"']/g, character => escapes[character]);
}

// A JSON string literal is placed inside the generated script element.
function scriptValue(value) {
    return JSON.stringify(value).replaceAll('<', '\\u003c');
}

const targetMarkup = '<div id="target"></div>';
const displayLabel = "document.getElementById('target').textContent = label;";
const tasks = [
    {
        id: 'document',
        title: '初期HTMLでの本文表示',
        prompt: '受け取った検索語を初期HTMLに埋め込む画面。表示が太字になることと、コードが動くことの違いを調べよう。',
        sink: '生成された文書をブラウザーが最初に解析',
        goal: '変更前でproof()を呼び、変更後の文字表示と比較する。',
        seed: '<b>京都</b>',
        example: '<script>proof()</script>',
        hint: '最初の文書として解析されるscript要素は、CSPが許す場合に実行される。',
        explanation: '変更前は入力をHTML本文へ直接埋め込む。変更後はHTML本文用にエンコードする。生成された文書はこのラボではsrcdocで再現している。実際のHTTP応答への反射は別途確認する。',
        build(value, fixed) {
            return { markup: '<div id="target">' + (fixed ? htmlText(value) : value) + '</div>' };
        }
    },
    {
        id: 'innerhtml',
        title: '同じscriptをinnerHTMLへ渡したら？',
        prompt: '初期値のscriptを送って結果を見よう。その後、別のイベントを使う入力で実行条件を比べる。',
        sink: 'innerHTML のsetter',
        goal: 'scriptが動かない理由を説明し、イベントが起きた場合も比較する。',
        seed: '<script>proof()</script>',
        example: '<img src=x onerror=proof()>',
        hint: 'innerHTMLで追加されたscript要素は通常実行されない。画像の読込が失敗するとerrorイベントが起きる。',
        explanation: '変更前はHTMLとして要素を作る。scriptの非実行だけでこの経路全体の安全性は決まらない。変更後はtextContentで文字を表示する。演習では画像の読込はCSPで制限されるため、errorイベントを観察できる。',
        build(value, fixed) {
            const property = fixed ? 'textContent' : 'innerHTML';
            return { markup: targetMarkup, script: "document.getElementById('target')." + property + ' = ' + scriptValue(value) + ';' };
        }
    },
    {
        id: 'attribute',
        title: '引用符で囲まれた属性',
        prompt: '表示名をinputのvalue属性に埋め込む画面。入力後、実行画面内の入力欄をクリックしてフォーカスを移そう。',
        sink: 'HTML属性の解析とfocusイベント',
        goal: '変更前で属性の境界を越え、フォーカス操作でproof()を観測する。',
        seed: '京都',
        example: '" onfocus="proof()" data-note="',
        hint: 'value属性はダブルクォートで囲まれている。生成された属性をDOM表示で確かめよう。',
        explanation: '変更前は引用符を通じて新しい属性を作れる。変更後は属性値をエンコードするので引用符は元のvalueの内容になる。onfocusにはフォーカス操作が必要。コードの埋込みと発火条件を両方記録する。',
        build(value, fixed) {
            return { markup: '<div id="target"><label>表示名 <input value="' + (fixed ? htmlText(value) : value) + '"></label></div>' };
        }
    },
    {
        id: 'js-string',
        title: 'JavaScriptの文字列',
        prompt: '検索語をJavaScriptのシングルクォート文字列に連結する画面。HTML側とJS側の構文をそれぞれ確認しよう。',
        sink: '初期script要素内のJavaScript文字列',
        goal: '変更前の文字列境界を越えてproof()を呼ぶ。',
        seed: "O'Reilly",
        example: "'; proof(); //",
        hint: '文字列を閉じる引用符と、元のコードの残りをどう扱うかを考える。構文エラーもログに残る。',
        explanation: '変更前は入力をソースの一部として連結する。変更後はJSONの文字列リテラルにし、script要素内のHTML終端を作る山括弧もエスケープする。実装ではAPIやフレームワークの埋込み用機能を優先する。',
        build(value, fixed) {
            const literal = fixed ? scriptValue(value) : "'" + value + "'";
            return { markup: targetMarkup, script: 'const label = ' + literal + ';\n' + displayLabel };
        }
    },
    {
        id: 'template',
        title: 'テンプレートリテラルのソース',
        prompt: '入力をバッククォートで囲んだコードを生成する画面。式のように見える入力が、どちらの実装で評価されるだろう？',
        sink: '生成されたテンプレートリテラル',
        goal: '式評価でproof()が動く場合と、文字列として表示される場合を比べる。',
        seed: '${2 + 2}',
        example: '${proof()}',
        hint: '変更前の入力はテンプレートリテラルのソースに直接連結される。通常の文字列変数の中身を再評価している構成とは違う。',
        explanation: '変更前では式が実際のJSソースに含まれる。変更後は入力全体を文字列として渡すので、式を表す文字もそのまま表示される。変数に代入しただけで文字列の中の式が再評価されることはない。',
        build(value, fixed) {
            const backtick = String.fromCharCode(96);
            const literal = fixed ? scriptValue(value) : backtick + value + backtick;
            return { markup: targetMarkup, script: 'const label = ' + literal + ';\n' + displayLabel };
        }
    },
    {
        id: 'nested',
        title: 'HTML属性の中にあるJavaScript',
        prompt: '属性用エンコードを行った値をonclick内のJS文字列に埋め込む画面。実行画面内の「表示する」ボタンを押そう。',
        sink: 'HTML属性の実体参照デコード → JavaScript',
        goal: '属性用エンコードだけではJSの境界を守れない条件を観察する。',
        seed: '京都',
        example: "'; proof(); //",
        hint: 'HTML属性内の&#39;は、イベントハンドラーがJSとして読まれる前に引用符へ戻る。',
        explanation: '変更前はHTMLのエンコード後もJSのソースを連結している。変更後はイベントリスナーへ固定の関数を登録し、labelをデータとして使う。最終DOMの属性とイベント実行を見比べよう。',
        build(value, fixed) {
            if (fixed) {
                return {
                    markup: '<div id="target"></div><button id="apply">表示する</button>',
                    script: 'const label = ' + scriptValue(value) + ';\n' +
                        "document.getElementById('apply').addEventListener('click', () => {\n    " + displayLabel + '\n});'
                };
            }
            const handler = "const label = '" + value + "'; " + displayLabel;
            return {
                markup: '<div id="target"></div><button onclick="' + htmlText(handler) + '">表示する</button>'
            };
        }
    },
    {
        id: 'sanitizer',
        title: '装飾を許す本文のサニタイズ',
        prompt: '強調と斜体だけを許す本文。許可した装飾、属性、実行できる構造がどちらに残るかを比較しよう。',
        sink: 'innerHTML、変更後はDOMPurifyで処理したHTML',
        goal: '変更前のイベント実行を観測し、変更後に残る装飾と属性を説明する。',
        seed: '<strong title="注釈">京都</strong>から<em>大阪</em>へ',
        example: '<strong>京都</strong><img src=x onerror=proof()>',
        hint: '変更後はstrongとemを許可し、属性を除く。タイトルの除去と、画像要素の除去は別々に観察できる。',
        explanation: 'DOMPurifyを親ページで呼び、実際の戻り値を変更後のフレームに渡す。処理前後の文字列はコード欄でも確認できる。これは現在同梱している版と設定の比較。過去のmXSSの条件は、実務編の公開修正を読む課題で調べる。',
        build(value, fixed) {
            const cleaned = fixed ? DOMPurify.sanitize(value, {
                ALLOWED_TAGS: ['strong', 'em'],
                ALLOWED_ATTR: [],
                ALLOW_DATA_ATTR: false,
                ALLOW_ARIA_ATTR: false
            }) : value;
            return {
                markup: targetMarkup,
                script: "document.getElementById('target').innerHTML = " + scriptValue(cleaned) + ';',
                preprocessing: fixed ? "DOMPurify.sanitize(value, {\n    ALLOWED_TAGS: ['strong', 'em'],\n    ALLOWED_ATTR: [],\n    ALLOW_DATA_ATTR: false,\n    ALLOW_ARIA_ATTR: false\n})\n\n戻り値\n" + cleaned : ''
            };
        }
    },
    {
        id: 'reparse',
        title: 'テキストを読み戻してHTMLへ渡す',
        prompt: '最初の表示では文字として扱った値を、別の欄へコピーする処理。2回目の解釈先まで追おう。',
        sink: 'textContentから取得 → innerHTMLへ再代入',
        goal: '最初のテキスト表示を通過した入力が、どの段階で実行されるかを見る。',
        seed: '<b>京都</b>',
        example: '<img src=x onerror=proof()>',
        hint: '1段目にtextContentを使っても、読み戻した文字列の用途はコピー先で決まる。',
        explanation: '変更前は2段目でHTML解析が始まる。変更後はコピー先もtextContentを使う。この問題で示す原因は通常の再解釈で、サニタイザーとブラウザーの解析差を利用するmXSSとは条件が異なる。',
        build(value, fixed) {
            return {
                markup: '<div id="target"><p>1段目</p><div id="first"></div><p>2段目</p><div id="second"></div></div>',
                script: "document.getElementById('first').textContent = " + scriptValue(value) + ';\n' +
                    "document.getElementById('second')." + (fixed ? 'textContent' : 'innerHTML') +
                    " = document.getElementById('first').textContent;"
            };
        }
    },
    {
        id: 'csp',
        title: 'CSPで止まる場合のDOM',
        prompt: '両方とも入力を初期HTMLへ埋め込む。右側は計測用コードだけにnonceを付け、nonceを要求するポリシーを適用する。',
        sink: '初期HTML、CSPによるscript実行の制限',
        goal: '実行の有無と、注入されたHTML構造が残るかを別々に観察する。',
        seed: '<script>proof()</script>',
        example: '<b>京都</b><script>proof()</script>',
        hint: '右側の最終DOMにscript要素があっても、nonceのないscriptの実行はポリシーで拒否される。',
        explanation: 'この問題で変えるのはCSP。入力をHTMLとして挿入する処理は両方に残る。CSPはiframe内のmetaで強制適用している。実サイトのヘッダーやReport-Onlyの検証は、HTTP応答で別に行う。',
        beforeLabel: 'インライン実行を許可',
        afterLabel: 'nonceを要求',
        build(value, fixed) {
            return { markup: '<div id="target">' + value + '</div>', strictCsp: fixed };
        }
    }
];

let currentRun = null;
const panels = ['before', 'after'];

function renderTask() {
    currentRun = null;
    const task = tasks[Number(element('task').value)];
    element('task-title').textContent = task.title;
    element('task-prompt').textContent = task.prompt;
    element('sink').textContent = task.sink;
    element('goal').textContent = task.goal;
    element('payload').value = task.seed;
    element('prediction').value = '';
    element('hint-text').textContent = task.hint;
    element('example').textContent = task.example;
    element('explanation').textContent = task.explanation;
    element('hint').open = false;
    element('solution').open = false;
    element('run-status').textContent = '予想してから入力を送ってください。';
    for (const side of panels) {
        element(side + '-label').textContent = task[side + 'Label'] ?? (side === 'before' ? '変更前' : '変更後');
        element(side + '-frame').replaceChildren();
        element(side + '-status').textContent = '未実行';
        element(side + '-status').classList.remove('observed');
        element(side + '-dom').textContent = '';
        element(side + '-events').replaceChildren();
        element(side + '-code').textContent = '';
    }
}

function runtimeScript(runId) {
    return '(' + function (id) {
        const send = (kind, value) => {
            parent.postMessage({ channel: 'xss-context-lab', runId: id, kind, value }, '*');
        };
        const snapshot = () => {
            const target = document.getElementById('target');
            send('dom', target ? target.outerHTML.slice(0, 12000) : 'target要素が見つかりません。');
        };
        window.proof = () => {
            send('proof', location.origin);
            setTimeout(snapshot, 0);
        };
        window.addEventListener('error', event => {
            if (typeof event.message === 'string') send('error', event.message.slice(0, 600));
        });
        document.addEventListener('securitypolicyviolation', event => {
            send('csp', event.effectiveDirective + ' / ' + event.blockedURI);
        });
        document.addEventListener('DOMContentLoaded', () => {
            send('ready', '');
            snapshot();
        });
        document.addEventListener('click', () => setTimeout(snapshot, 0));
        document.addEventListener('focusin', () => setTimeout(snapshot, 0));
    }.toString() + ')(' + scriptValue(runId) + ');';
}

function buildDocument(variant, runId) {
    const nonce = 'lab-' + runId;
    const scriptPolicy = variant.strictCsp ? "'nonce-" + nonce + "'" : "'unsafe-inline'";
    const policy = "default-src 'none'; script-src " + scriptPolicy +
        "; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'";
    const scriptTag = code => '<script nonce="' + nonce + '">' + code + '</script>';
    return {
        html: '<!doctype html><html lang="ja"><head><meta charset="utf-8">' +
            '<meta http-equiv="Content-Security-Policy" content="' + htmlText(policy) + '">' +
            '<style>body{font:16px/1.6 system-ui;margin:16px;overflow-wrap:anywhere}input{max-width:90%}button{padding:6px 12px}</style>' +
            scriptTag(runtimeScript(runId)) + '</head><body>' + variant.markup +
            (variant.script ? scriptTag(variant.script) : '') + '</body></html>',
        listing: 'このフレームの強制CSP\n' + policy + '\n\n' +
            (variant.preprocessing ? '親ページの前処理\n' + variant.preprocessing + '\n\n' : '') +
            'フレーム内のマークアップと処理\n' + variant.markup +
            (variant.script ? '\n<script>\n' + variant.script + '\n</script>' : '') +
            '\n\n計測用スクリプトには演習のnonceを付けています。'
    };
}

function runExperiment(event) {
    event.preventDefault();
    currentRun = null;
    const task = tasks[Number(element('task').value)];
    const value = element('payload').value;
    try {
        const variants = [task.build(value, false), task.build(value, true)];
        const random = new Uint32Array(4);
        crypto.getRandomValues(random);
        const runId = Array.from(random, item => item.toString(16)).join('-');
        currentRun = { id: runId, frames: {} };
        panels.forEach((side, index) => {
            const doc = buildDocument(variants[index], runId);
            const frame = document.createElement('iframe');
            frame.setAttribute('sandbox', 'allow-scripts');
            frame.setAttribute('referrerpolicy', 'no-referrer');
            frame.title = task.title + ' / ' + element(side + '-label').textContent;
            element(side + '-frame').replaceChildren(frame);
            currentRun.frames[side] = { window: frame.contentWindow, proofs: 0 };
            element(side + '-status').textContent = 'フレームを読込中';
            element(side + '-status').classList.remove('observed');
            element(side + '-dom').textContent = '';
            element(side + '-events').replaceChildren();
            element(side + '-code').textContent = doc.listing;
            frame.srcdoc = doc.html;
        });
        element('run-status').textContent = '入力を送りました。必要な操作は実行画面の中で行い、DOMとログを比較してください。';
    } catch {
        currentRun = null;
        element('run-status').textContent = '実行できませんでした。ページを再読み込みして依存ファイルを確認してください。';
        for (const side of panels) {
            element(side + '-frame').replaceChildren();
            element(side + '-status').textContent = '実行エラー';
            element(side + '-status').classList.remove('observed');
            element(side + '-dom').textContent = '';
            element(side + '-events').replaceChildren();
            element(side + '-code').textContent = '';
        }
    }
}

window.addEventListener('message', event => {
    const data = event.data;
    if (!currentRun || !data || data.channel !== 'xss-context-lab' ||
        data.runId !== currentRun.id || typeof data.value !== 'string') return;
    const side = panels.find(name => currentRun.frames[name]?.window === event.source);
    if (!side) return;
    const frame = currentRun.frames[side];
    const status = element(side + '-status');
    if (data.kind === 'dom') {
        element(side + '-dom').textContent = data.value.slice(0, 12000);
        return;
    }
    if (data.kind === 'ready') {
        if (frame.proofs === 0) status.textContent = '読込完了。proof()はまだ観測していません。';
        return;
    }
    if (!['proof', 'error', 'csp'].includes(data.kind)) return;
    if (data.kind === 'proof') {
        frame.proofs += 1;
        status.textContent = 'proof()の実行を観測 / origin ' + data.value.slice(0, 100);
        status.classList.add('observed');
    }
    const messages = element(side + '-events');
    const item = document.createElement('li');
    const labels = { proof: 'コード実行', error: 'JavaScriptエラー', csp: 'CSP違反' };
    item.textContent = labels[data.kind] + ' — ' + data.value.slice(0, 600);
    messages.append(item);
    if (messages.children.length > 20) messages.firstElementChild.remove();
});

tasks.forEach((task, index) => element('task').add(new Option((index + 1) + '. ' + task.title, String(index))));
element('task').addEventListener('change', renderTask);
element('reset').addEventListener('click', renderTask);
element('experiment-form').addEventListener('submit', runExperiment);
renderTask();
