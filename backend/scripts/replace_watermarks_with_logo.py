import os
import glob
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRODUCTS_DIR = os.path.join(BASE_DIR, 'media', 'products')
LOGO_PATH = os.path.join(BASE_DIR, 'media', 'tierra_verde_logo_transparent.png')

# Load and crop Tierra Verde logo to tight bounding box
logo_raw = Image.open(LOGO_PATH).convert('RGBA')
LOGO = logo_raw.crop(logo_raw.getbbox())

def detect_and_replace_watermark(img_path):
    im = Image.open(img_path).convert('RGB')
    arr = np.array(im)
    h, w, _ = arr.shape
    
    # Bottom 35% and right 50%
    y0 = int(h * 0.65)
    x0 = int(w * 0.50)
    sub = arr[y0:, x0:, :]
    
    cyan = (sub[:, :, 0] < 80) & (sub[:, :, 1] > 155) & (sub[:, :, 2] > 155)
    cyan_uint8 = cyan.astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 7))
    dilated = cv2.dilate(cyan_uint8, kernel, iterations=2)
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(dilated)
    
    best = None
    for i in range(1, num_labels):
        x, y, cw, ch, area = stats[i]
        c_x2 = x + x0 + cw
        c_y2 = y + y0 + ch
        ratio = cw / max(1, ch)
        w_pct = cw / w
        if c_x2 > 0.80 * w and c_y2 > 0.80 * h and 2.0 <= ratio <= 4.2 and 0.20 <= w_pct <= 0.45 and area > 1000:
            if best is None or area > best[4]:
                best = (x + x0, y + y0, c_x2, c_y2, area, cw, ch)
                
    if not best:
        return False, "No watermark detected"
        
    c_x1, c_y1, c_x2, c_y2, area, cw, ch = best
    
    # Get exact undilated bounds
    raw_sub = cyan_uint8[max(0, c_y1-y0):min(sub.shape[0], c_y2-y0), max(0, c_x1-x0):min(sub.shape[1], c_x2-x0)]
    ry, rx = np.where(raw_sub > 0)
    if len(ry) > 0:
        c_x1 = rx.min() + c_x1
        c_y1 = ry.min() + c_y1
        c_x2 = rx.max() + c_x1
        c_y2 = ry.max() + c_y1
        cw = c_x2 - c_x1
        ch = c_y2 - c_y1
        
    scale = cw / 102.0
    
    # Calculated watermark extent
    wm_x1 = max(0, int(c_x1 - 38 * scale))
    wm_y1 = max(0, int(c_y1 - 25 * scale))
    wm_x2 = min(w, int(c_x2 + 20 * scale))
    wm_y2 = min(h, int(c_y2 + 28 * scale))
    
    # 1. Fill the watermark rectangle with white so no trace shows through
    draw = ImageDraw.Draw(im)
    draw.rectangle([wm_x1, wm_y1, wm_x2, wm_y2], fill=(255, 255, 255))
    
    # 2. Build the Tierra Verde pill badge
    pad = int(6 * scale)
    bx1 = max(0, wm_x1 - pad)
    by1 = max(0, wm_y1 - pad)
    bx2 = min(w - 12, wm_x2 + pad)
    by2 = min(h - 12, wm_y2 + pad)
    bw = bx2 - bx1
    bh = by2 - by1
    
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
        while f_main.getbbox('TIERRA VERDE')[2] > avail_w and font_size_main > 10:
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
    
    # Save back to same file as WebP
    final_img.save(img_path, 'WEBP', quality=92, method=6)
    return True, f"Replaced (scale={scale:.2f})"

def main():
    files = sorted(glob.glob(os.path.join(PRODUCTS_DIR, '*.webp')))
    print(f"Total product images to inspect: {len(files)}")
    
    replaced = 0
    skipped = 0
    
    for f in files:
        fname = os.path.basename(f)
        success, msg = detect_and_replace_watermark(f)
        if success:
            replaced += 1
            print(f"[{replaced}] REPLACED: {fname} -> {msg}")
        else:
            skipped += 1
            print(f"[-] SKIPPED: {fname} ({msg})")
            
    print("\n" + "="*50)
    print(f"SUMMARY: {replaced} images updated with Tierra Verde branding.")
    print(f"         {skipped} images had no watermark and were left clean.")
    print("="*50)

if __name__ == '__main__':
    main()
