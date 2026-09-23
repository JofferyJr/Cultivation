import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class BrandingTests(unittest.TestCase):
    def test_player_facing_brand_is_boundless_cultivation(self):
        html = (ROOT / "site/index.html").read_text(encoding="utf-8")
        bundle = (ROOT / "site/assets/page-B87MruAb.js").read_text(encoding="utf-8")
        self.assertIn("<title>Boundless Cultivation: Dunia Xianxia</title>", html)
        self.assertIn(">Boundless Cultivation</p>", html)
        self.assertIn("Peta Dunia Boundless Cultivation", bundle)
        self.assertIn("Almanak Boundless Cultivation", bundle)

    def test_internal_save_key_remains_compatible(self):
        bundle = (ROOT / "site/assets/page-B87MruAb.js").read_text(encoding="utf-8")
        self.assertIn("jalan-dao-save", bundle)

    def test_lore_dao_path_label_is_not_renamed(self):
        bundle = (ROOT / "site/assets/page-B87MruAb.js").read_text(encoding="utf-8")
        self.assertIn("Profesion, Jalan Dao dan sifat penerima", bundle)

if __name__ == "__main__":
    unittest.main()
