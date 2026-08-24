"""RAG Engine with Keyword Scoring & Synonym Expansion for NohiAI.

Lightweight, zero external dependencies required.
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

# Essential short tokens to preserve in query & chunk processing
_SHORT_KEEP = frozenset({"hr", "ai", "rcm", "crm", "app", "ui", "ux", "us", "ny"})

SYNONYMS: dict[str, list[str]] = {
    "job": ["careers", "vacancies", "hiring", "apply", "resume", "hr"],
    "jobs": ["careers", "vacancies", "hiring", "apply", "resume", "hr"],
    "career": ["careers", "job", "hiring", "apply", "resume", "hr"],
    "workplace": ["careers", "job", "office"],
    "price": ["cost", "estimate", "pricing", "quote", "sales", "consultation"],
    "cost": ["price", "estimate", "pricing", "quote", "sales", "consultation"],
    "quote": ["estimate", "price", "cost", "pricing", "sales", "consultation"],
    "estimate": ["quote", "price", "cost", "pricing", "sales"],
    "doctor": ["healthcare", "rcm", "medical", "billing"],
    "hospital": ["healthcare", "rcm", "medical", "billing"],
    "medical": ["healthcare", "rcm", "billing", "cms1500"],
    "billing": ["healthcare", "rcm", "medical", "cms1500", "claims"],
    "developer": ["developers", "hire", "engineering", "staffing"],
    "developers": ["developer", "hire", "engineering", "staffing"],
    "mobile": ["app", "flutter", "react native", "android", "ios"],
    "phone": ["contact", "sales", "hr", "call"],
    "call": ["phone", "contact", "sales", "hr"],
    "email": ["contact", "sales", "hr"],
}


def _tokenize(text: str) -> set[str]:
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    result = {t for t in tokens if len(t) > 2 or t in _SHORT_KEEP}
    # Add synonym expansions
    expanded = set(result)
    for t in result:
        if t in SYNONYMS:
            expanded.update(SYNONYMS[t])
    return expanded


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


def retrieve(query: str, *, top_k: int = 4, max_chars: int = 2400) -> str:
    """Return ranked knowledge context string for prompt integration."""
    chunks = load_chunks()
    if not chunks:
        return ""

    q_tokens = _tokenize(query)
    if not q_tokens:
        selected = chunks[: min(top_k, len(chunks))]
    else:
        scored: list[tuple[float, dict[str, Any]]] = []
        for chunk in chunks:
            title = str(chunk.get("title", ""))
            text = str(chunk.get("text", ""))
            tags = " ".join(chunk.get("tags") or [])
            
            chunk_tokens = _tokenize(f"{title} {text} {tags}")
            tag_title_tokens = _tokenize(f"{title} {tags}")
            
            overlap = q_tokens & chunk_tokens
            tag_overlap = q_tokens & tag_title_tokens
            
            # Boost score for title/tag match
            score = float(len(overlap)) + 1.5 * float(len(tag_overlap))
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
