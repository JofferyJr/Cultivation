import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class VerifyWorkflowTests(unittest.TestCase):
    def test_verify_workflow_runs_unit_and_release_audits(self):
        text = (ROOT / '.github/workflows/verify-migration.yml').read_text(encoding='utf-8')
        self.assertIn('migration/sitegpt-standalone', text)
        self.assertIn('python -m unittest discover', text)
        self.assertIn('python tools/release_audit.py', text)
        self.assertIn('site', text)

if __name__ == '__main__':
    unittest.main()
