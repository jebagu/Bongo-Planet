# Bongo Planet — buffer observation premise

The [WebSockets standard](https://websockets.spec.whatwg.org/#dom-websocket-bufferedamount) defines the counter from application data queued by sends, using event-loop state. This supports treating an observed low followed by a high as requiring a send that adds bytes.

[Published Chromium source at tag155.0.8059.39](https://chromium.googlesource.com/chromium/src/+/refs/tags/155.0.8059.39/third_party/blink/renderer/modules/websockets/dom_websocket.cc) increments the counter in send methods and reflects consumption through context tasks/callbacks. The installed Info.plist has that version. Retained source, retrieval hash and license allow readback; matching version metadata does not attest reproducible binary inputs.

The actual guard must reject observed lows in producer callback boundaries and same-socket sends during the proposed continuous congestion interval. Sampling alone does not suffice. No getter replacement, fabricated buffer, production change or actual run follows from this note.
