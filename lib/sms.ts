/**
 * SMS notification module
 * Supports OVH SMS API. Set these env vars:
 * - OVH_SMS_ACCOUNT: Your OVH SMS account (e.g., sms-xx12345-1)
 * - OVH_SMS_LOGIN: API login
 * - OVH_SMS_PASSWORD: API password
 * - OVH_SMS_SENDER: Sender name (e.g., "LaBrieImmo")
 * - SMS_ENABLED: Set to "true" to enable SMS sending
 */

const SMS_ENABLED = process.env.SMS_ENABLED === "true";

interface SmsOptions {
  to: string;
  message: string;
}

/**
 * Send an SMS via OVH API
 * Falls back to console.log if SMS is not configured
 */
export async function sendSms({ to, message }: SmsOptions): Promise<boolean> {
  if (!SMS_ENABLED) {
    console.log(`[sms] SMS disabled. Would send to ${to}: ${message.substring(0, 50)}...`);
    return false;
  }

  const account = process.env.OVH_SMS_ACCOUNT;
  const login = process.env.OVH_SMS_LOGIN;
  const password = process.env.OVH_SMS_PASSWORD;
  const sender = process.env.OVH_SMS_SENDER || "LaBrieImmo";

  if (!account || !login || !password) {
    console.warn("[sms] OVH SMS credentials not configured");
    return false;
  }

  // Clean phone number: ensure +33 format
  let phone = to.replace(/\s/g, "").replace(/\./g, "");
  if (phone.startsWith("0")) phone = "+33" + phone.substring(1);
  if (!phone.startsWith("+")) phone = "+33" + phone;

  try {
    const res = await fetch(`https://www.ovh.com/cgi-bin/sms/http2sms.cgi`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        account,
        login,
        password,
        from: sender,
        to: phone,
        message,
        noStop: "1",
      }),
    });

    const text = await res.text();
    if (text.includes("OK")) {
      console.log(`[sms] SMS sent to ${phone}`);
      return true;
    } else {
      console.error(`[sms] Failed to send SMS: ${text}`);
      return false;
    }
  } catch (err) {
    console.error("[sms] Error sending SMS:", err);
    return false;
  }
}

/**
 * Send SMS for key workflow steps
 */
export async function sendLeadStatusSms(
  phone: string | null | undefined,
  ambassadorName: string,
  leadName: string,
  status: string
): Promise<void> {
  if (!phone) return;

  const messages: Record<string, string> = {
    COMPROMIS_SIGNE: `Bonne nouvelle ${ambassadorName} ! Le compromis pour ${leadName} est signé. Votre commission se rapproche !`,
    ACTE_SIGNE: `Félicitations ${ambassadorName} ! L'acte de vente pour ${leadName} est signé chez le notaire.`,
    COMMISSION_VERSEE: `${ambassadorName}, votre commission pour ${leadName} a été versée ! Consultez votre espace The Club.`,
    RECONNAISSANCE_HONORAIRES: `${ambassadorName}, la reconnaissance d'honoraires pour ${leadName} est prête à signer sur The Club.`,
  };

  const msg = messages[status];
  if (msg) {
    await sendSms({ to: phone, message: msg });
  }
}
