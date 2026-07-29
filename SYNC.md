# Project synchronization

```json
{
  "version": 1,
  "confirmedAt": "2026-07-29T14:30:35+01:00",
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
      "fingerprint": "sha256:d81d4ac78dc94dc7e1e75765d844d80e3b928e4776c10e9f075b4310e0265752",
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
      "fingerprint": "sha256:abd15e0df22172674bc133d40a4ec90e450a50123ecb23eba2e56c3f3ea76017"
    }
  ]
}
```
