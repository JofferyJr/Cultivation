import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class PagesWorkflowTests(unittest.TestCase):
    def test_pages_deploys_snapshot_folder_only(self):
        text = (ROOT / '.github/workflows/pages.yml').read_text(encoding='utf-8')
        self.assertIn('branches: ["main"]', text)
        self.assertIn('path: site', text)
        self.assertNotIn('path: .', text)

    def test_duplicate_static_workflow_is_absent(self):
        self.assertFalse((ROOT / '.github/workflows/static.yml').exists())

if __name__ == '__main__':
    unittest.main()
