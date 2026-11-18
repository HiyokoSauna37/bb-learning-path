const tasks = [
    ['検索結果', '検索語を見出しにそのまま再表示する。', 'text', '<b>東京</b>'],
    ['プロフィール', '保存された自己紹介では太字の装飾だけ利用できる。', 'bold', '<b>写真</b>と<i>散歩</i>'],
    ['外部サイト欄', 'プロフィールから外部サイトへ移動できる。HTTPS の絶対 URL だけを受け付ける。', 'url', 'http://example.org'],
    ['チャットの引用', '引用したメッセージの記号を含め、原文どおりに表示する。', 'text', '私は <b> を使いました'],
    ['Wiki の要約', '要約には太字を使える。その他のタグは文字として残す。', 'bold', '<b>更新</b> <u>予定</u>'],
    ['予約投稿のプレビュー', '投稿本文に使える装飾は太字だけ。公開前に見た目を確認する。', 'bold', '<b>明日公開</b>'],
    ['問い合わせ履歴', '担当者の画面に、利用者が入力した製品名を正確に表示する。', 'text', '製品 A<B>'],
    ['資料へのリンク', '資料の配布元を HTTPS の絶対 URL に限定する。', 'url', '/docs/intro'],
    ['メールの件名', '受信一覧では、件名中のタグも文字として表示する。', 'text', '<b>配送のお知らせ</b>'],
    ['参考文献', 'HTTPS の絶対 URL から参照リンクを生成する。', 'url', 'https://example.org/paper'],
    ['ファイル名', 'アップロード履歴では元の名前を省略・装飾せずに表示する。', 'text', '資料<b>新版</b>.txt'],
    ['変更履歴', '強調箇所だけ太字にし、それ以外の記法は原文を表示する。', 'bold', '<i>旧版</i> → <b>新版</b>']
];
const byId = id => document.getElementById(id);
const picker = byId('task');
tasks.forEach(([title], index) => picker.add(new Option((index + 1) + '. ' + title, index)));

function loadTask() {
    const [title, prompt, , sample] = tasks[picker.selectedIndex];
    byId('title').textContent = title;
    byId('prompt').textContent = prompt;
    byId('sample').value = sample;
    byId('choice').value = '';
    byId('feedback').textContent = '';
    byId('preview').replaceChildren();
}

function renderExample(mode, value, output) {
    if (mode === 'text') {
        output.textContent = value;
    } else if (mode === 'bold') {
        // Only the literal <b>…</b> notation is supported.
        value.split(/(<b>[\s\S]*?<\/b>)/g).forEach((part, index) => {
            if (index % 2 === 0) output.append(part);
            else {
                const bold = document.createElement('strong');
                bold.textContent = part.slice(3, -4);
                output.append(bold);
            }
        });
    } else {
        let url;
        try { url = new URL(value); } catch { /* Show the rejection below. */ }
        if (url?.protocol !== 'https:') {
            output.textContent = 'リンクを作成できません。HTTPS の絶対 URL が必要です。';
            return;
        }
        const link = document.createElement('a');
        link.href = url.href;
        link.textContent = url.href;
        output.append(link);
    }
}

picker.addEventListener('change', loadTask);
byId('run').addEventListener('click', () => {
    const mode = byId('choice').value;
    const output = byId('preview');
    output.replaceChildren();
    if (!mode) {
        byId('feedback').textContent = '先に処理を選んでください。';
        return;
    }
    const correct = mode === tasks[picker.selectedIndex][2];
    byId('feedback').textContent = correct ? '正解。入力値を変えてもう一度確認できます。' : '選んだ処理の結果です。問題文の表示要件と比較してみましょう。';
    renderExample(mode, byId('sample').value, output);
});
loadTask();
