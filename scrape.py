import os
import re
import json
import urllib.request
import urllib.parse

def scrape_framer_assets(url, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    print(f"Fetching {url} ...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'})
    try:
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
    except Exception as e:
        print(f"Failed to fetch {url}: {e}")
        return

    # Framer usually hosts assets on framerusercontent.com
    # We will look for all URLs matching https://framerusercontent.com/...
    
    asset_urls = set()
    
    # 1. Regex for framerusercontent.com URLs
    # Matches images, videos, etc.
    framer_regex = r'https://framerusercontent\.com/[a-zA-Z0-9_/\-\.]+?(?:\.(?:jpg|jpeg|png|gif|webp|svg|mp4|webm|woff|woff2|ttf|otf|css|js|ico)|(?:[?#"].*?)?)"'
    
    # Better regex: match until quote or space or bracket
    # Since they might be in JSON blobs, src attributes, etc.
    raw_urls = re.findall(r'(https?://[^"\',\s]+)', html)
    
    for u in raw_urls:
        if u.endswith(')') or u.endswith('}'):
            u = u.rstrip(')}')
        # Decode URL just in case it's in JSON
        try:
            # Handle unicode escapes if present
            u = u.encode('utf-8').decode('unicode_escape')
        except:
            pass
            
        u = u.replace('&amp;', '&')
            
        if 'framerusercontent.com' in u or u.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.mp4', '.webm')):
            asset_urls.add(u)

    print(f"Found {len(asset_urls)} unique asset URLs.")

    count = 0
    for u in asset_urls:
        try:
            # Clean up the URL
            parsed = urllib.parse.urlparse(u)
            filename = os.path.basename(parsed.path)
            
            if not filename:
                continue
                
            # Fallback filename if needed
            if '.' not in filename:
                if 'image' in u:
                    filename += '.jpg'
                elif 'video' in u:
                    filename += '.mp4'
                else:
                    filename += '.bin'
                    
            # Safe filename
            filename = "".join([c for c in filename if c.isalpha() or c.isdigit() or c in (' ', '.', '_', '-')]).rstrip()
            
            # Prevent overwriting
            base, ext = os.path.splitext(filename)
            counter = 1
            final_filename = filename
            while os.path.exists(os.path.join(output_dir, final_filename)):
                final_filename = f"{base}_{counter}{ext}"
                counter += 1
                
            out_path = os.path.join(output_dir, final_filename)
            
            req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                with open(out_path, 'wb') as f:
                    f.write(response.read())
            
            count += 1
            print(f"[{count}] Downloaded: {final_filename}")
            
        except Exception as e:
            print(f"Failed to download {u}: {e}")

    print(f"Finished downloading {count} assets to '{output_dir}'.")

if __name__ == "__main__":
    scrape_framer_assets("https://ayaam2026.framer.website/", "inspirictions")
