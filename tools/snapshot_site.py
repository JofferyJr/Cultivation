from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import re
import urllib.request
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Callable
from urllib.parse import urljoin, urlparse, urlunparse

_TEXT_TYPES = (
    "text/",
    "application/javascript",
    "application/x-javascript",
    "application/json",
    "application/xml",
    "image/svg+xml",
)

_URL_PATTERNS = [
    re.compile(r'''(?:src|href|poster)\s*=\s*["']([^"']+)["']''', re.I),
    re.compile(r'''url\(\s*["']?([^"')]+)["']?\s*\)''', re.I),
    re.compile(r'''["']((?:https?://[^"']+|/[^"']+|\./[^"']+|\.\./[^"']+))["']'''),
]

@dataclass
class Response:
    url: str
    body: bytes
    content_type: str


def _default_fetch(url: str) -> Response:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "JalanDao-GitHub-Migration/1.0",
            "Accept": "*/*",
        },
    )
    with urllib.request.urlopen(request, timeout=60) as resp:
        content_type = resp.headers.get_content_type() or mimetypes.guess_type(url)[0] or "application/octet-stream"
        return Response(resp.geturl(), resp.read(), content_type)


def _strip_fragment(url: str) -> str:
    parsed = urlparse(url)
    return urlunparse(parsed._replace(fragment=""))


def _same_origin(a: str, b: str) -> bool:
    pa, pb = urlparse(a), urlparse(b)
    return (pa.scheme, pa.netloc) == (pb.scheme, pb.netloc)


def _is_ignored_ref(ref: str) -> bool:
    lower = ref.strip().lower()
    return (
        not lower
        or lower.startswith(("data:", "blob:", "javascript:", "mailto:", "tel:", "#"))
        or lower.startswith("about:")
    )


_STATIC_EXTENSIONS = {
    ".html", ".htm", ".css", ".js", ".mjs", ".cjs", ".json", ".map",
    ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".ico",
    ".woff", ".woff2", ".ttf", ".otf", ".webmanifest", ".wasm",
    ".mp3", ".ogg", ".wav", ".mp4", ".webm",
}

def _looks_fetchable(ref: str) -> bool:
    if not ref.startswith(("http://", "https://", "/", "./", "../")):
        return False
    path = urlparse(ref).path.lower()
    if any(marker in path for marker in ("/assets/", "/static/", "/_next/", "/build/", "/dist/")):
        return True
    return PurePosixPath(path).suffix in _STATIC_EXTENSIONS


def _safe_local_path(url: str, root_url: str) -> Path:
    parsed = urlparse(url)
    path = parsed.path or "/"
    if path.endswith("/"):
        path += "index.html"
    elif path == "/":
        path = "/index.html"
    name = PurePosixPath(path).name
    if not name:
        path += "index.html"
    if parsed.query:
        p = PurePosixPath(path)
        digest = hashlib.sha256(parsed.query.encode("utf-8")).hexdigest()[:10]
        if p.suffix:
            path = str(p.with_name(f"{p.stem}-{digest}{p.suffix}"))
        else:
            path = str(p.with_name(f"{p.name}-{digest}"))
    return Path(path.lstrip("/"))


