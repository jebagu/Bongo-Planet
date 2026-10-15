# Bongo Planet — one connection, one spark per route

Concept exploration, October 14, 2026. These mocks are illustrations, not implemented behavior. The game source was not changed during this exploration.

## User constraints

- One visible connection between neighboring vertices. No offset curved track over a straight facet seam.
- A spark belongs to a route, not a musical destination.
- The same spark continues through empty vertices, notes, and drums, exciting each occupied musical vertex as it passes.
- Sparks launched together use the same travel speed.
- Preserve the cute geometric shapes with eyes and no feet.

## Shared proposed behavior

A generator pulse launches one spark on each chosen route simultaneously. A route is an ordered walk along adjacent struts. It contains bends and can pass through multiple instruments. At a junction, the spark follows the route's chosen outgoing edge rather than splitting. Moving a musical piece changes which route will play it; it does not create another outbound spark. Empty vertices continue the journey silently. A hit causes a local brighten/squash response, with no surface ripple. A later generator pulse may legitimately launch a new spark on the same route.

Only the existing connection changes color underneath the spark and its short tail. Route selection, if exposed, uses the same connection geometry; direction hints appear during editing.

This requires route-driven musical scheduling. The existing engine commits separate destination triggers from direct angular distance and rhythm quantization. It cannot be retained unchanged while claiming that route passage causes the sounds. Route creation, loop/end behavior, generator reach, revisits, and quantization are decisions for a subsequent behavior design/implementation pass; these images do not resolve them.

## Displayed image mapping

1. painted-seams.png — single thin strokes aligned with the blue planet's straight triangular panel edges. Closest to the current faceted look.
2. toy-rails.png — single solid rounded struts; panel boundaries terminate at the struts, with no separate wire/seam layer.
3. open-constellation.png — remove the panels; one hollow spherical strut network defines the object. Rear connections recede in depth.

The order above records the order the three generated images were displayed in this chat, not an assumed asynchronous completion order.

## Generation provenance

Built-in Image Gen, three independent calls, transparent_background=false. Each used evidence/footless-characters/preview.png as its actual reference image. Requested desktop dimensions: 1440 × 1024. Returned images are 1487 × 1058; retained at their original dimensions without stretching.

Prompt set: production-quality primary-screen mockups grounded in the existing cream interface and blue/yellow/mint/coral palette; original geometric characters with eyes and no feet; exactly one structural connection per vertex pair; one visible spark continuing through a note–drum–note sequence; local musical reactions, no duplicate destination particles or circular wavefronts; variants defined by painted aligned seams, single physical toy rails, and an open hollow constellation respectively. The model rendered a longer highlighted route in these static mocks; a running implementation should limit transient glow to the spark and nearby tail.

Generated originals:

- painted-seams.png: exec-309a94b7-57cb-4c69-97c6-6cd13f5c8518.png
- toy-rails.png: exec-c911c4cd-2fad-4977-98c9-7f27128f6669.png
- open-constellation.png: exec-586795ac-8b6c-41c2-a593-b0138e7179f2.png

The user selected displayed option 1, Painted seams, and authorized the build. The implementation and route rules are recorded in design/Route-Journeys.md. Visual QA is recorded in the project-root design-qa.md.
