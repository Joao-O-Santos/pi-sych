# Project synchronization

```json
{
  "version": 1,
  "confirmedAt": "2026-07-29T02:10:51+01:00",
  "artifacts": [
    {
      "path": "PROJECT.md",
      "role": "project",
      "status": "current",
      "authoritativeFor": ["objective", "scope", "contribution", "constraints", "accepted-direction"],
      "fingerprint": "sha256:34891164b766d8c846c8609c03edc089218df34243dee8450162756ec2cf86e7"
    },
    {
      "path": "EVIDENCE.md",
      "role": "evidence",
      "status": "current",
      "authoritativeFor": ["verification-support", "skill-corpus-support", "limitations"],
      "fingerprint": "sha256:1447f2dafcbe0305e82d3c18966e3ee9d6b0aeb1f48e0032cc2f189b4e2730c0",
      "updateFrom": ["package.json", "tests/unit", "tests/integration"]
    },
    {
      "path": "ARCHITECTURE.md",
      "role": "architecture",
      "status": "current",
      "authoritativeFor": ["implemented-architecture"],
      "fingerprint": "sha256:2a673eb69328f0f0d26f009496a70093250dade94753c5f37ad6e6dc15e4ff3f"
    },
    {
      "path": "README.md",
      "role": "documentation",
      "status": "current",
      "authoritativeFor": ["package-usage", "human-review-limits"],
      "fingerprint": "sha256:fb16e78a8759c8e9d9546b5083e2dedaa98aa20d95f0cea1cd044d31191cd4ea",
      "updateFrom": ["ARCHITECTURE.md", "package.json"]
    },
    {
      "path": "package.json",
      "role": "package-boundary",
      "status": "current",
      "authoritativeFor": ["scripts", "Pi-discovery"],
      "fingerprint": "sha256:e03e1204dcd532c465c00be136c8ce07e1e70b2cf1720f569f6a42edfc1ae059",
      "updateFrom": ["extensions", "skills", "tests"]
    },
    {
      "path": "docs/CONFIGURATION.md",
      "role": "documentation",
      "status": "current",
      "authoritativeFor": ["configuration"],
      "fingerprint": "sha256:0ab1d873d906b317647f658528e3df5ebdf8f52bae7a25ffe4b07628dcd2ec04"
    },
    {
      "path": "docs/DEVELOPMENT.md",
      "role": "documentation",
      "status": "current",
      "authoritativeFor": ["development-checks"],
      "fingerprint": "sha256:69ecb6f2a38dddd902ebae93daaf9973ef509d6eae455ab79bd046b899d49912"
    }
  ]
}
```
