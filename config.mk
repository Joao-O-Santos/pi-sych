# SPDX-License-Identifier: CC0-1.0
# Site configuration adapted from make-it-stop.

PANDOC ?= pandoc
SITE_TITLE := Pi Sych
STAGE_DIR := .site-stage
PUBLIC_DIR := public
STATIC_DIR := site/static
TEMPLATES_DIR := site
IMAGE_DIR := docs/img
# Source/output pairs. Markdown remains the canonical site content.
SITE_PAGES := README.md index docs/ARCHITECTURE.md architecture docs/CONTRIBUTING.md contributing docs/configuration.md configuration docs/development.md development docs/review-workflow.md review-workflow docs/attribution.md attribution docs/code-tour.md code-tour $(STAGE_DIR)/code-reference.md code-reference $(if $(wildcard docs/public-contract.md),docs/public-contract.md public-contract)
