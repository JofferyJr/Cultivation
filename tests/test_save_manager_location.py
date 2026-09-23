import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class SaveManagerLocationTests(unittest.TestCase):
    def test_settings_contains_no_save_or_load_controls(self):
        bundle = (ROOT / 'site/assets/page-B87MruAb.js').read_text(encoding='utf-8')
        self.assertNotIn('Data kemajuan', bundle)
        self.assertNotIn('Muat Game', bundle)
        self.assertNotIn('Simpan perjalanan semasa atau muat simpanan terdahulu', bundle)

    def test_save_manager_is_outside_settings(self):
        manager = (ROOT / 'site/assets/v815-save-manager.js').read_text(encoding='utf-8')
        self.assertIn('Simpan & Export', manager)
        self.assertIn('Pengurus Simpanan', manager)
        self.assertIn('Export Semua', manager)
        self.assertIn('Import Save', manager)

if __name__ == '__main__':
    unittest.main()
