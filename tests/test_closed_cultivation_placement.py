import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class ClosedCultivationPlacementTests(unittest.TestCase):
    def setUp(self):
        self.bundle = (ROOT / 'site/assets/page-B87MruAb.js').read_text(encoding='utf-8')

    def test_closed_cultivation_is_not_in_cultivation_action_stack(self):
        self.assertNotIn('Perlu bilik sendiri / gua tertutup', self.bundle)
        self.assertNotIn('onClick:Ha,disabled:!Io', self.bundle)

    def test_closed_cultivation_is_available_at_proper_locations(self):
        self.assertIn('e.id===`ketua`&&t===`Latihan tertutup di bilik sendiri`', self.bundle)
        self.assertIn('e.id===`gua`&&t===`Latihan Tertutup · 30 hari`', self.bundle)
        self.assertIn('[`ketua`,`gua`].includes(Tr)', self.bundle)
        self.assertIn('className:`grotto-closed-cultivation`', self.bundle)
        self.assertIn('onClosedCultivation:Ha', self.bundle)

if __name__ == '__main__':
    unittest.main()
