values <- c(2, 4, 6)
result_mean <- mean(values)
stopifnot(result_mean == 4)
cat(sprintf("mean=%s\n", result_mean))
