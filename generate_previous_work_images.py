import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

output_dir = "public/images/previous-work"
os.makedirs(output_dir, exist_ok=True)

# Image dimensions
W, H = 800, 520

items = [
    {
        "filename": "work-1.webp",
        "tag": "WEB PLATFORM",
        "title": "Tech Expo Portal",
        "desc": "Real-time registration & live stream hub for 5,000+ attendees",
        "stat": "5K+ Active Users",
        "bg_start": (33, 18, 47),    # #21122f
        "bg_end": (53, 32, 71),      # #352047
        "accent": (245, 161, 13),    # #f5a10d
        "accent2": (237, 112, 64)    # #ed7040
    },
    {
        "filename": "work-2.webp",
        "tag": "EVENT BRANDING",
        "title": "Annual Cultural Fest",
        "desc": "End-to-end identity, stage graphics & digital ticket platform",
        "stat": "12K+ Tickets Issued",
        "bg_start": (23, 17, 28),    # #17111c
        "bg_end": (45, 25, 60),
        "accent": (255, 189, 60),   # #ffbd3c
        "accent2": (237, 112, 64)
    },
    {
        "filename": "work-3.webp",
        "tag": "BRAND SYSTEM",
        "title": "Brand Identity System",
        "desc": "Comprehensive design system, UI toolkit & brand guidelines",
        "stat": "40+ UI Components",
        "bg_start": (40, 20, 50),
        "bg_end": (20, 10, 30),
        "accent": (245, 161, 13),
        "accent2": (115, 210, 164)
    },
    {
        "filename": "work-4.webp",
        "tag": "ANALYTICS & MEDIA",
        "title": "Impact Report 2025",
        "desc": "Interactive storytelling & visual data dashboard for campus growth",
        "stat": "300% Engagement",
        "bg_start": (25, 30, 45),
        "bg_end": (15, 20, 35),
        "accent": (237, 112, 64),
        "accent2": (245, 161, 13)
    },
    {
        "filename": "work-5.webp",
        "tag": "MARKETING CAMPAIGN",
        "title": "Launch Campaign",
        "desc": "Multi-channel recruitment drive, video ads & social media assets",
        "stat": "1.2M Impressions",
        "bg_start": (45, 20, 35),
        "bg_end": (25, 12, 25),
        "accent": (255, 189, 60),
        "accent2": (237, 112, 64)
    },
    {
        "filename": "work-6.webp",
        "tag": "SPONSORSHIP",
        "title": "Sponsorship Summit",
        "desc": "Interactive pitch deck & corporate partnership media kit",
        "stat": "$50K+ Raised",
        "bg_start": (20, 35, 45),
        "bg_end": (12, 20, 30),
        "accent": (115, 210, 164),
        "accent2": (245, 161, 13)
    }
]

def draw_rounded_rect(draw, bbox, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(bbox, radius=radius, fill=fill, outline=outline, width=width)

def try_load_font(size):
    # Try standard fonts available on Windows
    font_names = ["arial.ttf", "segoeui.ttf", "tahoma.ttf", "calibri.ttf"]
    for font_name in font_names:
        try:
            return ImageFont.truetype(font_name, size)
        except OSError:
            continue
    return ImageFont.load_default()

font_tag = try_load_font(14)
font_title = try_load_font(32)
font_desc = try_load_font(16)
font_stat = try_load_font(18)

for item in items:
    img = Image.new("RGB", (W, H), item["bg_start"])
    draw = ImageDraw.Draw(img)
    
    # Draw subtle gradient / background shapes
    r1, g1, b1 = item["bg_start"]
    r2, g2, b2 = item["bg_end"]
    for y in range(H):
        ratio = y / H
        r = int(r1 + (r2 - r1) * ratio)
        g = int(g1 + (g2 - g1) * ratio)
        b = int(b1 + (b2 - b1) * ratio)
        draw.line([(0, y), (W, y)], fill=(r, g, b))
        
    # Decorative ambient glowing circles
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    ar, ag, ab = item["accent"]
    ar2, ag2, ab2 = item["accent2"]
    
    glow_draw.ellipse([W - 350, -100, W + 150, 400], fill=(ar, ag, ab, 45))
    glow_draw.ellipse([-100, H - 250, 350, H + 200], fill=(ar2, ag2, ab2, 35))
    glow = glow.filter(ImageFilter.GaussianBlur(50))
    img.paste(glow, (0, 0), glow)
    
    draw = ImageDraw.Draw(img)
    
    # Outer subtle border inside card
    draw_rounded_rect(draw, [15, 15, W - 15, H - 15], radius=16, outline=(255, 255, 255, 30), width=1)
    
    # Inner Mockup Frame / Card UI overlay
    mockup_box = [40, 40, W - 40, H - 40]
    # Semi-transparent dark surface card
    surface_overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    so_draw = ImageDraw.Draw(surface_overlay)
    so_draw.rounded_rectangle(mockup_box, radius=20, fill=(18, 12, 24, 180), outline=(255, 255, 255, 40), width=1)
    
    # Top Mockup Window Dots (Mac style window controls)
    so_draw.ellipse([70, 70, 82, 82], fill=(255, 95, 87))
    so_draw.ellipse([90, 70, 102, 82], fill=(255, 189, 46))
    so_draw.ellipse([110, 70, 122, 82], fill=(39, 201, 63))
    
    img.paste(surface_overlay, (0, 0), surface_overlay)
    draw = ImageDraw.Draw(img)
    
    # Tag Badge
    tag_text = item["tag"]
    draw_rounded_rect(draw, [70, 115, 230, 145], radius=8, fill=(item["accent"][0], item["accent"][1], item["accent"][2], 50), outline=item["accent"], width=1)
    draw.text((85, 122), tag_text, fill=item["accent"], font=font_tag)
    
    # Title
    draw.text((70, 165), item["title"], fill=(255, 255, 255), font=font_title)
    
    # Description
    draw.text((70, 220), item["desc"], fill=(200, 195, 210), font=font_desc)
    
    # Stat Badge / Bottom Card Component Mockup
    draw_rounded_rect(draw, [70, 280, W - 70, H - 70], radius=14, fill=(30, 22, 40), outline=(70, 55, 85), width=1)
    
    # Inside the bottom inner card
    draw.text((100, 310), "KEY RESULT / IMPACT", fill=(140, 130, 155), font=font_tag)
    draw.text((100, 335), item["stat"], fill=item["accent"], font=font_title)
    
    # Graphical visual elements inside the mockup card (mini chart bars / progress indicator)
    bar_x = W - 320
    for i, height in enumerate([35, 60, 45, 80, 65, 95]):
        bx = bar_x + (i * 35)
        by = H - 90
        fill_col = item["accent"] if i >= 4 else (90, 75, 110)
        draw_rounded_rect(draw, [bx, by - height, bx + 22, by], radius=4, fill=fill_col)
    
    # Save image as WEBP with high quality
    target_path = os.path.join(output_dir, item["filename"])
    img.save(target_path, "WEBP", quality=90, optimize=True)
    print(f"Generated {target_path} ({os.path.getsize(target_path)} bytes)")

print("All WebP showcase images successfully generated!")
