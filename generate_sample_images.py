import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

def create_sample_images():
    out_dirs = [
        os.path.join("static", "images"),
        os.path.join("public", "static", "images")
    ]
    for d in out_dirs:
        os.makedirs(d, exist_ok=True)

    size = (320, 320)

    # 1. Healthy Palm Leaf (Vibrant green, high chlorophyll)
    img = Image.new('RGB', size, (34, 139, 34))
    draw = ImageDraw.Draw(img)
    for i in range(0, 320, 16):
        draw.line([(i, 0), (i + 40, 320)], fill=(46, 175, 46), width=8)
        draw.line([(0, i), (320, i + 20)], fill=(30, 120, 30), width=4)
    img = img.filter(ImageFilter.GaussianBlur(1))
    for d in out_dirs:
        img.save(os.path.join(d, "sample_healthy.jpg"), "JPEG", quality=95)

    # 2. Koleroga (Mahali - dark water-soaked rot on arecanut bunch)
    img = Image.new('RGB', size, (45, 75, 40))
    draw = ImageDraw.Draw(img)
    # Arecanuts
    for (cx, cy) in [(100, 120), (180, 100), (220, 170), (140, 200), (190, 240)]:
        draw.ellipse([cx-45, cy-45, cx+45, cy+45], fill=(30, 48, 25), outline=(15, 25, 12), width=3)
        # Water-soaked decaying dark patches
        draw.ellipse([cx-25, cy-25, cx+20, cy+20], fill=(20, 25, 18))
        draw.ellipse([cx-10, cy-10, cx+15, cy+15], fill=(210, 215, 210)) # white mycelial felt
    img = img.filter(ImageFilter.GaussianBlur(1))
    for d in out_dirs:
        img.save(os.path.join(d, "sample_koleroga.jpg"), "JPEG", quality=95)

    # 3. Yellow Leaf Disease (Severe chlorosis, bright golden yellowing)
    img = Image.new('RGB', size, (235, 195, 25))
    draw = ImageDraw.Draw(img)
    for i in range(0, 320, 18):
        draw.line([(i, 0), (i + 50, 320)], fill=(255, 220, 40), width=9)
        draw.line([(i, 50), (i + 20, 320)], fill=(190, 150, 15), width=5)
    # Green tips turning necrotic brown
    draw.polygon([(0, 270), (320, 270), (320, 320), (0, 320)], fill=(120, 80, 20))
    img = img.filter(ImageFilter.GaussianBlur(1))
    for d in out_dirs:
        img.save(os.path.join(d, "sample_yellow_leaf.jpg"), "JPEG", quality=95)

    # 4. Bud Rot (Spindle necrosis, central decay)
    img = Image.new('RGB', size, (50, 95, 45))
    draw = ImageDraw.Draw(img)
    # Central rotting spindle leaf
    draw.polygon([(140, 0), (180, 0), (200, 320), (120, 320)], fill=(30, 22, 18))
    # Soft necrotic decay
    draw.ellipse([110, 100, 210, 260], fill=(22, 16, 12))
    img = img.filter(ImageFilter.GaussianBlur(1))
    for d in out_dirs:
        img.save(os.path.join(d, "sample_bud_rot.jpg"), "JPEG", quality=95)

    # 5. Stem Bleeding (Trunk bark fissures with dark reddish-brown rust exudate)
    img = Image.new('RGB', size, (110, 75, 45))
    draw = ImageDraw.Draw(img)
    for i in range(0, 320, 12):
        draw.line([(i, 0), (i, 320)], fill=(90, 55, 30), width=4)
    # Bleeding oozing fissures
    for (fx, fy) in [(100, 80), (160, 140), (220, 210), (140, 250)]:
        draw.line([(fx, fy), (fx + 5, fy + 70)], fill=(160, 45, 20), width=10)
        draw.ellipse([fx-8, fy+50, fx+15, fy+85], fill=(140, 35, 15))
    img = img.filter(ImageFilter.GaussianBlur(1))
    for d in out_dirs:
        img.save(os.path.join(d, "sample_stem_bleeding.jpg"), "JPEG", quality=95)

    # 6. Leaf Spot (Discrete necrotic spots with chlorotic haloes)
    img = Image.new('RGB', size, (55, 140, 45))
    draw = ImageDraw.Draw(img)
    for i in range(0, 320, 20):
        draw.line([(i, 0), (i + 40, 320)], fill=(70, 165, 55), width=8)
    # Random necrotic circular spots
    spots = [
        (60, 70, 18), (140, 50, 12), (230, 90, 22), (90, 160, 15),
        (180, 180, 25), (260, 170, 14), (110, 260, 20), (210, 250, 16)
    ]
    for (sx, sy, r) in spots:
        # Yellow chlorotic halo
        draw.ellipse([sx-r-6, sy-r-6, sx+r+6, sy+r+6], fill=(225, 205, 50))
        # Dark necrotic center
        draw.ellipse([sx-r, sy-r, sx+r, sy+r], fill=(60, 35, 20))
        draw.ellipse([sx-r+4, sy-r+4, sx+r-4, sy+r-4], fill=(130, 75, 40))
    img = img.filter(ImageFilter.GaussianBlur(1))
    for d in out_dirs:
        img.save(os.path.join(d, "sample_leaf_spot.jpg"), "JPEG", quality=95)

    print("[SUCCESS] All 6 high-resolution JPEG sample images generated successfully!")

if __name__ == "__main__":
    create_sample_images()
