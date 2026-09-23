import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class V815ItemArtTests(unittest.TestCase):
    def test_all_27_canonical_item_art_mappings_are_embedded(self):
        source = (ROOT / "site/v815-item-assets.js").read_text(encoding="utf-8")
        paths = re.findall(r'"(/game-art/v813/(?:herbs|metals|portal)/[^"]+\.webp)"', source)
        self.assertEqual(len(paths), 27)
        self.assertEqual(len(set(paths)), 27)
        self.assertEqual(sum("/herbs/" in p for p in paths), 9)
        self.assertEqual(sum("/metals/" in p for p in paths), 10)
        self.assertEqual(sum("/portal/" in p for p in paths), 8)
        self.assertGreaterEqual(source.count("data:image/webp;base64,"), 27)

    def test_item_art_is_loaded_before_the_app_module(self):
        html = (ROOT / "site/index.html").read_text(encoding="utf-8")
        self.assertLess(
            html.index("/Cultivation/v815-item-assets.js"),
            html.index('id="_R_"'),
        )

if __name__ == "__main__":
    unittest.main()
