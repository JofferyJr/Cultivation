from __future__ import annotations

import argparse
import re
from pathlib import Path

TEXT_SUFFIXES = {'.html', '.htm', '.js', '.mjs', '.cjs', '.css', '.json', '.svg', '.txt', '.map'}
OLD_HOST = 'jalan-dao-xianxia.jofferyjr.chatgpt.site'


def audit_runtime(root: Path) -> list[str]:
    errors: list[str] = []
    if not root.exists():
        return [f'missing runtime root: {root}']

    for path in root.rglob('*'):
        if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        try:
            text = path.read_text(encoding='utf-8', errors='replace')
        except OSError as exc:
            errors.append(f'{path}: unreadable: {exc}')
            continue
        lower = text.lower()
        rel = path.relative_to(root).as_posix()
        if OLD_HOST in lower:
            errors.append(f'{rel}: chatgpt.site runtime reference')
        if '<iframe' in lower:
            errors.append(f'{rel}: iframe found')
        if re.search(r'http-equiv\s*=\s*["\']?refresh', lower):
            errors.append(f'{rel}: refresh redirect found')
        if re.search(r'fetch\s*\(\s*["\']https?://[^"\']*chatgpt\.site', lower):
            errors.append(f'{rel}: SiteGPT fetch found')
        if re.search(r'(?:window\.)?location(?:\.href)?\s*=\s*["\']https?://[^"\']*chatgpt\.site', lower):
            errors.append(f'{rel}: SiteGPT navigation found')
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('root', nargs='?', default='site')
    args = parser.parse_args()
    errors = audit_runtime(Path(args.root))
    if errors:
        for error in errors:
            print(error)
        return 1
    print('Static runtime audit: PASS')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
