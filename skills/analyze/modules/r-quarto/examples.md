# R and Quarto examples

## One row per specimen

This invented dataset illustrates a simple question: how does mussel mass
vary with shell length? Each row represents a different mussel. We need both
measurements for the slope, so we count missing values in those two columns
before selecting complete cases.

```r
library(tidyr)

raw <- data.frame(
  length_mm = c(20, 22, 24, 26, 28, 30, 32, 34, 36),
  mass_g = c(2.0, 2.8, 2.5, 3.5, 3.1, 4.1, 4.0, 5.0, NA)
)
colSums(is.na(raw))
ds <- drop_na(raw, length_mm, mass_g)

m_mass <- lm(mass_g ~ length_mm, data = ds)
summary(m_mass)
```

A plot of these observations would use `ds` if its purpose were to show the
sample used to fit the line. The caption can say that one mussel was excluded
because its mass was missing. If the data held repeated measurements of the
same mussels, we would revisit the model before reporting the slope.

## Check grouping before fitting

In a tank experiment with several fish per tank, `count(ds, tank, treatment)`
shows both the number of fish per tank and which tanks share a treatment.
Consult the protocol to establish how treatments were assigned. A
nested table of row counts can show how many tank sizes occurred while hiding
which tanks or treatments need attention.

## Fix the figure and its caption together

A Quarto figure changes after cleaning. Identify which rows now enter the
figure and model; rerender the affected report and inspect the labels,
caption, and nearby results for stale sample sizes or claims. A successful
render alone will not catch the old number written in the caption.
