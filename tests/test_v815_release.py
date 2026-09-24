import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class V815ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.bundle = (ROOT / 'site/assets/page-B87MruAb.js').read_text(encoding='utf-8')
        self.css = (ROOT / 'site/assets/v815-release.css').read_text(encoding='utf-8')
        self.runtime = (ROOT / 'site/assets/v815-release.js').read_text(encoding='utf-8')
        self.base_css = (ROOT / 'site/assets/index-BCMgbAyj.css').read_text(encoding='utf-8')

    def test_version_and_save_format(self):
        self.assertIn('var x_=`8.1.5`', self.bundle)
        self.assertIn('saveVersion:30,gameVersion:x_', self.bundle)
        self.assertIn('talents:L,background:he', self.bundle)
        self.assertNotIn('talent:L,background:he', self.bundle)
        self.assertIn('function BC815Migrate', self.bundle)

    def test_multi_talent_rules_are_integrated(self):
        self.assertIn('function BC815NormalizeTalents', self.bundle)
        self.assertIn('function BC815ToggleTalent', self.bundle)
        self.assertIn('function BC815TalentGroup', self.bundle)
        self.assertIn('e.length>=4', self.bundle)
        self.assertIn('L.includes(`True Love`)', self.bundle)
        self.assertIn('BC815Bonuses(L).meditation', self.bundle)
        self.assertIn('BC815Bonuses(L).manualMastery', self.bundle)
        self.assertIn('BC815Bonuses(L).breakthroughChance', self.bundle)

    def test_inventory_hydration_uses_canonical_art(self):
        self.assertIn('BC815Catalog=new Map(Gv.map', self.bundle)
        self.assertIn('function BC815HydrateItem', self.bundle)
        self.assertIn('.map(BC815HydrateItem)', self.bundle)
        self.assertIn('bcArts=[...new Set([e.art,bcCanonical].filter(Boolean))]', self.bundle)
        self.assertIn('onError:()=>bcSetIndex(e=>e+1)', self.bundle)
        self.assertIn('window.location.pathname.startsWith(`/Cultivation`)', self.bundle)
        for marker in ['Ug=Hg(`herb`', 'Wg=Hg(`metal`', 'Kg=Hg(`portal`']: self.assertIn(marker, self.bundle)

    def test_all_27_inventory_art_files_exist(self):
        root = ROOT / 'site/game-art/v813'
        groups = {'herbs': 9, 'metals': 10, 'portal': 8}
        total = 0
        for folder, expected in groups.items():
            files = sorted((root / folder).glob('*.webp'))
            self.assertEqual(len(files), expected, folder)
            for path in files:
                self.assertGreater(path.stat().st_size, 0, str(path))
            total += len(files)
        self.assertEqual(total, 27)
        self.assertTrue((root / 'portal/kunci-portal-laut-utuh.webp').is_file())
    def test_portrait_paper_and_width_rules(self):
        self.assertIn('Kertas Pemilihan Muka', self.runtime)
        self.assertIn('Pilih Muka Pemain', self.runtime)
        self.assertIn('Pilih Muka Pasangan', self.runtime)
        self.assertIn('grid-template-columns:repeat(6,minmax(0,1fr))', self.css)
        self.assertIn('repeat(4,minmax(0,1fr))', self.css)
        self.assertIn('repeat(2,minmax(0,1fr))', self.css)
        self.assertIn('min-width:0', self.css)
        self.assertNotIn('body{overflow-x:hidden', self.css)
        self.assertNotIn('.true-love-creation>div{align-items:center;gap:11px;display:flex}', self.base_css)

    def test_all_27_approved_item_images_exist(self):
        herbs = [
            'dendrobium-officinale', 'tianshan-snow-lotus', 'three-tael-ginseng',
            'polygonum-120', 'poria-60', 'wild-ganoderma', 'sea-pearl',
            'cordyceps-sinensis', 'cistanche-deserticola',
        ]
        metals = [
            'deep-black-iron', 'millennium-cold-iron', 'fallen-star-meteor-iron',
            'moon-spirit-silver', 'solar-crow-red-gold', 'ancient-dragon-bronze',
            'azure-cloud-steel', 'purple-thunder-ore', 'earth-vein-gold-sand',
            'celestial-jade-iron',
        ]
        portal = [
            'mata-abyss-kuno', 'prisma-kristal-palung', 'tanduk-ribut-taufan',
            'genta-air-terjun-langit', 'kelopak-teratai-samudra', 'mutiara-inti-roh',
            'serpihan-ais-abadi', 'kunci-portal-laut-utuh',
        ]
        paths = (
            [ROOT / 'site/game-art/v813/herbs' / f'{name}.webp' for name in herbs] +
            [ROOT / 'site/game-art/v813/metals' / f'{name}.webp' for name in metals] +
            [ROOT / 'site/game-art/v813/portal' / f'{name}.webp' for name in portal]
        )
        self.assertEqual(len(paths), 27)
        for path in paths:
            self.assertTrue(path.is_file(), path)
            self.assertGreater(path.stat().st_size, 0, path)
            self.assertEqual(path.read_bytes()[:4], b'RIFF', path)

if __name__ == '__main__':
    unittest.main()
