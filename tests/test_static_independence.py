import tempfile
import unittest
from pathlib import Path

from tools.audit_static_runtime import audit_runtime


class StaticAuditTests(unittest.TestCase):
    def test_clean_static_site_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'index.html').write_text('<script src="/Cultivation/assets/app.js"></script>', encoding='utf-8')
            (root / 'assets').mkdir()
            (root / 'assets/app.js').write_text('console.log("ok")', encoding='utf-8')
            self.assertEqual(audit_runtime(root), [])

    def test_sitegpt_iframe_redirect_and_fetch_are_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'index.html').write_text('''<iframe src="https://jalan-dao-xianxia.jofferyjr.chatgpt.site"></iframe>
<meta http-equiv="refresh" content="0; url=https://example.com">''', encoding='utf-8')
            (root / 'app.js').write_text('fetch("https://jalan-dao-xianxia.jofferyjr.chatgpt.site/api")', encoding='utf-8')
            errors = audit_runtime(root)
            joined = '\n'.join(errors)
            self.assertIn('chatgpt.site', joined)
            self.assertIn('iframe', joined)
            self.assertIn('refresh', joined)


if __name__ == '__main__':
    unittest.main()
