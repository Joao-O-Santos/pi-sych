# Project synchronization

```json
{
  "version": 1,
  "confirmedAt": "2026-07-29T03:51:40+01:00",
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
      "fingerprint": "sha256:ceb904a5d65bd19824469e7ebaca76fa1e704af8eacc4a9f7c83da4917f0704c"
    },
    {
      "path": "README.md",
      "role": "documentation",
      "status": "current",
      "authoritativeFor": ["package-usage", "human-review-limits"],
      "fingerprint": "sha256:19b6dfb637c18402631104d04b44b25766c807cb749cdc17137b45c95ed6d387",
      "updateFrom": ["ARCHITECTURE.md", "package.json"]
    },
    {
      "path": "package.json",
      "role": "package-boundary",
      "status": "current",
      "authoritativeFor": ["scripts", "Pi-discovery"],
      "fingerprint": "sha256:c680f99607375e1bee499bd7cd0973d14c9d7fa9c3aedc833dbc6654e16ea019",
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
