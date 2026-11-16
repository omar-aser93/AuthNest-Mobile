import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

export function useNotificationNavigation(enabled: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    let active = true;

    const handle = (n: Notifications.Notification) => {
      const url = (n.request.content.data as { url?: string } | undefined)?.url;
      if (typeof url !== 'string' || !url.startsWith('/')) return;   // internal routes only
      router.push(url as never);
    };

    // Cold-start path — fires once for a terminated launch
    Notifications.getLastNotificationResponseAsync()
      .then(resp => {
        if (!active || !resp?.notification) return;
        handle(resp.notification);
        Notifications.clearLastNotificationResponse();   // prevent re-navigation on effect re-run
      })
      .catch(() => {});

    // Runtime path — fires on every tap while app is running/backgrounded
    const sub = Notifications.addNotificationResponseReceivedListener(resp => {
      handle(resp.notification);
    });

    return () => { active = false; sub.remove(); };
  }, [enabled, router]);
}