#!/usr/bin/env python3
"""
Generates the TS and Python scaffold-level constant files from
config/scaffold-levels.json — the single source of truth for the
p_mastery -> scaffold level -> allowed GenUI components mapping.

Previously this mapping was hand-copied across three places (a TS shared
package, apps/web's genui-schema.ts, and apps/bkt-service's Python
resolver) and had already drifted out of sync once. This script is the
fix: edit the JSON, regenerate, done.

Usage:
    python3 scripts/codegen/generate_scaffold_levels.py         # write files
    python3 scripts/codegen/generate_scaffold_levels.py --check # exit 1 if generated files are stale
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
CONFIG_PATH = ROOT / "config" / "scaffold-levels.json"
TS_OUTPUT = ROOT / "packages" / "shared" / "src" / "constants" / "scaffold-levels.generated.ts"
PY_OUTPUT = ROOT / "apps" / "bkt-service" / "src" / "bkt" / "scaffold_data.py"

HEADER = (
    "GENERATED FILE — DO NOT EDIT BY HAND.\n"
    "Source: config/scaffold-levels.json\n"
    "Regenerate: python3 scripts/codegen/generate_scaffold_levels.py"
)


def render_ts(config: dict) -> str:
    levels = config["levels"]

    levels_ts = ",\n".join(
        "    { level: %d, name: '%s', range: [%s, %s] as const, description: '%s' }"
        % (lv["level"], lv["name"], lv["range"][0], lv["range"][1], lv["description"].replace("'", "\\'"))
        for lv in levels
    )
    names_ts = ", ".join(f"'{lv['displayName']}'" for lv in levels)
    components_ts = ",\n".join(
        "    %d: [%s]" % (lv["level"], ", ".join(f"'{c}'" for c in lv["allowedComponents"]))
        for lv in levels
    )

    return f"""/**
 * {HEADER.replace(chr(10), chr(10) + " * ")}
 */

export const MASTERY_THRESHOLD = {config["masteryThreshold"]};

export const SCAFFOLD_LEVELS = [
{levels_ts},
] as const;

export const LEVEL_NAMES = [{names_ts}] as const;

export const ALLOWED_COMPONENTS: Record<number, string[]> = {{
{components_ts},
}};
"""


def render_py(config: dict) -> str:
    levels = config["levels"]

    levels_py = ",\n".join(
        "    {\"level\": %d, \"name\": \"%s\", \"range\": (%s, %s), \"description\": \"%s\"}"
        % (lv["level"], lv["name"], lv["range"][0], lv["range"][1], lv["description"].replace('"', '\\"'))
        for lv in levels
    )
    catalog_py = ",\n".join(
        "    %d: [%s]" % (lv["level"], ", ".join(f'"{c}"' for c in lv["allowedComponents"]))
        for lv in levels
    )

    return f'''"""
{HEADER}
"""

MASTERY_THRESHOLD = {config["masteryThreshold"]}

SCAFFOLD_LEVELS = [
{levels_py},
]

COMPONENT_CATALOG: dict[int, list[str]] = {{
{catalog_py},
}}
'''


def main():
    check_mode = "--check" in sys.argv
    config = json.loads(CONFIG_PATH.read_text())

    outputs = {
        TS_OUTPUT: render_ts(config),
        PY_OUTPUT: render_py(config),
    }

    if check_mode:
        stale = []
        for path, content in outputs.items():
            existing = path.read_text() if path.exists() else None
            if existing != content:
                stale.append(path)
        if stale:
            print("Stale generated files (run without --check to regenerate):")
            for path in stale:
                print(f"  - {path.relative_to(ROOT)}")
            sys.exit(1)
        print("All generated scaffold-level files are up to date.")
        return

    for path, content in outputs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)
        print(f"wrote {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
