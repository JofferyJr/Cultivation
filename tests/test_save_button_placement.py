import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class SaveButtonPlacementTests(unittest.TestCase):
    def test_no_quick_save_button_outside_settings(self):
        bundle = (ROOT / 'site/assets/page-B87MruAb.js').read_text(encoding='utf-8')
        self.assertNotIn('children:It||`Simpan`', bundle)

    def test_settings_slot_save_can_capture_current_runtime(self):
        bundle = (ROOT / 'site/assets/page-B87MruAb.js').read_text(encoding='utf-8')
        manager = (ROOT / 'site/assets/v815-save-manager.js').read_text(encoding='utf-8')
        self.assertIn('window.__boundlessSaveCurrent=To', bundle)
        self.assertIn('window.__boundlessSaveCurrent', manager)

if __name__ == '__main__':
    unittest.main()
