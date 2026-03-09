#!/usr/bin/env python3
"""
Script pour générer les assets de l'application mobile KAMA
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Couleurs KAMA
KAMA_BLUE = (11, 61, 145)  # #0B3D91
KAMA_GOLD = (201, 162, 39)  # #C9A227
WHITE = (255, 255, 255)

ASSETS_DIR = "/app/mobile/assets"

def create_icon(size, filename):
    """Créer une icône avec le logo KAMA"""
    img = Image.new('RGBA', (size, size), KAMA_BLUE)
    draw = ImageDraw.Draw(img)
    
    # Cercle doré au centre
    margin = size // 6
    circle_bbox = [margin, margin, size - margin, size - margin]
    draw.ellipse(circle_bbox, fill=KAMA_GOLD)
    
    # Lettre K au centre
    font_size = size // 3
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    text = "K"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - size // 20
    draw.text((x, y), text, fill=KAMA_BLUE, font=font)
    
    img.save(os.path.join(ASSETS_DIR, filename))
    print(f"✅ Créé: {filename} ({size}x{size})")

def create_splash(width, height, filename):
    """Créer l'écran de splash"""
    img = Image.new('RGBA', (width, height), KAMA_BLUE)
    draw = ImageDraw.Draw(img)
    
    # Logo au centre
    logo_size = min(width, height) // 4
    center_x = width // 2
    center_y = height // 2 - height // 10
    
    # Cercle doré
    circle_bbox = [
        center_x - logo_size // 2,
        center_y - logo_size // 2,
        center_x + logo_size // 2,
        center_y + logo_size // 2
    ]
    draw.ellipse(circle_bbox, fill=KAMA_GOLD)
    
    # Lettre K
    font_size = logo_size // 2
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    text = "K"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = center_x - text_width // 2
    y = center_y - text_height // 2 - logo_size // 20
    draw.text((x, y), text, fill=KAMA_BLUE, font=font)
    
    # Texte KAMA
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size // 2)
    except:
        title_font = font
    
    title = "KAMA"
    bbox = draw.textbbox((0, 0), title, font=title_font)
    title_width = bbox[2] - bbox[0]
    draw.text((center_x - title_width // 2, center_y + logo_size // 2 + 20), title, fill=WHITE, font=title_font)
    
    # Sous-titre
    try:
        sub_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", font_size // 4)
    except:
        sub_font = font
    
    subtitle = "Immobilier • Véhicules • Terrains"
    bbox = draw.textbbox((0, 0), subtitle, font=sub_font)
    sub_width = bbox[2] - bbox[0]
    draw.text((center_x - sub_width // 2, center_y + logo_size // 2 + 70), subtitle, fill=(200, 200, 200), font=sub_font)
    
    img.save(os.path.join(ASSETS_DIR, filename))
    print(f"✅ Créé: {filename} ({width}x{height})")

def create_adaptive_icon(size, filename):
    """Créer l'icône adaptative Android (foreground)"""
    # L'icône adaptative a besoin de padding (safe zone)
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Safe zone = 66% du centre
    safe_margin = size * 0.17
    safe_size = size - (2 * safe_margin)
    
    # Cercle doré
    circle_margin = safe_margin + safe_size * 0.1
    circle_bbox = [circle_margin, circle_margin, size - circle_margin, size - circle_margin]
    draw.ellipse(circle_bbox, fill=KAMA_GOLD)
    
    # Lettre K
    font_size = int(safe_size * 0.4)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    text = "K"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - size // 30
    draw.text((x, y), text, fill=KAMA_BLUE, font=font)
    
    img.save(os.path.join(ASSETS_DIR, filename))
    print(f"✅ Créé: {filename} ({size}x{size})")

def main():
    os.makedirs(ASSETS_DIR, exist_ok=True)
    
    print("🎨 Génération des assets KAMA Mobile...")
    print("-" * 40)
    
    # Icône principale (1024x1024 pour iOS App Store)
    create_icon(1024, "icon.png")
    
    # Icône adaptative Android (1024x1024)
    create_adaptive_icon(1024, "adaptive-icon.png")
    
    # Favicon (48x48)
    create_icon(48, "favicon.png")
    
    # Splash screen (1284x2778 pour iPhone 13 Pro Max)
    create_splash(1284, 2778, "splash.png")
    
    print("-" * 40)
    print("✅ Tous les assets ont été générés!")

if __name__ == "__main__":
    main()
