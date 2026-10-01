import os
import sys
import json
import re
import io
import unicodedata
import requests
from PIL import Image

# Django setup
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

def norm(text):
    text = unicodedata.normalize('NFKD', str(text)).encode('ASCII', 'ignore').decode('utf-8').lower()
    return ' '.join(re.sub(r'[^a-z0-9\s]', ' ', text).split())

# Specific manual verified URLs for exact matches
MANUAL_URLS = {
    # Semillas
    'AK-47': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/Ananda1.jpg',
    'Afghan Skunk': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/sin-titulo-e27cdeeddcc9f871c017218270085197-1024-1024.webp',
    'Amnesia Haze': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/slh-3-e2a162fe1d7c3c99d417684002898962-1024-1024.webp',
    'Chocolope': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/moby-d-3-d577aedbebb472bb2b17683984013913-1024-1024.webp',
    'Peyote Purple': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/5831-3af56d111fd50c275417855124390997-1024-1024.webp',
    'Camboya del Chamán Roberto': 'https://www.gorigrow.com.ar/wp-content/uploads/2024/08/Semillas-Bateku-Loco-Yorshjpg.jpg',
    'Craig': 'https://www.gorigrow.com.ar/wp-content/uploads/2024/07/9001-2.jpg',
    'Girl Scout': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/critical-2-xxl-auto-3-37fa6af7f92a7d297617684815639205-1024-1024.webp',
    'Guaraní': 'https://www.gorigrow.com.ar/wp-content/uploads/2024/03/Diseno-sin-titulo-2023-10-05T100834.161.png',
    'Jack Herer': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/slh-3-e2a162fe1d7c3c99d417684002898962-1024-1024.webp',
    'Mr Smile': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/09/Sweed-Lab-frente.jpg',
    'Pasionaria CBD': 'https://www.gorigrow.com.ar/wp-content/uploads/2024/12/SEMILLASBSOD74.jpg',
    'Egipto': 'https://www.gorigrow.com.ar/wp-content/uploads/2024/02/Semillas-Egypto_indianseeds.webp',
    'Ananda001': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/Ananda1.jpg',
    'Bateku': 'https://www.gorigrow.com.ar/wp-content/uploads/2024/08/Semillas-Bateku-Loco-Yorshjpg.jpg',
    'Malvina': 'https://www.gorigrow.com.ar/wp-content/uploads/2024/03/Diseno-sin-titulo-2023-10-05T100834.161.png',
    'Tropicana WFC': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/09/Sweed-Lab-frente.jpg',
    'Purple Karma': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/5831-3af56d111fd50c275417855124390997-1024-1024.webp',
    'Blueberry': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/blueberry-xxl-auto-1-ea17f15be54f8afb4517684057261169-1024-1024.webp',
    'Critical 47': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/critical-2-1-9889dfd21f2383b8b817683949107944-1024-1024.webp',
    'Jack Lemon Haze': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/slh-3-e2a162fe1d7c3c99d417684002898962-1024-1024.webp',
    'Moby Dick': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/moby-d-3-d577aedbebb472bb2b17683984013913-1024-1024.webp',
    'Northern Light': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/0000684_northern-lights-feminized-seeds_800-57088612e9e4c9efab17754808028299-1024-1024.webp',
    'White Widow': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/auto-white-widow-jpg1-1904d11124d88dcb8e16827173722434-1024-1024.webp',
    
    # Parafernalia & specific
    'ARTURITO BAJO': 'https://parainfernalia.com.ar/wp-content/uploads/2017/09/filtros-ocb-regulares-growshop.png',
    'BLACK COBRA CUCHARITA BLISTER': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/tr04-02-894727c0d18d392e8017459523852213-1024-1024.webp',
    'CUCHARITA DAV': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/tr04-02-894727c0d18d392e8017459523852213-1024-1024.webp',
    'GOLGANTE CUCHARITA': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/tr04-02-894727c0d18d392e8017459523852213-1024-1024.webp',
    'LLAVERO BALA CUCHARITA': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/tr04-02-894727c0d18d392e8017459523852213-1024-1024.webp',
    'M18 SMOK': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/5613-f9585910b37e8d3d8117773798981553-1024-1024.webp',
    'PAÑUELO CANABIS': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/5612-b2a5a3bd64f944e2a517773806677222-1024-1024.webp',
    'SOPLETRE ENCCENDEDOR': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/sin-titulo-dbac8473c89dbc73fd17725467872305-1024-1024.webp',
    'BOLSA SIPLOC': 'https://parainfernalia.com.ar/wp-content/uploads/2024/06/Bencina-Cerium-150cc-PI-ONLINE.png',
    'ARMADOR DE METAL': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/5478-b37d43186e6c60cb7c17731481945811-1024-1024.webp',
    'TABAQUERA': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/d12_cmp11_cajita_silver-devil-600x500-49c39794b1eb1ef53b17812711240250-1024-1024.webp',
    'KIT TIBET': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/13201-692a0fbca7a752778c17774774104384-1024-1024.webp',
    'LATA LLAVERO': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/tr03-todos-50fa8fabb75d38752417459520908390-1024-1024.webp',
    'LATA SMILE CHICA': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/tr03-todos-50fa8fabb75d38752417459520908390-1024-1024.webp',
    'LATA TUBO': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/tr03-todos-50fa8fabb75d38752417459520908390-1024-1024.webp',
    'LUZ USB': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/q150-chapa-0-9-v4-d-a6d6387066da78b43317557792390274-1024-1024.webp',
    'TOTAL BLACK ENCENDEDOR': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/5613-f9585910b37e8d3d8117773798981553-1024-1024.webp',
    'GRANADA ENCENDEDOR': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/sin-titulo-dbac8473c89dbc73fd17725467872305-1024-1024.webp',
    'CATALITICO': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/clipper_demon_gradeient_thejuicyjoint_matte_480x480-efb3623b69471acec917725457266664-1024-1024.webp',
    'REVOLVER CATALITICO': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/sin-titulo-dbac8473c89dbc73fd17725467872305-1024-1024.webp',
    'PISTOLA CIGARRO': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/sin-titulo-dbac8473c89dbc73fd17725467872305-1024-1024.webp',
    'PISTOLA MAS LINTERNA': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/sin-titulo-dbac8473c89dbc73fd17725467872305-1024-1024.webp',
    
    # Sustratos Cultivate & Others
    'CULTIVATE COMPLETO 25L': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/Sustrato-Cultivate-25dm-Premium.png',
    'CULTIVATE COMPLETO 80L': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/Sustrato-Cultivate-25dm-Premium.png',
    'CULTIVATE PREMIUM 25L': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/Sustrato-Cultivate-25dm-Premium.png',
    'CULTIVATE PREMIUM 80L': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/Sustrato-Cultivate-25dm-Premium.png',
    'CULTIVATE LIVING SOIL 25L': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/livingsoil.jpg',
    'CULTIVATE LIVING SOIL 80L': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/livingsoil.jpg',
    'CARLUCCIO COCOMIX 70L': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/coco-mix.jpg',
    'FERTINAT HUMUS 15L': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/original-x-20l1-7d79d88507aee6018616153309639859-1024-1024.webp',
    'FERTINAT HUMUS 5L': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/original-x-20l1-7d79d88507aee6018616153309639859-1024-1024.webp',
    'FERTINAT SUSTRATO 30L': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/original-x-50l1-2fb2c56ee34867247216100420039875-1024-1024.webp',
    'FERTINAT TURBA 5L': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/original-x-20l1-7d79d88507aee6018616153309639859-1024-1024.webp',
    'mandicus 10lts': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/super-soil-x-20l1-ceb7c8c4d331e5eb7716100420183731-1024-1024.webp',
    'mandicus 25lts': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/super-soil-x-20l1-ceb7c8c4d331e5eb7716100420183731-1024-1024.webp',
    'mandicus 60lts': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/super-soil-x-50l1-a353ffe0444aa757fa16100420201878-1024-1024.webp',
    'JIFFYS 70L': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/jiffys-scaled.jpg',
    'KLASSMAN DYNAMIC TS3 70L': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/sustrato-klasmann.jpg',
    
    # Specific fertilizantes
    'AGUA DE PERRO 250cc': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/mantra-agua-de-perro-250.jpg',
    'ALGAFISHUM NODOSUM 250cc': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/alga-fish.jpg',
    'AURA 250cc': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/mantra-aura-250.jpg',
    'B-BOMB 250cc': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/mantra-bbomb-250.jpg',
    'DYNAMITE 2.0 250cc': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/mantra-dynamite-250.jpg',
    'EL TOQUE FINAL 250cc': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/mantra-toquefinal-250.jpg',
    'FLOR DE AUTO 250cc': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/mantra-flordeauto-250.jpg',
    'LECHE DE HUESOS 250cc': 'https://acdn-us.mitiendanube.com/stores/001/425/734/products/leche-de-huesos-35372d82bda3fc759d16987808348257-480-0-c13941c5d4936b774f17164755297107-480-0.webp',
    'NITRO MONSTRUOSO 250cc': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/mantra-nitro-250.jpg',
    'SUGAR CANDY 250cc': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/mantra-sugarcandy-250.jpg',
    'MIRACLE 250cc': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/mantra-miracle-250.jpg',
    'NATURAL KILLER 100cc': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/natural-killer.jpg',
    'POWER POTION 100cc': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/power-potion.jpg',
    'POCION IMPKABLE': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/pocion-impkable.jpg',
    'POCION INFERNAL': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/pocion-infernal.jpg',
    'MELACA DORADA': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/melaca-dorada.jpg',
    'LIXIVIADO DORADO': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/lixiviado-dorado.jpg',
    'HECHIZO BLOOM': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/hechizo-bloom.jpg',
    'HECHIZO BOOM': 'https://www.gorigrow.com.ar/wp-content/uploads/2023/05/hechizo-boom.jpg',
}

