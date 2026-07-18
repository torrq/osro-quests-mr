"""
generate_item_lists.py
----------------------
Regenerates the "Deposit List" and "Unlock List" entries in
data/osrohr_item_lists.json by scanning item descriptions for
known marker strings.

Detection rules (verified against the current dataset, 0 false positives):
  Deposit List  ->  desc contains "Deposit Effect"
  Unlock List   ->  desc contains "Unlock Effect"

All other lists in osrohr_item_lists.json are left untouched.

Usage:
    python helpers/generate_item_lists.py
"""

import json
import pathlib
import re

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
ITEMS_FILE = REPO_ROOT / "data" / "osromr_items.json"
LISTS_FILE = REPO_ROOT / "data" / "osromr_item_lists.json"

DEPOSIT_MARKER = "Deposit Effect"
UNLOCK_MARKER  = "Unlock Effect"

COLOR_RE = re.compile(r'\^[0-9A-Fa-f]{6}')

def strip_color(text):
    if not text:
        return ""
    return COLOR_RE.sub('', text)

def extract_effect(desc, marker):
    lines = desc.split('\n')
    collecting = False
    result = []
    for line in lines:
        if marker in line:
            collecting = True
            continue
        if collecting:
            stripped = line.strip()
            if stripped.startswith('---'):
                break
            if stripped:
                result.append(strip_color(stripped).strip())
    if not result:
        return ""
    text = ' '.join(result)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def extract_class(desc):
    for line in desc.split('\n'):
        if line.strip().startswith('Class:'):
            return strip_color(line).replace('Class:', '').strip()
    return ""

def main():
    with open(ITEMS_FILE, "r", encoding="utf-8") as f:
        items: dict = json.load(f)

    with open(LISTS_FILE, "r", encoding="utf-8") as f:
        lists: list = json.load(f)

    deposit_ids = []
    deposit_effects = {}
    deposit_classes = {}
    for id_str, item in items.items():
        desc = item.get("desc", "")
        if DEPOSIT_MARKER in desc:
            id_val = int(id_str)
            deposit_ids.append(id_val)
            deposit_effects[id_str] = extract_effect(desc, DEPOSIT_MARKER)
            cls = extract_class(desc)
            if cls:
                deposit_classes[id_str] = cls
    deposit_ids.sort()

    unlock_ids = []
    unlock_effects = {}
    unlock_classes = {}
    for id_str, item in items.items():
        desc = item.get("desc", "")
        if UNLOCK_MARKER in desc:
            id_val = int(id_str)
            unlock_ids.append(id_val)
            unlock_effects[id_str] = extract_effect(desc, UNLOCK_MARKER)
            cls = extract_class(desc)
            if cls:
                unlock_classes[id_str] = cls
    unlock_ids.sort()

    # Update in-place so order and other lists are preserved
    updated = {"Deposit List": False, "Unlock List": False}
    for entry in lists:
        if entry["name"] == "Deposit List":
            old = entry["items"]
            entry["items"] = deposit_ids
            entry["effects"] = deposit_effects
            entry["classes"] = deposit_classes
            updated["Deposit List"] = True
            print(f"Deposit List: {len(old)} -> {len(deposit_ids)} items")
        elif entry["name"] == "Unlock List":
            old = entry["items"]
            entry["items"] = unlock_ids
            entry["effects"] = unlock_effects
            entry["classes"] = unlock_classes
            updated["Unlock List"] = True
            print(f"Unlock List:  {len(old)} -> {len(unlock_ids)} items")

    for name, ok in updated.items():
        if not ok:
            print(f"WARNING: '{name}' not found in {LISTS_FILE.name} — no changes made for it.")

    with open(LISTS_FILE, "w", encoding="utf-8") as f:
        json.dump(lists, f, indent=2, ensure_ascii=False)

    print(f"\nSaved {LISTS_FILE}")


if __name__ == "__main__":
    main()

