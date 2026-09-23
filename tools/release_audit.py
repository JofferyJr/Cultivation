from __future__ import annotations

import argparse
import json
from pathlib import Path

try:
    from tools.audit_static_runtime import audit_runtime, TEXT_SUFFIXES
except ModuleNotFoundError:
    from audit_static_runtime import audit_runtime, TEXT_SUFFIXES


def _runtime_text(site: Path) -> str:
    parts = []
    for path in site.rglob('*'):
        if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES:
            parts.append(path.read_text(encoding='utf-8', errors='replace'))
    return '\n'.join(parts)


def audit_release(root: Path) -> dict:
    site = root / 'site'
    manifest_path = root / 'docs/migration/live-snapshot-manifest.json'
    errors: list[str] = []

    if not (site / 'index.html').is_file():
        errors.append('missing site/index.html')

    static_errors = audit_runtime(site)
    errors.extend(static_errors)

    manifest = {}
    if not manifest_path.is_file():
        errors.append('missing live snapshot manifest')
    else:
        try:
            manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
        except json.JSONDecodeError as exc:
            errors.append(f'invalid live snapshot manifest: {exc}')
        else:
            if manifest.get('failures'):
                errors.append(f'snapshot failures: {len(manifest["failures"])}')
            if manifest.get('external_references'):
                errors.append(f'external runtime references: {len(manifest["external_references"])}')
            if int(manifest.get('downloaded', 0)) < 1:
                errors.append('snapshot downloaded zero files')

    runtime = _runtime_text(site) if site.exists() else ''
    version_814 = '8.1.4' in runtime
    save_version_29 = 'saveVersion:29' in runtime or 'saveVersion":29' in runtime
    if not version_814:
        errors.append('required game version 8.1.4 marker not found')
    if not save_version_29:
        errors.append('required saveVersion 29 marker not found')

    return {
        'errors': errors,
        'static_errors': static_errors,
        'version_8_1_4': version_814,
        'save_version_29': save_version_29,
        'downloaded': manifest.get('downloaded', 0) if manifest else 0,
    }


def write_markdown(result: dict, path: Path) -> None:
    status = 'PASS' if not result['errors'] else 'FAIL'
    lines = [
        '# Jalan Dao GitHub Release Audit',
        '',
        f'**Status:** {status}',
        '',
        f'- Snapshot files downloaded: {result["downloaded"]}',
        f'- Version 8.1.4 marker: {"yes" if result["version_8_1_4"] else "no"}',
        f'- saveVersion 29 marker: {"yes" if result["save_version_29"] else "no"}',
        f'- Static independence errors: {len(result["static_errors"])}',
    ]
    if result['errors']:
        lines.extend(['', '## Errors', ''])
        lines.extend(f'- {error}' for error in result['errors'])
    else:
        lines.extend([
            '',
            'The runtime snapshot is self-contained with respect to the former SiteGPT host checks in this audit.',
        ])
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text('\n'.join(lines) + '\n', encoding='utf-8')


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', default='.')
    parser.add_argument('--write')
    args = parser.parse_args()
    result = audit_release(Path(args.root))
    if args.write:
        write_markdown(result, Path(args.write))
    print(json.dumps(result, indent=2))
    return 1 if result['errors'] else 0


if __name__ == '__main__':
    raise SystemExit(main())