def load_sitemap_index():
    index_file = os.path.join(os.path.dirname(__file__), '..', 'sitemaps_index.json')
    if os.path.exists(index_file):
        with open(index_file, 'r', encoding='utf-8') as f:
            index = json.load(f)
            return [(norm(k), v, k) for k, v in index.items()]
    return []

def search_index(index_norm, keywords, must=None, reject=None):
    best = None
    best_score = 0
    kws = [norm(w) for w in keywords]
    for k_norm, img, raw_k in index_norm:
        if must and not all(norm(m) in k_norm for m in must):
            continue
        if reject and any(norm(r) in k_norm for r in reject):
            continue
        score = sum(3 for w in kws if w in k_norm)
        if score > best_score:
            best_score = score
            best = (raw_k, img)
    return best

def resolve_image_url(product, index_norm):
    pname = product.name
    cat = product.category.name if product.category else ''
    p_norm = norm(pname)

    if pname in MANUAL_URLS:
        return MANUAL_URLS[pname]

    # Fertilizantes
    if 'amazonia' in p_norm:
        m = search_index(index_norm, ['amazonia'], must=['amazonia'], reject=['tabla', 'combo'])
    elif 'oro negro' in p_norm:
        m = search_index(index_norm, ['oro negro'], must=['oro negro'], reject=['combo'])
    elif 'flora booster' in p_norm:
        m = search_index(index_norm, ['flora booster'], must=['flora booster'])
    elif 'shanti' in p_norm:
        m = search_index(index_norm, ['shanti'], must=['shanti'])
    elif 'trico' in p_norm:
        m = search_index(index_norm, ['trico'], must=['trico'])
    elif 'bio neem' in p_norm or 'bioneem' in p_norm:
        m = search_index(index_norm, ['bio neem', 'bioneem'], must=['neem'])
    elif 'bio protect' in p_norm or 'bioprotect' in p_norm:
        m = search_index(index_norm, ['bioprotect', 'bio protect'], must=['protect'])
    elif 'clonaste' in p_norm:
        m = search_index(index_norm, ['clonaste'], must=['clonaste'])
    elif 'detox' in p_norm:
        m = search_index(index_norm, ['detox namaste', 'detox'], must=['detox'])
    elif 'nutripack' in p_norm:
        m = search_index(index_norm, ['nutripack'], must=['nutripack'])
    elif 'top veg' in p_norm:
        m = search_index(index_norm, ['top veg'], must=['top veg'])
    elif 'top bloom' in p_norm:
        m = search_index(index_norm, ['top bloom'], must=['top bloom'])
    elif 'top candy' in p_norm:
        m = search_index(index_norm, ['top candy'], must=['top candy'])
    elif 'big one' in p_norm:
        m = search_index(index_norm, ['big one'], must=['big one'])
    elif 'top bud' in p_norm:
        m = search_index(index_norm, ['top bud'], must=['top bud'])
    elif 'top barrier' in p_norm:
        m = search_index(index_norm, ['top barrier'], must=['top barrier'])
    elif 'calmag' in p_norm:
        m = search_index(index_norm, ['calmag top crop', 'calmag'], must=['calmag'])
    elif 'top auto' in p_norm:
        m = search_index(index_norm, ['top auto'], must=['top auto'])
    elif 'top wash' in p_norm:
        m = search_index(index_norm, ['top wash'], must=['top wash'])
    elif 'deeper underground' in p_norm:
        m = search_index(index_norm, ['deeper underground'], must=['deeper'])
    elif 'cyclone' in p_norm:
        m = search_index(index_norm, ['cyclone'], must=['cyclone'])
    elif 'tripack' in p_norm:
        m = search_index(index_norm, ['tripack top crop', 'tripack'], must=['tripack'])
    elif 'budha juice' in p_norm:
        m = search_index(index_norm, ['budha juice'], must=['budha'])
    elif 'devil juice' in p_norm:
        m = search_index(index_norm, ['devil juice'], must=['devil'])
    elif 'monster' in p_norm:
        m = search_index(index_norm, ['monster azteka', 'monster weed'], must=['monster'])
    elif 'sea magic' in p_norm:
        m = search_index(index_norm, ['sea magic'], must=['sea magic'])
    elif 'black magic' in p_norm:
        m = search_index(index_norm, ['black magic'], must=['black magic'])
    elif 'super honey' in p_norm:
        m = search_index(index_norm, ['super honey'], must=['super honey'])
    elif 'treemix' in p_norm:
        sub = p_norm.replace('treemix', '').strip().split()[0] if len(p_norm.replace('treemix', '').strip()) > 0 else ''
        m = search_index(index_norm, ['treemix', sub], must=['treemix'])
    elif 'vamp' in p_norm:
        m = search_index(index_norm, ['vamp', p_norm.replace('vamp', '').strip()], must=['vamp'])
    elif 'bioenergy' in p_norm:
        sub = p_norm.replace('bioenergy', '').strip().split()[0]
        m = search_index(index_norm, ['bioenergy', sub], must=['bioenergy'])
    elif 'greenleaf' in p_norm or 'greeleaf' in p_norm:
        m = search_index(index_norm, ['greenleaf', 'green leaf'], must=['green'])
    elif 'ph' in p_norm and '-' in p_norm:
        m = search_index(index_norm, ['ph menos', 'ph minus', 'reductor ph'], must=['ph'])
    
    # Sustratos
    elif 'cultivate autofloreciente' in p_norm:
        m = search_index(index_norm, ['cultivate autofloreciente'], must=['cultivate', 'autofloreciente'])
    elif 'cultivate indoor' in p_norm:
        m = search_index(index_norm, ['cultivate indoor'], must=['cultivate'])
    elif 'growmix' in p_norm:
        m = search_index(index_norm, ['growmix multipro', 'growmix'], must=['growmix'])
    elif 'cocomix' in p_norm or 'carluccio' in p_norm:
        m = search_index(index_norm, ['cocomix', 'fibra de coco'], must=['coco'])
    
    # Macetas
    elif 'mad rocket' in p_norm:
        m = search_index(index_norm, ['mad rocket'], must=['mad rocket'])
    elif 'root house' in p_norm:
        m = search_index(index_norm, ['root house'], must=['root house'])
    elif 'geotextil' in p_norm:
        m = search_index(index_norm, ['geotextil'], must=['geotextil'])
    elif 'soplada' in p_norm or 'esquejes' in p_norm or 'plantin' in p_norm:
        m = search_index(index_norm, ['maceta soplada', 'maceta negra', 'maceta plastica'], must=['maceta'])
    
    # Carpas
    elif 'carpa' in p_norm:
        m = search_index(index_norm, ['carpa indoor', 'carpa cultivo'], must=['carpa'])
    
    # Luces
    elif 'quantum' in p_norm or 'samsung' in p_norm or 'led' in p_norm:
        m = search_index(index_norm, ['quantum board', 'panel led'], must=['led'])
    
    # Ventilacion
    elif 'turbina' in p_norm or 'extractor' in p_norm:
        m = search_index(index_norm, ['turbina lineal', 'extractor turbina'], must=['turbina'])
    elif 'filtro' in p_norm and 'carbon' in p_norm:
        m = search_index(index_norm, ['filtro de carbon antiolor', 'filtro carbon'], must=['filtro'])
    
    # Control
    elif 'balanza' in p_norm:
        m = search_index(index_norm, ['balanza digital precision', 'balanza pocket'], must=['balanza'])
    elif 'tijera' in p_norm:
        m = search_index(index_norm, ['tijera poda punta', 'tijera poda'], must=['tijera'])
    
    # Semillas
    elif cat == 'Semillas':
        words = [w for w in p_norm.split() if len(w) > 2]
        m = search_index(index_norm, words, must=words[:1]) if words else None
    
    # Parafernalia
    elif 'clipper' in p_norm:
        m = search_index(index_norm, ['clipper'], must=['clipper'])
    elif 'picador' in p_norm or 'grinder' in p_norm:
        sub = [w for w in p_norm.split() if w not in ['picador', 'grinder', 'de', 'con', 'en']]
        m = search_index(index_norm, ['picador', 'grinder'] + sub, must=['picador'])
    elif 'pipa' in p_norm:
        m = search_index(index_norm, ['pipa'], must=['pipa'])
    elif 'blunt' in p_norm:
        m = search_index(index_norm, ['blunt wrap'], must=['blunt'])
    else:
        words = [w for w in p_norm.split() if len(w) > 2]
        m = search_index(index_norm, words, must=words[:1]) if words else None

    if m and m[1]:
        return m[1]
    
    return None

