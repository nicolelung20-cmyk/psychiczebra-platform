# TikTok LIVE source

Elevat Command exposes an authenticated ingestion source at `/api/integrations/tiktok/live`.

POST JSON event payloads with `x-tiktok-event-secret` set to the production secret. Supported event types: connect, disconnect, follow, share, comment, gift, like, join, viewer_count, live_end, subscribe, poll, battle.

This endpoint is the source adapter; a TikTok-compatible event producer/relay must forward live events to it. Trading and financial actions remain approval-gated.
