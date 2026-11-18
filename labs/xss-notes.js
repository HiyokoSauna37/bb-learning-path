async function readNotes() {
    const status = document.getElementById('status');
    try {
        const response = await fetch('/api/notes');
        if (!response.ok) throw new Error('Could not load notes');
        const notes = await response.json();
        const list = document.getElementById('notes');
        for (const note of notes) {
            const item = document.createElement('li');
            item.textContent = note;
            list.append(item);
        }
        status.textContent = notes.length + ' 件の投稿を JSON から表示しました。';
    } catch {
        status.textContent = '投稿を読み込めませんでした。サーバーを確認し、再読み込みしてください。';
    }
}
readNotes();
