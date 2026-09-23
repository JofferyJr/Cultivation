import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class WorkflowTests(unittest.TestCase):
    def test_one_time_workflow_snapshots_site_and_commits_to_migration_branch(self):
        text = (ROOT / '.github/workflows/migrate-sitegpt.yml').read_text(encoding='utf-8')
        self.assertIn('migration/sitegpt-standalone', text)
        self.assertIn('contents: write', text)
        self.assertIn('tools/snapshot_site.py', text)
        self.assertIn('https://jalan-dao-xianxia.jofferyjr.chatgpt.site', text)
        self.assertIn('--output site', text)
        self.assertIn('[site-migration]', text)
        self.assertIn('git push', text)


if __name__ == '__main__':
    unittest.main()
