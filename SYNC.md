# Project synchronization

``` json
{
  "version": 1,
  "confirmedAt": "2026-07-30T19:08:14.650Z",
  "artifacts": [
    {
      "path": "PROJECT.md",
      "fingerprint": "sha256:c30e106c3eeebdd66c359049bec1b9beb774f991d0ab3b58ea7b9b8c34059bfe",
      "status": "current",
      "role": "project",
      "authoritativeFor": [
        "objective",
        "scope",
        "contribution",
        "constraints",
        "accepted-direction"
      ],
      "acknowledgement": {
        "at": "2026-07-30T18:50:12.097Z",
        "reason": "Reviewed the final v1.2.0 project state, evidence, architecture, human documentation, latest-dependency manifest, Pandoc formatting workflow, and completed release-gate results."
      }
    },
    {
      "path": "EVIDENCE.md",
      "fingerprint": "sha256:9744b8d140e0800c66400550c3fe35b34fea4a52cc4f794b15852ed232114cf8",
      "status": "current",
      "role": "evidence",
      "authoritativeFor": [
        "verification-support",
        "skill-corpus-support",
        "limitations"
      ],
      "updateFrom": [
        "package.json",
        "tests/unit",
        "tests/integration"
      ],
      "acknowledgement": {
        "at": "2026-07-30T19:07:46.286Z",
        "reason": "Reviewed the v1.2.0 Pandoc 3.10.1 CI correction, corrected release-gate evidence, packaged formatter script dependency, and final development guidance."
      }
    },
    {
      "path": "ARCHITECTURE.md",
      "fingerprint": "sha256:c93f947b6756576dfd3ec9eeb47bebf75125e1677a5f8166ce00ca3390809dc1",
      "status": "current",
      "role": "architecture",
      "authoritativeFor": [
        "implemented-architecture"
      ],
      "acknowledgement": {
        "at": "2026-07-30T18:50:12.097Z",
        "reason": "Reviewed the final v1.2.0 project state, evidence, architecture, human documentation, latest-dependency manifest, Pandoc formatting workflow, and completed release-gate results."
      }
    },
    {
      "path": "README.md",
      "fingerprint": "sha256:704bf3b16de8c9b788b4ef03811745663ffd9d43e18c6377962428612571ecaa",
      "status": "current",
      "role": "documentation",
      "authoritativeFor": [
        "package-usage",
        "human-review-limits"
      ],
      "updateFrom": [
        "ARCHITECTURE.md",
        "package.json"
      ],
      "acknowledgement": {
        "at": "2026-07-30T19:08:14.650Z",
        "reason": "Reviewed README compatibility with the final v1.2.0 package metadata, latest-dependency policy, versioned assets, and packaged Pandoc formatter."
      }
    },
    {
      "path": "package.json",
      "fingerprint": "sha256:690b6723a29ae4ed0346b5e7e7551b02e956f47bea56f20eabc4df4c632ae277",
      "status": "current",
      "role": "package-boundary",
      "authoritativeFor": [
        "scripts",
        "Pi-discovery"
      ],
      "updateFrom": [
        "extensions",
        "skills",
        "tests",
        "scripts"
      ],
      "acknowledgement": {
        "at": "2026-07-30T19:07:46.286Z",
        "reason": "Reviewed the v1.2.0 Pandoc 3.10.1 CI correction, corrected release-gate evidence, packaged formatter script dependency, and final development guidance."
      }
    },
    {
      "path": "docs/CONFIGURATION.md",
      "fingerprint": "sha256:8775ffd8afabaeb77783eba22cca41c26568d0f1bd3eba0f3de3a242799434a0",
      "status": "current",
      "role": "documentation",
      "authoritativeFor": [
        "configuration"
      ],
      "acknowledgement": {
        "at": "2026-07-30T18:50:12.097Z",
        "reason": "Reviewed the final v1.2.0 project state, evidence, architecture, human documentation, latest-dependency manifest, Pandoc formatting workflow, and completed release-gate results."
      }
    },
    {
      "path": "docs/DEVELOPMENT.md",
      "fingerprint": "sha256:c7cd6471f8de9325ee8487d770147d91d70d2e8898b26895ed71952fc9d2946b",
      "status": "current",
      "role": "documentation",
      "authoritativeFor": [
        "development-checks"
      ],
      "acknowledgement": {
        "at": "2026-07-30T19:07:46.286Z",
        "reason": "Reviewed the v1.2.0 Pandoc 3.10.1 CI correction, corrected release-gate evidence, packaged formatter script dependency, and final development guidance."
      }
    }
  ]
}
```
