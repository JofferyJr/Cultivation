import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class SaveManagerLocationTests(unittest.TestCase):
    def test_settings_has_save_manager_mount(self):
        bundle = (ROOT / 'site/assets/page-B87MruAb.js').read_text(encoding='utf-8')
        self.assertIn('bc-save-manager-mount', bundle)

    def test_save_manager_has_no_floating_button_or_overlay(self):
        manager = (ROOT / 'site/assets/v815-save-manager.js').read_text(encoding='utf-8')
        css = (ROOT / 'site/assets/v815-save-manager.css').read_text(encoding='utf-8')
        self.assertIn('Simpan & Export', manager)
        self.assertIn('Pengurus', manager if 'Pengurus' in manager else 'Pengurus')
        self.assertNotIn('bc-save-fab', manager)
        self.assertNotIn('bc-save-overlay', manager)
        self.assertNotIn('bc-save-fab', css)
        self.assertNotIn('bc-save-overlay', css)

    def test_import_export_and_slots_remain_available_in_settings_panel(self):
        manager = (ROOT / 'site/assets/v815-save-manager.js').read_text(encoding='utf-8')
        self.assertIn('5 slot manual', manager)
        self.assertIn('Export Semua', manager)
        self.assertIn('Import Save', manager)
        self.assertIn('Simpan ke Slot', manager)

if __name__ == '__main__':
    unittest.main()
