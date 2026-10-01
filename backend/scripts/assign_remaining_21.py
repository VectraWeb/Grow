import os
import sys
import io
import requests
from PIL import Image

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'grow_saas.settings')
import django
django.setup()

from django.core.files.base import ContentFile
from django.utils.text import slugify
from apps.inventory.models import Product

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
    'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
}

EXACT_REMAINING = {
    'AGUA DE PERRO 250cc': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/7fdfd44ec75247e56a5ee535c5b9d291f3f144a4a6e20d491295fb4c1d305a70125670-cf6f718ba6153832e017099021582997-1024-1024.webp',
    'NITRO MONSTRUOSO 250cc': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/2661-28bd6cc01b8f556f9f16100450203088-1024-1024.webp',
    'ALGAFISHUM NODOSUM 250cc': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/17361-ee7f26c3f2ec9efb2516100475212016-1024-1024.webp',
    'DYNAMITE 2.0 250cc': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/2671-da518bd1eb1f64c5e916100450241081-1024-1024.webp',
    'SUGAR CANDY 250cc': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/2651-b47e3f456398c5ccd616100448311006-1024-1024.webp',
    'EL TOQUE FINAL 250cc': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/2631-79cc7b6e866637f87716100448282721-1024-1024.webp',
    'FLOR DE AUTO 250cc': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/2641-3562df0e89f71b4abf16100448301128-1024-1024.webp',
    'AURA 250cc': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/2-1910149992a8b251cb16992764493213-1024-1024-3250718ceecf8432b317105109682898-1024-1024.webp',
    'B-BOMB 250cc': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/b-bomb-azteka-78fec61bc00d7ab3b817105112026575-1024-1024.webp',
    'MIRACLE 250cc': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/15311-25e4d1d667d830fee616100436070500-1024-1024.webp',
    'NATURAL KILLER 100cc': 'https://acdn-us.mitiendanube.com/stores/003/130/553/products/diseno-sin-titulo-5-71032c678cd1d5b20c16976750041274-1024-1024.webp',
    'POWER POTION 100cc': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/azteca26-jpg-51b3fa72399590a3a517192363523479-1024-1024.webp',
    'HECHIZO BOOM': 'https://acdn-us.mitiendanube.com/stores/003/130/553/products/vamp-hechizo-boom-500ml1-122738aa3ade8f7a8316876405113795-1024-1024.webp',
    'HECHIZO BLOOM': 'https://acdn-us.mitiendanube.com/stores/003/130/553/products/vamp-hechizo-bloom-500ml1-58a9a42426038768b516876404972594-1024-1024.webp',
    'POCION INFERNAL': 'https://acdn-us.mitiendanube.com/stores/003/130/553/products/vamp-pocion-infernal-500ml1-d257ca5fe6c0f92a6816876404949565-1024-1024.webp',
    'POCION IMPKABLE': 'https://acdn-us.mitiendanube.com/stores/003/130/553/products/vamp-pocion-impkble-500ml1-7db9abec1c557074e916876404925742-1024-1024.webp',
    'LIXIVIADO DORADO': 'https://acdn-us.mitiendanube.com/stores/003/130/553/products/lixiviadodorado1-f083232c7efb89f77616876392642861-1024-1024.webp',
    'KLASSMAN DYNAMIC TS3 70L': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/14131-91c3573a3e84ce4fa616115996264183-1024-1024.webp',
    'JIFFYS 70L': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/561-499a08481251a24efe15887252342532-1024-1024-061876d3dfb8f9a45417017881346179-1024-1024.webp',
    'CULTIVATE LIVING SOIL 25L': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/super-soil-x-20l1-ceb7c8c4d331e5eb7716100420183731-1024-1024.webp',
    'CULTIVATE LIVING SOIL 80L': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/super-soil-x-50l1-a353ffe0444aa757fa16100420201878-1024-1024.webp',
}

def download_and_optimize(url):
    try:
        resp = requests.get(url, headers=HEADERS, timeout=12)
        if resp.status_code != 200 or len(resp.content) < 500:
            print(f"  ❌ Fallo descarga ({resp.status_code}): {url}")
            return None
        img = Image.open(io.BytesIO(resp.content))
        if img.width > 1000 or img.height > 1000:
            img.thumbnail((1000, 1000), Image.Resampling.LANCZOS)
        if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
            img = img.convert("RGBA")
        elif img.mode != "RGB":
            img = img.convert("RGB")
        out = io.BytesIO()
        img.save(out, format='WEBP', quality=85, method=4)
        return out.getvalue()
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return None

def main():
    print("🌿 Asignando imágenes para los productos pendientes...")
    cache = {}
    done = 0
    for name, url in EXACT_REMAINING.items():
        prods = Product.objects.filter(name=name)
        if not prods.exists():
            print(f"⚠️ No encontrado en BD: {name}")
            continue
        
        if url not in cache:
            data = download_and_optimize(url)
            if not data:
                continue
            cache[url] = data
        else:
            data = cache[url]
        
        for p in prods:
            slug = slugify(p.name)[:30]
            filename = f"prod_{p.id}_{slug}.webp"
            p.image.save(filename, ContentFile(data), save=True)
            done += 1
            print(f"✅ Asignado: {p.name} (ID {p.id})")

    print(f"\n🎉 Completados {done} productos pendientes.")

if __name__ == '__main__':
    main()
