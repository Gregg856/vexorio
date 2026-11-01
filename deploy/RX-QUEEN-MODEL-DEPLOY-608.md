# RX #608 — Queen model deployment gate

Status: **not deployed or live-verified**. This document does not enable inference.

## Existing components
- `worker.js` validates administrator session before invoking `rx-queen-model-bridge.mjs`.
- `RX_QUEEN_MODEL_ENABLED` must be `true` in the **Worker** environment.
- `RX_QUEEN_MODEL_SERVICE` must be a valid Worker service binding implementing `POST /infer`.
- Existing `rx-bibi-own-inference.cjs` is a local token classifier, **not** a conversational language model and **not** the Queen service.

## Deployment prerequisites
1. Identify the actual deployed Worker configuration and RX CLOUD host without copying credentials into Git.
2. Provision a dedicated Queen model service implementing `POST /infer` with JSON input `{"message":"text"}` and output `{"answer":"text"}`; require bounded input/output and strict timeouts.
3. Configure the private `RX_QUEEN_MODEL_SERVICE` service binding and only then set `RX_QUEEN_MODEL_ENABLED=true` in the Worker environment. Do not confuse the local `rxcloud.env` with Worker bindings.
4. Check authenticated admin requests, unauthorized requests (403), model timeout and disabled fallback. Do not expose a public inference endpoint or send history, private memory, or admin credentials.
5. Verify an actual response with `modelInferenceUsed:true` before claiming that a model is live.

No model provisioning, server access, or live inference is claimed by this change.
