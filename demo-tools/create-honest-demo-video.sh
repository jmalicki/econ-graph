#!/bin/bash

echo "🎬 Creating HONEST Demo Video with Manual Recording"
echo ""

HTML_DEMO_FILE="demo-videos/honest-global-analysis-demo.html"
NARRATION_FILE="demo-videos/honest_complete_narration.mp3"

if [ ! -f "$HTML_DEMO_FILE" ]; then
    echo "Error: HTML demo file not found at $HTML_DEMO_FILE"
    exit 1
fi

if [ ! -f "$NARRATION_FILE" ]; then
    echo "Error: Narration file not found at $NARRATION_FILE"
    exit 1
fi

echo "📂 Opening the honest HTML demo..."
open "$HTML_DEMO_FILE"

echo ""
echo "🎥 MANUAL RECORDING INSTRUCTIONS:"
echo ""
echo "This demo has HONEST narration that only describes what's actually implemented:"
echo "• 5 sample countries (not 47)"
echo "• 3 sample correlations (not 1,081)"
echo "• 6 sample events (not 127)"
echo "• Sample data only (no real APIs)"
echo "• Prototype UI concepts"
echo ""
echo "1. Press Cmd+Shift+5 to open macOS screen recording"
echo "2. Select 'Record Selected Portion' and select the browser window"
echo "3. Click 'Record' to start"
echo "4. Follow the narration timing (1 minute 8 seconds):"
echo "   - Start with Global Network Map tab"
echo "   - Click between countries to show selection"
echo "   - Adjust the correlation threshold slider"
echo "   - Switch to Multi-Country Dashboard tab"
echo "   - Show the comparison cards"
echo "   - Switch to Global Events Explorer tab"
echo "   - Show the event filtering"
echo "5. Stop recording after ~1 minute 10 seconds"
echo "6. Save the video as 'honest-demo-recording.mov' in this directory"
echo ""
echo "Once you have the recording, run: ./combine-honest-demo.sh"
echo ""
echo "✅ Honest HTML demo is now open in your browser - start recording!"
echo "🎵 Play the narration file to follow along: demo-videos/honest_complete_narration.mp3"