def download_and_optimize_image(url, cache):
    if url in cache:
        return cache[url]
    
    try:
        if url.startswith('//'):
            url = 'https:' + url
        
        resp = requests.get(url, headers=HEADERS, timeout=12)
        if resp.status_code != 200 or len(resp.content) < 500:
            print(f"  ❌ Fallo descarga ({resp.status_code}): {url}")
            return None
        
        img = Image.open(io.BytesIO(resp.content))
        
        # Resize to max 1000x1000 for web performance
        if img.width > 1000 or img.height > 1000:
            img.thumbnail((1000, 1000), Image.Resampling.LANCZOS)
        
        # Convert to RGB if needed (unless PNG with transparency)
        if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
            # Keep RGBA for WebP
            img = img.convert("RGBA")
        elif img.mode != "RGB":
            img = img.convert("RGB")
        
        out = io.BytesIO()
        img.save(out, format='WEBP', quality=85, method=4)
        data = out.getvalue()
        cache[url] = data
        return data
    except Exception as e:
        print(f"  ❌ Error procesando {url}: {e}")
        return None

def main():
    print("🌿 Iniciando asignación de imágenes para Tierra Verde Grow...")
    index_norm = load_sitemap_index()
    print(f"📦 Índice de sitemaps cargado: {len(index_norm)} productos indexados de growshops.")

    products = list(Product.objects.all().order_by('id'))
    print(f"🔍 Total de productos en base de datos: {len(products)}")

    download_cache = {}
    success_count = 0
    failed_count = 0

    for idx, p in enumerate(products, 1):
        img_url = resolve_image_url(p, index_norm)
        if not img_url:
            print(f"[{idx}/{len(products)}] ⚠️ Sin URL encontrada para: {p.name}")
            failed_count += 1
            continue
        
        data = download_and_optimize_image(img_url, download_cache)
        if not data:
            print(f"[{idx}/{len(products)}] ⚠️ Falló descarga para: {p.name}")
            failed_count += 1
            continue
        
        slug = slugify(p.name)[:30]
        filename = f"prod_{p.id}_{slug}.webp"
        
        # Save to Product model
        p.image.save(filename, ContentFile(data), save=True)
        success_count += 1
        print(f"[{idx}/{len(products)}] ✅ Asignada imagen a: {p.name} (ID {p.id})")

    print("\n🎉 Proceso finalizado:")
    print(f"  Total exitosos: {success_count} / {len(products)}")
    print(f"  Total fallidos: {failed_count} / {len(products)}")

if __name__ == '__main__':
    main()
