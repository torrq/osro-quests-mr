"""
generate_item_lists.py
----------------------
Regenerates (or creates) the "Deposit List" and "Unlock List" entries in
data/osromr_item_lists.json by scanning item descriptions for known marker
strings.

Detection rules (verified against the current dataset, 0 false positives):
  Deposit List  ->  desc contains "Deposit Effect"
  Unlock List   ->  desc contains "Unlock Effect"

All other lists in osromr_item_lists.json are left untouched.

Usage:
    python helpers/generate_item_lists.py
"""

import json
import pathlib

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
ITEMS_FILE = REPO_ROOT / "data" / "osromr_items.json"
LISTS_FILE = REPO_ROOT / "data" / "osromr_item_lists.json"

DEPOSIT_MARKER = "Deposit Effect"
UNLOCK_MARKER  = "Unlock Effect"


def main():
    with open(ITEMS_FILE, "r", encoding="utf-8") as f:
        items: dict = json.load(f)

    with open(LISTS_FILE, "r", encoding="utf-8") as f:
        lists: list = json.load(f)

    # Build the new id lists (sorted numerically for a stable diff)
    deposit_ids = sorted(
        int(id_str)
        for id_str, item in items.items()
        if DEPOSIT_MARKER in item.get("desc", "")
    )
    unlock_ids = sorted(
        int(id_str)
        for id_str, item in items.items()
        if UNLOCK_MARKER in item.get("desc", "")
    )

    # Update existing entries or append new ones
    deposit_entry = next((e for e in lists if e["name"] == "Deposit List"), None)
    unlock_entry  = next((e for e in lists if e["name"] == "Unlock List"), None)

    if deposit_entry is not None:
        old = deposit_entry["items"]
        deposit_entry["items"] = deposit_ids
        print(f"Deposit List: {len(old)} -> {len(deposit_ids)} items (updated)")
    else:
        lists.append({"name": "Deposit List", "items": deposit_ids})
        print(f"Deposit List: added with {len(deposit_ids)} items")

    if unlock_entry is not None:
        old = unlock_entry["items"]
        unlock_entry["items"] = unlock_ids
        print(f"Unlock List:  {len(old)} -> {len(unlock_ids)} items (updated)")
    else:
        lists.append({"name": "Unlock List", "items": unlock_ids})
        print(f"Unlock List:  added with {len(unlock_ids)} items")

    with open(LISTS_FILE, "w", encoding="utf-8") as f:
        json.dump(lists, f, indent=2, ensure_ascii=False)

    print(f"\nSaved {LISTS_FILE}")


if __name__ == "__main__":
    main()
