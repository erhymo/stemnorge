export function normalizePhoneNumber(phone: string) {
  let digits = phone.replace(/[^0-9]/g, "");

  if (digits.startsWith("0047")) {
    digits = digits.slice(4);
  } else if (digits.startsWith("47") && digits.length === 10) {
    digits = digits.slice(2);
  }

  if (digits.length !== 8) {
    return null;
  }

  return `+47${digits}`;
}