const TIGHT_MARGIN_RATE = 10;
const STABLE_MARGIN_RATE = 20;
const TIGHT_FIXED_RATIO = 0.7;

export function computeMarginHealth(summary) {
  if (summary.transactionCount === 0 || summary.netIncomeMinor <= 0) {
    return {
      status: "INSUFFICIENT_DATA",
      reason: "Log some income and expenses to see your margin health."
    };
  }

  const fixedRatio = summary.fixedExpensesMinor / summary.netIncomeMinor;

  if (summary.netMarginMinor < 0) {
    return {
      status: "NEGATIVE",
      reason: "Your expenses exceed your income this period. Fixed and variable spending together are outrunning what came in.",
      fixedRatio
    };
  }

  if (summary.marginRate < TIGHT_MARGIN_RATE || fixedRatio > TIGHT_FIXED_RATIO) {
    return {
      status: "TIGHT",
      reason:
        fixedRatio > TIGHT_FIXED_RATIO
          ? "Your fixed baseline consumes a large portion of current net income, leaving limited flexibility for variable spending."
          : "Your margin rate is low — most of your income is already spoken for by the time expenses are covered.",
      fixedRatio
    };
  }

  if (summary.marginRate < STABLE_MARGIN_RATE) {
    return {
      status: "STABLE",
      reason: "Income covers your obligations with a moderate buffer. There's room, but not a wide one.",
      fixedRatio
    };
  }

  return {
    status: "HEALTHY",
    reason: "Your margin rate is strong relative to your fixed baseline, leaving real room to save or plan ahead.",
    fixedRatio
  };
}