class Snapshotter:
    def __init__(
        self,
        root_url: str,
        project_base: str,
        *,
        fetch: Callable[[str], Response] | None = None,
    ):
        self.root_url = root_url if root_url.endswith("/") else root_url + "/"
        self.project_base = "/" + project_base.strip("/") if project_base.strip("/") else ""
        self.fetch = fetch or _default_fetch
        self.origin = f"{urlparse(self.root_url).scheme}://{urlparse(self.root_url).netloc}"

    def _extract_refs(self, text: str) -> set[str]:
        refs: set[str] = set()
        for pattern in _URL_PATTERNS:
            for match in pattern.finditer(text):
                ref = match.group(1).strip()
                if _is_ignored_ref(ref):
                    continue
                if _looks_fetchable(ref):
                    refs.add(ref)
        return refs

    def _decode(self, body: bytes) -> str:
        return body.decode("utf-8", errors="replace")

    def _is_text(self, content_type: str, path: Path) -> bool:
        c = content_type.lower().split(";", 1)[0].strip()
        return c.startswith(_TEXT_TYPES) or path.suffix.lower() in {".html", ".htm", ".css", ".js", ".mjs", ".json", ".svg", ".txt", ".map"}

    def _project_url_for(self, absolute_url: str) -> str:
        parsed = urlparse(absolute_url)
        path = parsed.path or "/"
        if path == "/":
            return self.project_base + "/"
        return self.project_base + path

    def _rewrite_text(self, text: str, current_url: str, fetched_urls: set[str]) -> str:
        for absolute in sorted(fetched_urls, key=len, reverse=True):
            parsed = urlparse(absolute)
            project = self._project_url_for(absolute)
            text = text.replace(absolute, project)
            if parsed.path and parsed.path != "/":
                text = text.replace(f'"{parsed.path}"', f'"{project}"')
                text = text.replace(f"'{parsed.path}'", f"'{project}'")
                text = text.replace(f"url({parsed.path})", f"url({project})")
                text = text.replace(f"url('{parsed.path}')", f"url('{project}')")
                text = text.replace(f'url("{parsed.path}")', f'url("{project}")')
        return text

    def snapshot(self, output_root: Path) -> dict:
        output_root.mkdir(parents=True, exist_ok=True)
        queue = [self.root_url]
        seen: set[str] = set()
        fetched: dict[str, Response] = {}
        external: set[str] = set()
        failures: list[dict] = []

        while queue:
            url = _strip_fragment(queue.pop(0))
            if url in seen:
                continue
            seen.add(url)
            if not _same_origin(url, self.root_url):
                external.add(url)
                continue
            try:
                response = self.fetch(url)
            except Exception as exc:
                failures.append({"url": url, "error": str(exc)})
                continue
            final_url = _strip_fragment(response.url)
            fetched[final_url] = response
            local_path = _safe_local_path(final_url, self.root_url)

            if self._is_text(response.content_type, local_path):
                text = self._decode(response.body)
                for ref in self._extract_refs(text):
                    absolute = _strip_fragment(urljoin(final_url, ref))
                    if _same_origin(absolute, self.root_url):
                        if absolute not in seen:
                            queue.append(absolute)
                    else:
                        external.add(absolute)

        fetched_urls = set(fetched)
        files = []
        for url, response in fetched.items():
            local_path = _safe_local_path(url, self.root_url)
            target = output_root / local_path
            target.parent.mkdir(parents=True, exist_ok=True)
            body = response.body
            if self._is_text(response.content_type, local_path):
                text = self._rewrite_text(self._decode(body), url, fetched_urls)
                body = text.encode("utf-8")
            target.write_bytes(body)
            files.append({
                "url": url,
                "path": local_path.as_posix(),
                "content_type": response.content_type,
                "bytes": len(body),
                "sha256": hashlib.sha256(body).hexdigest(),
            })

        report = {
            "source": self.root_url,
            "project_base": self.project_base or "/",
            "downloaded": len(files),
            "files": sorted(files, key=lambda x: x["path"]),
            "external_references": sorted(external),
            "failures": failures,
        }
        (output_root / "snapshot-manifest.json").write_text(
            json.dumps(report, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        return report


def main() -> int:
    parser = argparse.ArgumentParser(description="Snapshot a same-origin static site into a GitHub Pages project path")
    parser.add_argument("--url", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--project-base", default="/Cultivation")
    args = parser.parse_args()
    report = Snapshotter(args.url, args.project_base).snapshot(Path(args.output))
    print(json.dumps({
        "downloaded": report["downloaded"],
        "failures": len(report["failures"]),
        "external_references": len(report["external_references"]),
    }))
    return 1 if report["failures"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
