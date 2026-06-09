"""Генерация QR-кода визитки в assets/vizitka-qr.png"""
import re
import sys
from pathlib import Path

try:
    import qrcode
    from qrcode.constants import ERROR_CORRECT_H
except ImportError:
    print("Установите зависимость: pip install qrcode[pil]")
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "config.js"
OUTPUT = ROOT / "assets" / "vizitka-qr.png"


def read_url_from_config() -> str:
    text = CONFIG.read_text(encoding="utf-8")
    seo_block = re.search(r"seo:\s*\{([^}]+)\}", text, re.DOTALL)
    if not seo_block:
        return ""
    match = re.search(r'url:\s*"([^"]*)"', seo_block.group(1))
    if match and match.group(1).strip():
        return match.group(1).strip()
    return ""


def main() -> None:
    url = read_url_from_config()
    if not url:
        url = "http://localhost:3456/index.html"
        print(f"seo.url не задан — QR ведёт на локальный адрес: {url}")
        print("После публикации укажите URL в config.js и перезапустите скрипт.")

    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_H,
        box_size=12,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#0A2463", back_color="#FFFFFF")
    img = img.resize((1024, 1024))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUTPUT, format="PNG")
    print(f"QR сохранён: {OUTPUT}")
    print(f"Ссылка в QR: {url}")


if __name__ == "__main__":
    main()
