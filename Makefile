# SPDX-License-Identifier: BSD-3-Clause
# Copyright (c) 2025 João Oliveira Santos and Carlos Pinto Machado
# Adapted for Pi Sych from make-it-stop.

include config.mk

.PHONY: all site format typecheck style dependencies budget test coverage pack verify benchmark clean

all: site

format:
	npm run format:fix
	npm run markdown:fix

typecheck:
	npm run typecheck

style:
	npm run style

dependencies:
	npm run test:deps

budget:
	npm run source:budget

test:
	npm test

coverage:
	npm run test:coverage

pack:
	npm pack --dry-run

verify: typecheck style dependencies budget test pack
	git diff --check

.NOTPARALLEL: verify

benchmark:
	@test -n "$(CONFIG)" || { echo "Usage: make benchmark CONFIG=/absolute/path/to/benchmark.json" >&2; exit 1; }
	npm run benchmark -- "$(CONFIG)"

site:
	@set -eu; \
	stage="$(STAGE_DIR)"; \
	trap 'rm -rf "$$stage"' EXIT; \
	rm -rf "$$stage"; \
	mkdir -p "$$stage"; \
	cp -R "$(STATIC_DIR)/." "$$stage/"; \
	cp -R "$(IMAGE_DIR)" "$$stage/img"; \
	node scripts/generate-code-reference.mjs "$$stage/code-reference.md"; \
	set -- $(SITE_PAGES); \
	while [ "$$#" -gt 0 ]; do \
		source="$$1"; target="$$2"; shift 2; \
		test -f "$$source" || { echo "Missing site input: $$source" >&2; exit 1; }; \
		mkdir -p "$$stage/sources"; \
		node scripts/site-links.mjs rewrite "$$source" "$$stage/sources/$$target.md"; \
		"$(PANDOC)" --from markdown --standalone --template "$(TEMPLATES_DIR)/page.html" --metadata "title=$(SITE_TITLE) — $$target" --output "$$stage/$$target.html" "$$stage/sources/$$target.md"; \
	done; \
	rm -rf "$$stage/sources"; \
	node scripts/site-links.mjs validate "$$stage"; \
	rm -rf "$(PUBLIC_DIR)"; \
	mv "$$stage" "$(PUBLIC_DIR)"; \
	trap - EXIT; \
	echo "Built $(PUBLIC_DIR)/"

clean:
	@rm -rf "$(STAGE_DIR)" "$(PUBLIC_DIR)" .test-build coverage-v8
