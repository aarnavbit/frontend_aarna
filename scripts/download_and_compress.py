import os
import glob
from PIL import Image

RAW_DIR = os.path.join(os.getcwd(), "temp_raw_images")
OUTPUT_DIR = os.path.join(os.getcwd(), "public", "images", "previous-work")

# Clear existing output dir
if os.path.exists(OUTPUT_DIR):
    for f in glob.glob(os.path.join(OUTPUT_DIR, "*")):
        try:
            os.remove(f)
        except Exception:
            pass

os.makedirs(OUTPUT_DIR, exist_ok=True)

image_extensions = ('*.png', '*.jpg', '*.jpeg', '*.webp', '*.bmp', '*.PNG', '*.JPG', '*.JPEG')
found_images = []
for ext in image_extensions:
    for img_path in glob.glob(os.path.join(RAW_DIR, "**", ext), recursive=True):
        found_images.append(img_path)

# Filter by unique filename
unique_images = {}
for p in found_images:
    filename = os.path.basename(p)
    if filename not in unique_images:
        unique_images[filename] = p

print(f"Found {len(unique_images)} unique raw images.")

count = 0
for filename in sorted(unique_images.keys()):
    img_path = unique_images[filename]
    try:
        with Image.open(img_path) as im:
            im = im.convert('RGB')
            max_dim = 800
            if max(im.width, im.height) > max_dim:
                im.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
            
            count += 1
            out_filename = f"work_{count}.webp"
            out_path = os.path.join(OUTPUT_DIR, out_filename)
            im.save(out_path, 'WEBP', quality=75, optimize=True)
            orig_size = os.path.getsize(img_path) // 1024
            new_size = os.path.getsize(out_path) // 1024
            print(f"Compressed {filename} ({orig_size}KB -> {new_size}KB) => {out_filename}")
    except Exception as e:
        print(f"Failed to process {img_path}: {e}")

print(f"Done processing {count} unique images.")
