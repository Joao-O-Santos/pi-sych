# Architecture examples

Bad:

> Add factories, registries, and plugins so future integrations are easy.

Better:

> Add the one direct integration. Name the concrete second use and differing boundary required before
> introducing an abstraction.

Why: speculative extensibility is not a demonstrated design constraint.
