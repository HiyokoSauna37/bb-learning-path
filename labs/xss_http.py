"""Two local exercises comparing safely reflected and stored text. Run with Python 3."""
import json
from collections import deque
from html import escape
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Lock
from urllib.parse import parse_qs, urlsplit

ADDRESS = ("127.0.0.1", 8765)
ORIGIN = "http://127.0.0.1:8765"
FORMS = """
<h2>検索</h2><form action="/search">
<label>検索語 <input name="q" value="&lt;b&gt;京都&lt;/b&gt;"></label>
<button>検索する</button></form>
<h2>掲示板</h2><form action="/notes" method="post">
<label>投稿 <input name="note" maxlength="500" required value="&lt;i&gt;初投稿&lt;/i&gt;"></label>
<button>保存する</button></form>
<p><a href="/notes">投稿を読む</a> ／ <a href="/reader">JSON から同じ投稿を読む</a></p>
"""


class Handler(BaseHTTPRequestHandler):
    def page(self, heading, body):
        data = (f'<!doctype html><html lang="ja"><meta charset="utf-8">'
                f'<meta name="viewport" content="width=device-width,initial-scale=1">'
                f'<title>{heading}</title><main><h1>{heading}</h1>{body}'
                f'<p><a href="/">演習のホーム</a></p></main></html>').encode()
        self.respond("text/html; charset=utf-8", data)

    def respond(self, content_type, data):
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Security-Policy", "default-src 'none'; script-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'none'")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        route = urlsplit(self.path)
        if route.path == "/":
            self.page("HTTP で入力の経路を追う", FORMS)
        elif route.path == "/search":
            term = parse_qs(route.query).get("q", [""])[0]
            self.page("検索結果", f"<p>検索語 <samp>{escape(term)}</samp></p>")
        elif route.path in ("/notes", "/api/notes"):
            with self.server.notes_lock:
                notes = list(self.server.notes)
            if route.path == "/api/notes":
                self.respond("application/json", json.dumps(notes, ensure_ascii=False).encode())
            else:
                items = "".join(f"<li>{escape(note)}</li>" for note in notes)
                self.page("投稿一覧", f"<ul>{items}</ul>" if items else "<p>まだ投稿はありません。</p>")
        elif route.path == "/reader":
            self.page("JSON から読む投稿一覧",
                      '<p id="status" role="status">読込中</p><ul id="notes"></ul>'
                      '<script src="/xss-notes.js"></script>')
        elif route.path == "/xss-notes.js":
            self.respond("text/javascript", Path(__file__).with_name("xss-notes.js").read_bytes())
        else:
            self.send_error(404)

    def do_POST(self):
        if self.path != "/notes":
            return self.send_error(404)
        if self.headers.get("Origin") != ORIGIN:
            return self.send_error(403)
        try:
            size = int(self.headers.get("Content-Length", ""))
            if not 0 < size <= 8192:
                return self.send_error(413)
            note = parse_qs(self.rfile.read(size).decode()).get("note", [""])[0]
        except (ValueError, UnicodeError):
            return self.send_error(400)
        if not 0 < len(note) <= 500:
            return self.send_error(400)
        with self.server.notes_lock:
            self.server.notes.append(note)
        self.send_response(303)
        self.send_header("Location", "/notes")
        self.end_headers()


if __name__ == "__main__":
    with ThreadingHTTPServer(ADDRESS, Handler) as server:
        server.notes = deque(maxlen=50)
        server.notes_lock = Lock()
        print(f"{ORIGIN}/ を開いてください。Ctrl+C で終了し、投稿も消えます。", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
