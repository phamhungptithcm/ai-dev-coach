#!/usr/bin/env python3
"""Build a minimal static HTML site from Markdown docs."""

from __future__ import annotations

import argparse
import html
import os
import re
import shutil
from pathlib import Path

import markdown

MARKDOWN_LINK_RE = re.compile(r"\]\(([^)\s]+\.md(?:#[^)\s]+)?)\)")


def rewrite_markdown_links(content: str) -> str:
    def replace(match: re.Match[str]) -> str:
        target = match.group(1)

        if "://" in target or target.startswith("mailto:"):
            return match.group(0)

        if "#" in target:
            file_part, anchor = target.split("#", 1)
            return f"]({file_part[:-3]}.html#{anchor})"

        return f"]({target[:-3]}.html)"

    return MARKDOWN_LINK_RE.sub(replace, content)


def page_title(relative_path: Path, content: str) -> str:
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.startswith("# "):
            return stripped[2:].strip()
    return relative_path.stem.replace("-", " ").title()


def render_html(title: str, body_html: str) -> str:
    safe_title = html.escape(title)
    return f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>{safe_title}</title>
</head>
<body>
  <main>
{body_html}
  </main>
</body>
</html>
"""


def build(source: Path, output: Path) -> None:
    if not source.exists() or not source.is_dir():
        raise FileNotFoundError(f"Source docs directory not found: {source}")

    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True, exist_ok=True)

    for path in sorted(source.rglob("*")):
        relative = path.relative_to(source)
        target = output / relative

        if path.is_dir():
            target.mkdir(parents=True, exist_ok=True)
            continue

        if path.suffix.lower() != ".md":
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, target)
            continue

        markdown_text = path.read_text(encoding="utf-8")
        rewritten = rewrite_markdown_links(markdown_text)
        title = page_title(relative, rewritten)
        body = markdown.markdown(
            rewritten,
            extensions=["fenced_code", "tables", "toc", "sane_lists"],
            output_format="html5",
        )

        html_path = target.with_suffix(".html")
        html_path.parent.mkdir(parents=True, exist_ok=True)
        html_path.write_text(render_html(title, body), encoding="utf-8")

    (output / ".nojekyll").write_text("", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build a static docs site from Markdown files")
    parser.add_argument("--source", default="docs", help="Source directory containing markdown docs")
    parser.add_argument("--output", default="public", help="Output directory for generated static site")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    source = Path(args.source).resolve()
    output = Path(args.output).resolve()

    build(source, output)
    print(f"Built docs from {source} -> {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
