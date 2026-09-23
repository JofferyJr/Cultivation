import tempfile
import unittest
from pathlib import Path

from tools.snapshot_site import Snapshotter


class FakeResponse:
    def __init__(self, url, body, content_type):
        self.url = url
        self.body = body
        self.content_type = content_type


class SnapshotTests(unittest.TestCase):
    def test_crawls_same_origin_assets_and_rewrites_for_project_pages(self):
        base = "https://jalan-dao-xianxia.jofferyjr.chatgpt.site/"
        responses = {
            base: FakeResponse(base, b'''<!doctype html><link rel="stylesheet" href="/assets/app.css"><script src="/assets/app.js"></script>''', "text/html"),
            base + "assets/app.css": FakeResponse(base + "assets/app.css", b'''body{background:url('/assets/bg.png')}''', "text/css"),
            base + "assets/app.js": FakeResponse(base + "assets/app.js", b'''const icon="/assets/icon.svg";''', "application/javascript"),
            base + "assets/bg.png": FakeResponse(base + "assets/bg.png", b"PNGDATA", "image/png"),
            base + "assets/icon.svg": FakeResponse(base + "assets/icon.svg", b"<svg></svg>", "image/svg+xml"),
        }

        def fetch(url):
            return responses[url]

        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            report = Snapshotter(base, "/Cultivation", fetch=fetch).snapshot(out)

            self.assertEqual(report["downloaded"], 5)
            html = (out / "index.html").read_text()
            css = (out / "assets/app.css").read_text()
            js = (out / "assets/app.js").read_text()
            self.assertIn('/Cultivation/assets/app.css', html)
            self.assertIn('/Cultivation/assets/app.js', html)
            self.assertIn('/Cultivation/assets/bg.png', css)
            self.assertIn('/Cultivation/assets/icon.svg', js)
            self.assertEqual((out / "assets/bg.png").read_bytes(), b"PNGDATA")

    def test_ignores_cross_origin_urls(self):
        base = "https://jalan-dao-xianxia.jofferyjr.chatgpt.site/"
        responses = {
            base: FakeResponse(base, b'''<script src="https://example.com/external.js"></script>''', "text/html"),
        }
        seen = []

        def fetch(url):
            seen.append(url)
            return responses[url]

        with tempfile.TemporaryDirectory() as tmp:
            report = Snapshotter(base, "/Cultivation", fetch=fetch).snapshot(Path(tmp))
        self.assertEqual(seen, [base])
        self.assertEqual(report["external_references"], ["https://example.com/external.js"])

    def test_does_not_treat_spa_route_strings_as_static_assets(self):
        base = "https://jalan-dao-xianxia.jofferyjr.chatgpt.site/"
        responses = {
            base: FakeResponse(base, b'<script src="/assets/app.js"></script>', "text/html"),
            base + "assets/app.js": FakeResponse(base + "assets/app.js", b'const route="/settings"; const chunk="/assets/chunk.js";', "application/javascript"),
            base + "assets/chunk.js": FakeResponse(base + "assets/chunk.js", b'console.log("ok")', "application/javascript"),
        }
        seen = []

        def fetch(url):
            seen.append(url)
            return responses[url]

        with tempfile.TemporaryDirectory() as tmp:
            report = Snapshotter(base, "/Cultivation", fetch=fetch).snapshot(Path(tmp))
        self.assertNotIn(base + "settings", seen)
        self.assertIn(base + "assets/chunk.js", seen)
        self.assertEqual(report["failures"], [])


    def test_strips_cloudflare_challenge_injection_from_html(self):
        base = "https://jalan-dao-xianxia.jofferyjr.chatgpt.site/"
        html = b'<script src="/assets/app.js"></script><script>(function(){var a=document.createElement("iframe");window.__CF$cv$params={};a.src="/cdn-cgi/challenge-platform/scripts/jsd/main.js";})();</script>'
        responses = {
            base: FakeResponse(base, html, "text/html"),
            base + "assets/app.js": FakeResponse(base + "assets/app.js", b'console.log("game")', "application/javascript"),
        }

        def fetch(url):
            return responses[url]

        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            report = Snapshotter(base, "/Cultivation", fetch=fetch).snapshot(out)
            saved = (out / "index.html").read_text()
        self.assertEqual(report["downloaded"], 2)
        self.assertNotIn("__CF$cv$params", saved)
        self.assertNotIn("cdn-cgi", saved)
        self.assertNotIn("iframe", saved)


if __name__ == "__main__":
    unittest.main()
