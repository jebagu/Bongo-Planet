# Bongo Planet — S08-A9 acceptance decision

**Pass for the tested camera/output independence requirement. The acquisition helper remains failed and S08-A11 remains open.**

The original check is “Camera matrices do not affect output positions.” The actual paused F07 orbit moved the camera by 4.794116609 world units, and wheel zoom changed its radius by 0.244080090. The complete scene and all six receiver node/object identities and world coordinates stayed exactly unchanged. Six initial position sends have ordered receiver and independently decoded raw OSC matches. The static interval contained zero resends, which is a valid unchanged-output observation. Source computes world positions independently of the camera.

The actual loaded main body and served-before body both bind SHA256 `32b57ff2dabeadc3d85f8143cd91c50abeea9785ebb1a2f35497ee1db198bb93`; root's separate served-after supplement confirms unchanged served state. Independent review corroborates the static scene, meaningful camera changes, packet identities and coordinates. This is a finite Chrome orbit/zoom and model/output pass; it does not inspect every matrix, qualify all orientations/devices, or establish acoustic output.

The helper's subsequent concurrent gesture failed its camera-displacement assertion at the north-pole clamp. Its failed report, source, error, controller and runner artifacts remain unchanged. No interpolation timing or sustained-source/camera-motion pass is inferred from that prefix. The 15/2 FPS cases were not attempted. S08-A11 and all milestones remain open.

Evidence: [original report](report.json), [independent readback](Actual-IndependentReview.md), [root supplement](Root-Readback.json), [execution record](RootExecution.json), [failed-gesture analysis](Review.md), and [prelaunch GO](../preparation/Root-Actual-GO.json).
