# Step 0: Motion-triggered capture

## Task

Add frame-diff motion detection to `WebcamCapture`. When `auto={true}`, compare consecutive frames every 2 seconds using a canvas pixel diff. If the diff exceeds a threshold (>2% of pixels changed by >30 brightness units), trigger a capture. This prevents burning Gemini quota on identical frames.

## AC

- Motion detection only runs when `auto={true}`
- A `motionThreshold` prop (default 0.02) controls sensitivity
- No capture fires when the frame is static for 10+ seconds
- Existing manual "Capture & analyze" button still works unchanged
- Typecheck passes (`npm run typecheck`)
