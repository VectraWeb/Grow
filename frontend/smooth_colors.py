import os
import re

def replace_in_file(file_path, replacements):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements:
        new_content = new_content.replace(old, new)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

replacements = [
    ('245,158,11', '220,38,38'), # Amber to Red
    ('bg-black', 'bg-slate-900'),
    ('via-black', 'via-slate-900'),
    ('to-black', 'to-slate-900'),
    ('from-black', 'from-slate-900'),
    ('border-black', 'border-white/5'),
]

root_dir = r'c:\ferre\frontend\src\app'
for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(('.html', '.ts', '.css')):
            path = os.path.join(root, file)
            if replace_in_file(path, replacements):
                print(f'Updated: {path}')
