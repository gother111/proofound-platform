from __future__ import annotations

from python_cv.entity_extract import extract_all_entities


def test_extracts_work_learning_volunteering_and_languages_sections():
    text = """
Experience
Senior Engineer at Acme
2021 - Present
Built platform features.

Education
University of Stockholm
Master of Science in Computer Science
2018 - 2020

Volunteering
Mentor at Code Club
2020 - Present
Supported students.

Languages
English C2
Swedish B2
"""

    entities = extract_all_entities(text)

    assert len(entities["work_experiences"]) >= 1
    assert entities["work_experiences"][0]["title"].lower().startswith("senior engineer")

    assert len(entities["learning_experiences"]) >= 1
    assert "University" in str(entities["learning_experiences"][0]["institution"])

    assert len(entities["volunteering"]) >= 1
    assert "Mentor" in str(entities["volunteering"][0]["title"])

    language_codes = [item["language_code"] for item in entities["languages"]]
    assert "en" in language_codes
    assert "sv" in language_codes
