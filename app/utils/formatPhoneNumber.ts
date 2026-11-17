export default function formatPhoneNumber(value: string) {
  const numbersOnly = value.replace(/\D/g, "").substring(0, 11);

  if (numbersOnly.length === 11)
    return numbersOnly.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  if (numbersOnly.length === 10)
    return numbersOnly.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");

  return numbersOnly
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{4,5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
}
