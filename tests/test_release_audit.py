import json
import tempfile
import unittest
import subprocess
import sys
from pathlib import Path

from tools.release_audit import audit_release

ROOT = Path(__file__).resolve().parents[1]


class ReleaseAuditTests(unittest.TestCase):
    def _make_root(self, version=True):
        tmp = tempfile.TemporaryDirectory()
        root = Path(tmp.name)
        (root / 'site').mkdir()
        (root / 'docs/migration').mkdir(parents=True)
        (root / 'site/index.html').write_text('<div id="root">Jalan Dao</div>', encoding='utf-8')
        marker = 'gameVersion:`8.1.3`,saveVersion:29' if version else 'gameVersion:`8.1.2`,saveVersion:28'
        (root / 'site/app.js').write_text(marker, encoding='utf-8')
        (root / 'docs/migration/live-snapshot-manifest.json').write_text(json.dumps({
            'downloaded': 2,
            'failures': [],
            'external_references': [],
        }), encoding='utf-8')
        return tmp, root

    def test_release_audit_passes_for_clean_813_snapshot(self):
        tmp, root = self._make_root(version=True)
        try:
            result = audit_release(root)
            self.assertEqual(result['errors'], [])
            self.assertTrue(result['version_8_1_4'])
            self.assertTrue(result['save_version_29'])
        finally:
            tmp.cleanup()

    def test_release_audit_rejects_wrong_version(self):
        tmp, root = self._make_root(version=False)
        try:
            result = audit_release(root)
            self.assertTrue(any('8.1.4' in e for e in result['errors']))
            self.assertFalse(any('saveVersion 29' in e for e in result['errors']))
        finally:
            tmp.cleanup()

    def test_cli_runs_from_repository_root(self):
        proc = subprocess.run(
            [sys.executable, "tools/release_audit.py", "--root", "."],
            cwd=ROOT,
            text=True,
            capture_output=True,
        )
        self.assertNotIn("ModuleNotFoundError", proc.stderr)


if __name__ == '__main__':
    unittest.main()
