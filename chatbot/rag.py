"""Simple keyword RAG over local knowledge chunks.

Designed to stay dependency-light. Can be swapped for ChromaDB / embeddings later
without changing the chat endpoint contract.
"""

from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Any

KNOWLEDGE_DIR = Path(__file__).resolve().parent / "knowledge"
CHUNKS_PATH = KNOWLEDGE_DIR / "chunks.json"
COMPANY_MD_PATH = KNOWLEDGE_DIR / "company.md"


def _tokenize(text: str) -> set[str]:
    return {t for t in re.findall(r"[a-z0-9]+", text.lower()) if len(t) > 2}


@lru_cache(maxsize=1)
def load_chunks() -> list[dict[str, Any]]:
    if CHUNKS_PATH.is_file():
        with CHUNKS_PATH.open(encoding="utf-8") as fh:
            data = json.load(fh)
        if isinstance(data, list) and data:
            return data

    # Fallback: split company.md into coarse sections
    if COMPANY_MD_PATH.is_file():
        raw = COMPANY_MD_PATH.read_text(encoding="utf-8")
        parts = re.split(r"\n(?=## )", raw)
        chunks = []
        for i, part in enumerate(parts):
            title_match = re.match(r"##\s+(.+)", part.strip())
            title = title_match.group(1).strip() if title_match else f"Section {i + 1}"
            chunks.append(
                {
                    "id": f"md-{i}",
                    "title": title,
                    "tags": list(_tokenize(title)),
                    "text": part.strip(),
                }
            )
        return chunks

    return []


def retrieve(query: str, *, top_k: int = 4, max_chars: int = 2200) -> str:
    """Return a ranked context string for the system prompt."""
    chunks = load_chunks()
    if not chunks:
        return ""

    q_tokens = _tokenize(query)
    if not q_tokens:
        # Prefer high-value overview chunks when the query is tiny
        selected = chunks[: min(top_k, len(chunks))]
    else:
        scored: list[tuple[float, dict[str, Any]]] = []
        for chunk in chunks:
            bag = _tokenize(
                " ".join(
                    [
                        str(chunk.get("title", "")),
                        str(chunk.get("text", "")),
                        " ".join(chunk.get("tags") or []),
                    ]
                )
            )
            overlap = q_tokens & bag
            # Light boost for title/tag hits
            tag_tokens = _tokenize(" ".join(chunk.get("tags") or []) + " " + str(chunk.get("title", "")))
            score = float(len(overlap)) + 0.5 * float(len(q_tokens & tag_tokens))
            if score > 0:
                scored.append((score, chunk))
        scored.sort(key=lambda item: item[0], reverse=True)
        selected = [c for _, c in scored[:top_k]] or chunks[:2]

    parts: list[str] = []
    total = 0
    for chunk in selected:
        block = f"### {chunk.get('title', 'Info')}\n{chunk.get('text', '').strip()}"
        if total + len(block) > max_chars and parts:
            break
        parts.append(block)
        total += len(block)

    return "\n\n".join(parts)
