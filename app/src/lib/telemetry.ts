import * as Sentry from '@sentry/react';
import { isTauri } from '@/lib/tauri-env';
import { TelemetryEvent, type TelemetryEventProps } from '@/constants/events';

let initialized = false;
let aptabaseInitialized = false;
let trackAptabaseEvent: ((eventName: string, props?: Record<string, string | number>) => Promise<void>) | null = null;

function isTelemetryEnabled(): boolean {
  const flag = import.meta.env.VITE_ENABLE_TELEMETRY;
  if (!flag) return true;
  return flag.toLowerCase() !== 'false';
}

async function initAptabase() {
  if (aptabaseInitialized) return;

  try {
    console.log('[Aptabase Debug] Starting initialization...');
    console.log('[Aptabase Debug] App Key:', import.meta.env.VITE_APTABASE_APP_KEY);
    console.log('[Aptabase Debug] Is Tauri:', isTauri());
    console.log('[Aptabase Debug] Telemetry Enabled:', isTelemetryEnabled());

    // Use Aptabase Web SDK instead of Tauri SDK
    const { init, trackEvent: track } = await import('@aptabase/web');
    const appKey = import.meta.env.VITE_APTABASE_APP_KEY;

    if (appKey) {
      console.log('[Aptabase Debug] Calling init() with Web SDK...');
      await init(appKey, {
        // Configure for Tauri environment
        appVersion: import.meta.env.APP_VERSION || '1.0.6',
      });

      aptabaseInitialized = true;
      trackAptabaseEvent = track;

      console.log('[Aptabase Debug] Aptabase initialized successfully with Web SDK');

      // Track app start event
      console.log('[Aptabase Debug] Tracking app_started event...');
      await trackAptabaseEvent(TelemetryEvent.APP_STARTED);
      console.log('[Aptabase Debug] Event tracked successfully');
    } else {
      console.warn('[Aptabase Debug] Skipped: appKey is missing');
    }
  } catch (error) {
    console.error('[Aptabase Debug] Failed to initialize Aptabase:', error);
    console.error('[Aptabase Debug] Error details:', error instanceof Error ? error.stack : String(error));
  }
}

export function initTelemetry() {
  if (initialized || !isTelemetryEnabled()) return;

  // Initialize Aptabase
  initAptabase();

  // Initialize Sentry
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (dsn) {
    Sentry.init({
      dsn,
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
      integrations: [Sentry.browserTracingIntegration()],
      tracesSampleRate: 0.2,
    });
  }

  initialized = true;
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!initialized) return;
  Sentry.captureException(error, {
    extra: context,
  });
}

export function trackEvent(eventName: TelemetryEvent, props?: TelemetryEventProps) {
  console.log('[Aptabase Debug] trackEvent called:', eventName, props);

  if (!isTelemetryEnabled()) {
    console.warn('[Aptabase Debug] Telemetry disabled, skipping event');
    return;
  }

  if (!aptabaseInitialized || !trackAptabaseEvent) {
    console.warn('[Aptabase Debug] Aptabase not initialized, skipping event');
    return;
  }

  console.log('[Aptabase Debug] Sending event to Aptabase via Web SDK...');
  trackAptabaseEvent(eventName, props as Record<string, string | number>)
    .then(() => {
      console.log('[Aptabase Debug] Event sent successfully:', eventName);
    })
    .catch((error) => {
      console.error('[Aptabase Debug] Failed to send event:', error);
    });
}
