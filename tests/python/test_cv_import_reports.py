from __future__ import annotations

import api.python.cv_import as cv_import


def test_unique_top_skill_ids_preserves_first_ten_unique_ids():
    documents = [
        {
            "candidates": [
                {
                    "suggestions": [
                        {"skill_id": "skill-01"},
                        {"skill_id": "skill-02"},
                        {"skill_id": "skill-01"},
                    ]
                },
                {
                    "suggestions": [
                        {"skill_id": f"skill-{index:02d}"}
                        for index in range(3, 13)
                    ]
                },
            ]
        },
        {
            "candidates": [
                {
                    "suggestions": [
                        {"skill_id": "skill-13"},
                        {"skill_id": None},
                        {"skill_id": 14},
                    ]
                }
            ]
        },
    ]

    assert cv_import._unique_top_skill_ids(documents, "candidates") == [
        "skill-01",
        "skill-02",
        "skill-03",
        "skill-04",
        "skill-05",
        "skill-06",
        "skill-07",
        "skill-08",
        "skill-09",
        "skill-10",
    ]
