import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class V815StaticReleaseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bundle = (ROOT / 'site/assets/page-B87MruAb.js').read_text(encoding='utf-8')
        cls.html = (ROOT / 'site/index.html').read_text(encoding='utf-8')
        cls.css = (ROOT / 'site/v815.css').read_text(encoding='utf-8')
        cls.enhance = (ROOT / 'site/v815-enhancements.js').read_text(encoding='utf-8')

    def test_current_version_and_save_format_are_815_and_30(self):
        self.assertIn('var x_=`8.1.5`', self.bundle)
        self.assertIn('saveVersion:30,gameVersion:x_', self.bundle)
        self.assertIn('saveVersion:29,gameVersion:`8.1.4`', self.bundle)
        self.assertIn('migrateV815Save', self.bundle)
        self.assertIn('Versi <!-- -->8.1.5', self.html)

    def test_player_uses_one_to_four_additive_talents(self):
        self.assertIn('BC815_MAX_TALENTS=4', self.bundle)
        self.assertIn('[L,fe]=(0,u.useState)([`Tekun`])', self.bundle)
        self.assertIn('rootGrade:x,talents:L,background:he', self.bundle)
        self.assertNotIn('rootGrade:x,talent:L,background:he', self.bundle)
        self.assertNotIn('function BC815MultiTalent', self.bundle)
        self.assertIn('Array.isArray(r)', self.bundle)
        self.assertIn('BC815ToggleTalent(l,e.id,o)', self.bundle)
        self.assertIn('BC815TalentBonuses(L).manualMastery', self.bundle)
        self.assertIn('BC815TalentBonuses(L).meditation', self.bundle)
        self.assertIn('BC815TalentBonuses(L).breakthroughChance', self.bundle)
        self.assertNotIn('L===`Genius`', self.bundle)

    def test_true_love_age_rule_is_normalized(self):
        self.assertIn('hv(t)||(i=i.filter(e=>e!==`True Love`))', self.bundle)
        self.assertIn('fe(e=>BC815NormalizeTalents(e,t))', self.bundle)
        self.assertIn('BC815HasTalent(L,`True Love`)&&hv(o)', self.bundle)

    def test_child_npc_single_talent_model_remains(self):
        self.assertIn('talent:kv[Math.floor(n()*kv.length)].id', self.bundle)

    def test_inventory_hydration_exists(self):
        self.assertIn('function BC815HydrateInventory', self.bundle)
        self.assertIn('BC815HydrateInventory(o.inventory.filter', self.bundle)
        self.assertIn('Object.prototype.hasOwnProperty.call(e,`favorite`)', self.bundle)

    def test_portrait_paper_and_width_rules_exist(self):
        self.assertIn('Pilih Muka Pemain', self.enhance)
        self.assertIn('Pilih Muka Pasangan', self.enhance)
        self.assertIn('event.key === "Escape"', self.enhance)
        self.assertIn('grid-template-columns: repeat(6,minmax(0,1fr))', self.css)
        self.assertIn('repeat(4,minmax(0,1fr))', self.css)
        self.assertIn('repeat(2,minmax(0,1fr))', self.css)
        self.assertNotIn('body { overflow-x: hidden', self.css)
        self.assertNotIn('min-h-screen overflow-hidden', self.html)
        self.assertIn('/Cultivation/v815-enhancements.js', self.html)

    def test_multi_talent_accessibility_is_added_after_hydration(self):
        self.assertIn('function decorateTalentGroup()', self.enhance)
        self.assertIn('multi-talent-count', self.enhance)
        self.assertIn('aria-pressed', self.enhance)

if __name__ == '__main__':
    unittest.main()
