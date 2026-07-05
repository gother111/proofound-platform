# Threat Model

## Main Risks And Mitigations

| Risk                                           | Mitigation in this slice                                                           | Remaining work                                             |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| User uploads a spoofed file type               | Magic-byte validation for PDF, PNG, and JPEG                                       | Add adversarial binary fixtures to regression corpus       |
| Accept endpoint becomes generic profile writer | Accept requires `ready_for_review` and stored draft IDs                            | Add database-backed integration test                       |
| Expired sessions remain usable                 | Non-final expired sessions now fail with `START_FROM_CV_SESSION_EXPIRED`           | Add cleanup cron evidence                                  |
| Trial provider receives real CV data           | Provider policy blocks DeepSeek/NVIDIA for `personal_data`                         | Add synthetic-only trial smoke evidence before any adapter |
| AI output creates hiring evaluation            | Forbidden language guardrails, review-only schema, no scoring/ranking copy         | Continue launch AI gate coverage                           |
| Skill mention creates unearned trust           | Skill mapping drafts are review-only with no trust/matching/verification lift      | Add explicit UI copy in future skill review surfaces       |
| Raw CV text leaks to logs                      | Existing redaction and usage-log hashes retained; no raw prompt logging path added | Add log inspection evidence for a live synthetic run       |
