"""Add published releases to the curated archive before deploying the website."""
import json
import re
import sys
from datetime import datetime, timedelta, timezone
from html import escape
from pathlib import Path

from markdown_it import MarkdownIt

page = Path("changelog.html")
template = page.read_text()
marker = "<!-- published releases -->"
renderer = MarkdownIt("commonmark", {"html": False})
articles = []
releases = [release for batch in json.load(sys.stdin) for release in batch]
for release in sorted(releases, key=lambda item: item["published_at"] or "", reverse=True):
    tag = release["tag_name"]
    if release["draft"] or release["prerelease"] or not re.fullmatch(r"v\d+\.\d+\.\d+", tag):
        continue
    if f'id="{tag}"' in template:
        continue
    published = datetime.fromisoformat(release["published_at"].replace("Z", "+00:00"))
    day = published.astimezone(timezone(timedelta(hours=9))).date()
    body = (release["body"] or "").strip()
    title = release["name"] or tag
    # The release title often appears as the first heading of the notes too.
    lines = body.splitlines()
    if lines and lines[0].lstrip("# ").strip() == title:
        body = "\n".join(lines[1:])
    articles.append(f'''<article id="{tag}" class="note-entry">
      <header><a href="#{tag}">{tag}</a><time datetime="{day}">{day:%Y. %m. %d.}</time></header>
      <div><h2>{escape(title)}</h2>{renderer.render(body)}</div>
    </article>''')
if marker not in template:
    raise ValueError("Missing release archive insertion point")
page.write_text(template.replace(marker, marker + "\n" + "\n".join(articles)))
