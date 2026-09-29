import os
import re

def replace_in_file(file_path, replacements):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements:
        if isinstance(old, str):
            new_content = new_content.replace(old, new)
        else:
            new_content = old.sub(new, new_content)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

# Hex and RGB replacements for Orange/Amber -> Red
replacements = [
    ('#f97316', '#dc2626'), # Orange 500 -> Red 600
    ('#ea580c', '#b91c1c'), # Orange 600 -> Red 700
    ('#fbbf24', '#ef4444'), # Amber 400 -> Red 500
    ('#fcd34d', '#f87171'), # Amber 300 -> Red 400
    ('#ff6b35', '#dc2626'), # Custom orange
    ('#e85a2c', '#b91c1c'), # Custom orange
    ('249, 115, 22', '220, 38, 38'), # Orange 500 RGB
    ('245, 158, 11', '220, 38, 38'), # Amber 500 RGB
    ('234, 88, 12', '185, 28, 28'), # Orange 600 RGB
    ('border-white/10', 'border-red-500/30'), # Smooth border
    ('border-white/5', 'border-red-500/20'),
]

root_dir = r'c:\ferre\frontend\src'
for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(('.html', '.ts', '.css')):
            path = os.path.join(root, file)
            if replace_in_file(path, replacements):
                print(f'Updated: {path}')
