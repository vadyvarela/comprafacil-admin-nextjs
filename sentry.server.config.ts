// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import {
  sentryDataCollection,
  sentryTracesSampleRate,
} from "@/lib/observability/sentry-options"

Sentry.init({
  dsn: "https://ffd6372cc78f69c8dea4d65c5aa79616@o4511927721066496.ingest.de.sentry.io/4511927896506448",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: sentryTracesSampleRate(),

  // Enable logs to be sent to Sentry
  enableLogs: true,

  dataCollection: sentryDataCollection,
});
