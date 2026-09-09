export function projectPayoffMonths(currentBalanceMinor, interestRate, monthlyPaymentMinor) {
  if (currentBalanceMinor <= 0) return 0;
  if (monthlyPaymentMinor <= 0) return null;

  const monthlyRate = interestRate / 100 / 12;

  if (monthlyRate === 0) {
    return Math.ceil(currentBalanceMinor / monthlyPaymentMinor);
  }

  const interestPortion = currentBalanceMinor * monthlyRate;
  if (monthlyPaymentMinor <= interestPortion) {
    return null;
  }

  const months = -Math.log(1 - interestPortion / monthlyPaymentMinor) / Math.log(1 + monthlyRate);
  return Math.ceil(months);
}
