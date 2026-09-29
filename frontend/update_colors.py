import os
import re

def replace_in_file(file_path, replacements):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements:
        new_content = re.sub(old, new, new_content)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

replacements = [
    (r'orange-(\d+)', r'red-\1'),
    (r'amber-(\d+)', r'red-\1'),
    (r'bg-black\b', r'bg-slate-900'),
    (r'bg-slate-950\b', r'bg-slate-900'),
    (r'bg-slate-900\b', r'bg-slate-800'),
    (r'text-amber-(\d+)', r'text-red-\1'),
    (r'text-orange-(\d+)', r'text-red-\1'),
    (r'border-amber-(\d+)', r'border-red-\1'),
    (r'from-amber-(\d+)', r'from-red-\1'),
    (r'to-amber-(\d+)', r'to-red-\1'),
    (r'from-orange-(\d+)', r'from-red-\1'),
    (r'to-orange-(\d+)', r'to-red-\1'),
    (r'shadow-amber-(\d+)', r'shadow-red-\1'),
    (r'shadow-orange-(\d+)', r'shadow-red-\1'),
]

root_dir = r'c:\ferre\frontend\src\app'
for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(('.html', '.ts', '.css')):
            path = os.path.join(root, file)
            if replace_in_file(path, replacements):
                print(f'Updated: {path}')
