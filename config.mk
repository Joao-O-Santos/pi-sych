# SPDX-License-Identifier: CC0-1.0
# Site configuration adapted from make-it-stop.

PANDOC ?= pandoc
SITE_TITLE := Pi Sych
STAGE_DIR := .site-stage
PUBLIC_DIR := public
STATIC_DIR := static
TEMPLATES_DIR := templates/site
IMAGE_DIR := docs/img
# Source/output pairs. Markdown remains the canonical site content.
SITE_PAGES := README.md index ARCHITECTURE.md architecture CONTRIBUTING.md contributing docs/configuration.md configuration docs/development.md development docs/review-workflow.md review-workflow docs/attribution.md attribution $(if $(wildcard docs/public-contract.md),docs/public-contract.md public-contract)
