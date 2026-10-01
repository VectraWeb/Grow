import os
import glob
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRODUCTS_DIR = os.path.join(BASE_DIR, 'media', 'products')
LOGO_PATH = os.path.join(BASE_DIR, 'media', 'tierra_verde_logo_transparent.png')

SKIPPED_FILES = [
    'prod_109_hechizo-boom.webp', 'prod_110_hechizo-bloom.webp', 'prod_111_pocion-infernal.webp',
    'prod_112_pocion-impkable.webp', 'prod_113_melaca-dorada.webp', 'prod_114_lixiviado-dorado.webp',
    'prod_124_treemix-pro-200cc.webp', 'prod_133_root-house-10l.webp', 'prod_134_root-house-18l.webp',
    'prod_158_egipto.webp', 'prod_159_ananda001.webp', 'prod_160_malvina.webp', 'prod_161_guarani.webp',
    'prod_162_pasionaria-cbd.webp', 'prod_163_craig.webp', 'prod_164_tropicana-wfc.webp',
    'prod_165_bateku.webp', 'prod_166_camboya-del-chaman-roberto.webp', 'prod_167_mr-smile.webp',
    'prod_168_ak-47.webp', 'prod_187_carluccio-cocomix-70l.webp', 'prod_190_growmix-multipro-80l.webp',
    'prod_191_cultivate-premium-80l.webp', 'prod_192_cultivate-premium-25l.webp',
    'prod_193_cultivate-autofloreciente-80l.webp', 'prod_194_cultivate-autofloreciente-25l.webp',
    'prod_195_cultivate-completo-80l.webp', 'prod_196_cultivate-completo-25l.webp',
    'prod_199_cultivate-indoor-25l.webp', 'prod_205_tijeras-punta-plana.webp',
    'prod_206_tijeras-punta-curva.webp', 'prod_240_arturito-bajo.webp', 'prod_248_bolsa-siploc.webp',
    'prod_250_carpa-de-cultivo-indoor-80x80x.webp', 'prod_251_carpa-de-cultivo-indoor-100x10.webp',
    'prod_252_panel-led-quantum-board-samsun.webp', 'prod_253_lampara-led-full-spectrum-150w.webp',
    'prod_255_filtro-de-carbon-activado-anti.webp', 'prod_33_deeper-underground-100cc.webp',
    'prod_34_deeper-underground-250cc.webp', 'prod_44_top-barrier-100cc.webp',
    'prod_45_top-barrier-250cc.webp', 'prod_46_calmag-250cc.webp', 'prod_47_calmag-1000cc.webp',
    'prod_77_natural-killer-100cc.webp', 'prod_79_clonaste-30cc.webp'
]

logo_raw = Image.open(LOGO_PATH).convert('RGBA')
LOGO = logo_raw.crop(logo_raw.getbbox())

def apply_badge_to_image(img_path):
    im = Image.open(img_path).convert('RGB')
    w, h = im.size
    
    # Scale proportionally to image size
    base_dim = min(w, h)
    scale = base_dim / 320.0
    
    bw = int(150 * scale)
    bh = int(60 * scale)
    
    if bw > int(w * 0.52):
        bw = int(w * 0.52)
        scale = bw / 150.0
        bh = int(60 * scale)
        
    if bh > int(h * 0.28):
        bh = int(h * 0.28)
        scale = bh / 60.0
        bw = int(150 * scale)
    
    margin_x = max(8, int(5 * scale))
    margin_y = max(8, int(5 * scale))
    bx2 = w - margin_x
    by2 = h - margin_y
    bx1 = bx2 - bw
    by1 = by2 - bh
    
    badge = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(badge)
    
    # Ambient shadow for badge
    for off, a in [(5, 20), (3, 35), (1, 50)]:
        bdraw.rounded_rectangle([bx1, by1+off, bx2, by2+off], radius=int(22*scale), fill=(0, 0, 0, a))
    badge = badge.filter(ImageFilter.GaussianBlur(int(2.5*scale)))
    
    # Crisp white pill container with subtle green/neutral border
    bdraw_surf = ImageDraw.Draw(badge)
    bdraw_surf.rounded_rectangle(
        [bx1, by1, bx2, by2],
        radius=int(22*scale),
        fill=(255, 255, 255, 255),
        outline=(215, 225, 215, 255),
        width=max(1, int(1.2*scale))
    )
    
    # Logo on the left
    lh = int(bh * 0.84)
    lw = int(LOGO.width * (lh / LOGO.height))
    logo_s = LOGO.resize((lw, lh), Image.Resampling.LANCZOS)
    badge.paste(logo_s, (bx1 + int(14*scale), by1 + (bh - lh)//2), logo_s)
    
    # Text on the right: TIERRA VERDE / GROWSHOP
    avail_w = bx2 - (bx1 + lw + int(24*scale)) - int(12*scale)
    font_size_main = int(17 * scale)
    font_path_bold = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
    font_path_regular = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
    
    try:
        f_main = ImageFont.truetype(font_path_bold, font_size_main)
        while f_main.getbbox('TIERRA VERDE')[2] > avail_w and font_size_main > 8:
            font_size_main -= 1
            f_main = ImageFont.truetype(font_path_bold, font_size_main)
        font_size_sub = int(font_size_main * 0.65)
        f_sub = ImageFont.truetype(font_path_regular, font_size_sub)
    except Exception:
        f_main = ImageFont.load_default()
        f_sub = ImageFont.load_default()
        
    text_x = bx1 + lw + int(24 * scale)
    t1_h = f_main.getbbox('TIERRA VERDE')[3]
    t2_h = f_sub.getbbox('GROWSHOP')[3]
    spacing = int(6 * scale)
    total_text_h = t1_h + spacing + t2_h
    start_y = by1 + (bh - total_text_h) // 2
    
    bdraw_surf.text((text_x, start_y), 'TIERRA VERDE', fill=(34, 110, 48), font=f_main)
    bdraw_surf.text((text_x, start_y + t1_h + spacing), 'GROWSHOP', fill=(90, 105, 90), font=f_sub)
    
    im_rgba = im.convert('RGBA')
    final_img = Image.alpha_composite(im_rgba, badge).convert('RGB')
    
    final_img.save(img_path, 'WEBP', quality=92, method=6)
    return True

def main():
    print(f"Applying Tierra Verde badge to {len(SKIPPED_FILES)} remaining products...")
    count = 0
    for fname in SKIPPED_FILES:
        fpath = os.path.join(PRODUCTS_DIR, fname)
        if not os.path.exists(fpath):
            print(f"[-] File not found: {fname}")
            continue
        apply_badge_to_image(fpath)
        count += 1
        print(f"[{count}/{len(SKIPPED_FILES)}] Applied badge to: {fname}")
        
    print("\n" + "="*50)
    print(f"DONE! Applied badge to all {count} remaining products.")
    print("="*50)

if __name__ == '__main__':
    main()
