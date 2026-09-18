#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BrowsMe Code Studio - Fayl Redaktə və Ad Dəyişmə Skripti (editer.py)
------------------------------------------------------------------
Bu skript faylların adının dəyişdirilməsi (rename), məzmunun redaktəsi (edit)
və fayl oxunuşu üçün universal Python utilitidir.
"""

import sys
import os
import json

# Windows konsolunda UTF-8 dəstəyini təmin et
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
if hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def json_exit(success, message, data=None):
    output = {
        "success": success,
        "message": message,
        "data": data or {}
    }
    try:
        print(json.dumps(output, ensure_ascii=True))
    except Exception:
        print(json.dumps({"success": success, "message": "completed"}))
    sys.exit(0 if success else 1)

def cmd_rename(old_path, new_path):
    try:
        if not os.path.exists(old_path):
            json_exit(False, f"Menbe fayl ve ya qovluq tapilmadi: {old_path}")
        
        if os.path.abspath(old_path) == os.path.abspath(new_path):
            json_exit(True, "Ad eynidir, deyisiklik teleb olunmur.", {"path": new_path})
            
        if os.path.exists(new_path):
            json_exit(False, f"Hedef adda fayl/qovluq artiq movcuddur: {new_path}")
            
        os.rename(old_path, new_path)
        json_exit(True, f"Ad deyisdirildi: {os.path.basename(new_path)}", {
            "old_path": old_path,
            "new_path": new_path,
            "name": os.path.basename(new_path)
        })
    except Exception as e:
        json_exit(False, f"Ad deyisme xetasi: {str(e)}")

def cmd_write(file_path, content):
    try:
        dirname = os.path.dirname(file_path)
        if dirname and not os.path.exists(dirname):
            os.makedirs(dirname, exist_ok=True)
            
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        json_exit(True, f"Fayl yazildi: {file_path}", {"path": file_path, "bytes": len(content.encode('utf-8'))})
    except Exception as e:
        json_exit(False, f"Fayla yazma xetasi: {str(e)}")

def cmd_replace(file_path, target_str, replacement_str):
    try:
        if not os.path.isfile(file_path):
            json_exit(False, f"Fayl tapilmadi: {file_path}")
            
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if target_str not in content:
            json_exit(False, f"Deyisdirilecek metn tapilmadi: '{target_str}'")
            
        new_content = content.replace(target_str, replacement_str)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
            
        json_exit(True, f"Metn evez edildi.", {"path": file_path})
    except Exception as e:
        json_exit(False, f"Evezetme xetasi: {str(e)}")

def cmd_read(file_path):
    try:
        if not os.path.isfile(file_path):
            json_exit(False, f"Fayl tapilmadi: {file_path}")
            
        with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
        json_exit(True, "Fayl oxundu.", {"path": file_path, "content": content})
    except Exception as e:
        json_exit(False, f"Oxuma xetasi: {str(e)}")

def main():
    if len(sys.argv) < 2:
        print("İstifadə: python editer.py [rename|write|replace|read] [parametrlər...]")
        sys.exit(1)
        
    action = sys.argv[1].lower()
    
    if action == "rename" and len(sys.argv) >= 4:
        cmd_rename(sys.argv[2], sys.argv[3])
    elif action == "write" and len(sys.argv) >= 4:
        cmd_write(sys.argv[2], sys.argv[3])
    elif action == "replace" and len(sys.argv) >= 5:
        cmd_replace(sys.argv[2], sys.argv[3], sys.argv[4])
    elif action == "read" and len(sys.argv) >= 3:
        cmd_read(sys.argv[2])
    else:
        json_exit(False, f"Yanlis parametr: '{action}'")

if __name__ == "__main__":
    main()
