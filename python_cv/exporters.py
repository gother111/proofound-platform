from __future__ import annotations

import csv
import io
import json
from typing import Iterable


def approved_skills_to_json_bytes(records: Iterable[dict[str, object]]) -> bytes:
    payload = {
        "approved_skills": list(records),
    }
    return json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")


def approved_skills_to_csv_bytes(records: Iterable[dict[str, object]]) -> bytes:
    rows = list(records)
    output = io.StringIO()

    fieldnames = [
        "document_id",
        "candidate_id",
        "raw_skill_text",
        "skill_id",
        "skill_name",
        "match_method",
        "score",
    ]

    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for row in rows:
        writer.writerow({key: row.get(key, "") for key in fieldnames})

    return output.getvalue().encode("utf-8")
