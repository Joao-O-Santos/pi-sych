# Reporting examples

The studies and numbers below are illustrative.

## An association in familiar units

> Mussels with longer shells tend to be heavier. For each additional
> millimetre of shell length, the model estimates 0.19 g more mass on average,
> *b* = 0.19 g/mm, *SE* = 0.03 g/mm, *t*(6) = 6.78, *p* < .001.

This paragraph reports the slope from the [R example](../r-quarto/examples.md).
It compares mussels of different lengths. If the question were whether an
individual gains mass at this rate as it grows, we would need a different
study. If the audience needs a significance statement, write “There is
statistically significant evidence that mussels with longer shells are
heavier.” Here significance qualifies the evidence; the estimate and units
tell the reader how large the association is.

## An interaction worth explaining

Suppose we randomly assigned tanks to four conditions, crossing two water
temperatures with two light levels. Each tank yielded one mean growth rate,
and the analysis uses tanks as replicates.

> Warming increased growth more in bright light than in dim light. The
> estimated effect of warming was 0.8 mm/week in bright light and 0.2 mm/week
> in dim light. The difference between those effects was 0.6 mm/week,
> 95% CI [0.2, 1.0].

The last estimate answers the interaction question directly. It would still
be the right comparison if the separate warming tests both had *p* < .05.

## A Discussion point that adds something

> Warmer tanks lost more water to evaporation. If this increased salinity
> enough to affect growth, the temperature contrast may partly reflect a
> change in salinity. Replacing evaporated water during the experiment would
> help separate the two effects.

Use this explanation only when evaporation is a plausible feature of the
actual design. It gives the reader a concrete alternative and a way to
investigate it.
