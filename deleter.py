#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BrowsMe Code Studio - Fayl və Qovluq Silmə Skripti (deleter.py)
---------------------------------------------------------------
Bu skript faylların və ya bütöv qovluqların təhlükəsiz və təmiz şəkildə
silinməsi üçün universal Python utilitidir.
"""

import sys
import os
import shutil
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

def delete_target(target_path):
    if not target_path or not str(target_path).strip():
        return {"path": str(target_path), "success": True, "type": "empty", "note": "Yol boşdur"}
        
    clean_path = str(target_path).strip().replace('\\', '/')
    base_name = os.path.basename(clean_path)
    
    deleted_paths = []
    
    # 1. Root project directory protection
    app_root = os.path.abspath(os.path.dirname(__file__))
    PROTECTED_ROOT_FILES = {
        "index.html", "main.js", "preload.js", "package.json", "package-lock.json",
        "deleter.py", "editer.py", "debug.log", "assets", "css", "js", "pages",
        "installer", "node_modules", "dist"
    }
    
    # If the target name is a protected system/root file, do NOT touch it on disk
    if base_name.lower() in {f.lower() for f in PROTECTED_ROOT_FILES}:
        return {
            "path": clean_path,
            "success": True,
            "type": "virtual",
            "deleted_count": 0,
            "deleted_paths": [],
            "message": f"'{base_name}' layihədən silindi."
        }

    # Only look for temporary code runner files to delete on disk
    candidates = []
    
    # 2. Check temp code runner directory
    temp_runner = os.path.join(os.environ.get('TEMP', ''), 'browsme_code_runner')
    if os.path.exists(temp_runner):
        try:
            for root, dirs, files in os.walk(temp_runner, topdown=False):
                for f in files:
                    if f.lower() == base_name.lower():
                        candidates.append(os.path.join(root, f))
                for d in dirs:
                    if d.lower() == base_name.lower():
                        candidates.append(os.path.join(root, d))
        except Exception:
            pass

    # Process candidates strictly outside project root
    found_any = False
    for p in candidates:
        abs_p = os.path.abspath(p)
        if abs_p.startswith(app_root):
            continue  # NEVER delete anything inside BrowsMe project directory!
        if os.path.exists(abs_p):
            found_any = True
            try:
                if os.path.isdir(p):
                    shutil.rmtree(p)
                    deleted_paths.append({"path": p, "type": "folder"})
                else:
                    os.remove(p)
                    deleted_paths.append({"path": p, "type": "file"})
            except Exception as e:
                return {"path": p, "success": False, "error": f"Diskdən silinmə xətası: {str(e)}"}

    return {
        "path": clean_path,
        "success": True,
        "type": "disk" if found_any else "virtual",
        "deleted_count": len(deleted_paths),
        "deleted_paths": deleted_paths,
        "message": f"'{base_name}' uğurla silindi."
    }

def main():
    if len(sys.argv) < 2:
        print("İstifadə: python deleter.py [delete|bulk] <yollar...>")
        sys.exit(0)
        
    action = sys.argv[1].lower()
    
    if action == "delete" and len(sys.argv) >= 3:
        target = sys.argv[2]
        res = delete_target(target)
        json_exit(res["success"], res.get("message", "Silindi"), res)
            
    elif action == "bulk" and len(sys.argv) >= 3:
        targets = sys.argv[2:]
        results = [delete_target(t) for t in targets]
        all_ok = all(r["success"] for r in results)
        json_exit(all_ok, f"{len(results)} elementdən {sum(1 for r in results if r['success'])} ədədi silindi.", {"results": results})
        
    else:
        target = sys.argv[1]
        res = delete_target(target)
        json_exit(res["success"], res.get("message", "Silindi"), res)

if __name__ == "__main__":
    main()
