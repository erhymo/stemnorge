/**
 * Disposable / temporary email domains that should be blocked at registration.
 * This is not exhaustive, but covers the most popular services.
 */
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "guerrillamail.com",
  "guerrillamail.de",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "grr.la",
  "sharklasers.com",
  "tempmail.com",
  "temp-mail.org",
  "temp-mail.io",
  "throwaway.email",
  "throwaway.me",
  "mailinator.com",
  "maildrop.cc",
  "dispostable.com",
  "yopmail.com",
  "yopmail.fr",
  "trashmail.com",
  "trashmail.me",
  "trashmail.net",
  "10minutemail.com",
  "10minutemail.net",
  "minutemail.com",
  "tempail.com",
  "tempr.email",
  "discard.email",
  "mailnesia.com",
  "fakeinbox.com",
  "emailondeck.com",
  "getnada.com",
  "nada.email",
  "mohmal.com",
  "burnermail.io",
  "tempinbox.com",
  "harakirimail.com",
  "mailcatch.com",
  "meltmail.com",
  "spamgourmet.com",
  "mytemp.email",
  "getairmail.com",
  "filzmail.com",
  "inboxbear.com",
  "mailexpire.com",
  "safetymail.info",
  "tempmailaddress.com",
  "crazymailing.com",
  "disposableemailaddresses.emailmiser.com",
  "guerrillamail.info",
  "mailtothis.com",
  "mailnull.com",
  "mailscrap.com",
  "tempmailo.com",
  "tmpmail.net",
  "tmpmail.org",
  "wegwerfmail.de",
  "wegwerfmail.net",
  "emailfake.com",
  "emltmp.com",
]);

const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

/**
 * Check whether the email domain is a known disposable/temporary email service.
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? DISPOSABLE_EMAIL_DOMAINS.has(domain) : false;
}

/**
 * Normalize a Gmail/Googlemail address to its canonical form:
 * - Remove dots from the local part (g.mail treats them as invisible)
 * - Remove everything after a `+` in the local part (alias trick)
 * - Normalize googlemail.com → gmail.com
 *
 * For non-Gmail addresses, only the `+` alias trick is stripped
 * (many providers support it: Outlook, Fastmail, ProtonMail, etc.)
 */
export function normalizeEmailAlias(email: string): string {
  const atIndex = email.lastIndexOf("@");

  if (atIndex === -1) {
    return email;
  }

  let local = email.slice(0, atIndex);
  let domain = email.slice(atIndex + 1).toLowerCase();

  // Strip +suffix for all providers
  const plusIndex = local.indexOf("+");

  if (plusIndex !== -1) {
    local = local.slice(0, plusIndex);
  }

  // Gmail-specific: remove dots and normalize domain
  if (GMAIL_DOMAINS.has(domain)) {
    local = local.replace(/\./g, "");
    domain = "gmail.com";
  }

  return `${local}@${domain}`;
}

