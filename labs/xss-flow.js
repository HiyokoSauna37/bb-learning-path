const element = id => document.getElementById(id);

function readFragment() {
    const value = new URLSearchParams(location.hash.slice(1)).get('q') ?? '';
    element('fragment-output').textContent = value;
    element('fragment-trace').textContent = [
        'location.hash  ' + (location.hash || '（空）'),
        '読み取った q  ' + JSON.stringify(value),
        '表示先の子ノード  ' + (element('fragment-output').firstChild?.nodeName ?? '（なし）')
    ].join('\n');
    if (location.hash.startsWith('#q=')) element('fragment-value').value = value;
}

element('fragment-form').addEventListener('submit', event => {
    event.preventDefault();
    location.hash = new URLSearchParams({ q: element('fragment-value').value });
    readFragment();
});
window.addEventListener('hashchange', readFragment);
readFragment();

const manuscripts = [
    '<strong title="見出し" data-note="校正">運行情報</strong>',
    '<em>京都</em>から<u>大阪</u>へ',
    '説明書には &lt;strong&gt; と書いてある'
];

function chooseManuscript() {
    element('raw').textContent = manuscripts[element('markup').selectedIndex];
    element('sanitized-results').hidden = true;
}
element('markup').addEventListener('change', chooseManuscript);
element('policy').addEventListener('change', chooseManuscript);
chooseManuscript();

element('sanitize-form').addEventListener('submit', event => {
    event.preventDefault();
    const raw = manuscripts[element('markup').selectedIndex];
    const tags = element('policy').value === 'both' ? ['strong', 'em'] : ['strong'];
    const clean = DOMPurify.sanitize(raw, {
        ALLOWED_TAGS: tags,
        ALLOWED_ATTR: [],
        ALLOW_DATA_ATTR: false,
        ALLOW_ARIA_ATTR: false,
        RETURN_DOM_FRAGMENT: true
    });
    element('plain').textContent = raw;
    element('rich').replaceChildren(clean);
    element('sanitized-tree').textContent = element('rich').innerHTML;
    element('sanitized-results').hidden = false;
});

element('parent').addEventListener('change', () => { element('trees').textContent = ''; });
element('parse').addEventListener('click', () => {
    const clean = DOMPurify.sanitize('<table><tbody><tr><td>京都</td></tr></tbody></table>', {
        ALLOWED_TAGS: ['table', 'tbody', 'tr', 'td'],
        ALLOWED_ATTR: [],
        RETURN_DOM_FRAGMENT: true
    });
    const row = clean.querySelector('tr');
    const parent = document.createElement(element('parent').value);
    // Only the fixed table fixture above is used for this parsing comparison.
    parent.innerHTML = row.outerHTML;
    element('trees').textContent = [
        '元の親と DOM  ' + row.parentElement.outerHTML,
        '転記する文字列  ' + row.outerHTML,
        '再解析後の DOM  ' + parent.outerHTML
    ].join('\n');
});
