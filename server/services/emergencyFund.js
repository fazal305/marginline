export function computeEmergencyFund(db, fixedExpensesMinor) {
  const settings = db.prepare("SELECT * FROM emergency_fund WHERE id = 1").get();
  const targetMinor = Math.round(fixedExpensesMinor * settings.target_months);
  const currentReserveMinor = settings.current_reserve_minor;
  const remainingMinor = Math.max(0, targetMinor - currentReserveMinor);
  const progressPct = targetMinor > 0 ? Math.min(100, (currentReserveMinor / targetMinor) * 100) : 0;
  const monthsCovered = fixedExpensesMinor > 0 ? currentReserveMinor / fixedExpensesMinor : null;

  return {
    targetMonths: settings.target_months,
    fixedBaselineMinor: fixedExpensesMinor,
    targetMinor,
    currentReserveMinor,
    remainingMinor,
    progressPct,
    monthsCovered
  };
}
