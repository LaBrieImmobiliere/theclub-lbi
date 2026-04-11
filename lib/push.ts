import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// Configure VAPID
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:contact@labrieimmobiliere.fr",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  url?: string
) {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) return;

    const payload = JSON.stringify({
      title,
      body,
      url: url || "/",
      icon: "/apple-touch-icon.png",
      badge: "/apple-touch-icon.png",
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
        } catch (error: unknown) {
          // If subscription is expired/invalid, delete it
          const statusCode = (error as { statusCode?: number })?.statusCode;
          if (statusCode === 410 || statusCode === 404) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
          throw error;
        }
      })
    );

    return results;
  } catch {
    // Push failure should never block the main flow
  }
}
