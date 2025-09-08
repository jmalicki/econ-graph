#!/bin/bash

NARRATION_FILE="demo-videos/honest_complete_narration.mp3"
OUTPUT_FILE="demo-videos/guided-econ-graph-interface.mp4"
TEMP_SCREEN_CAPTURE="temp_guided_screen_capture.mp4"
FRONTEND_URL="http://localhost:3000"

echo "🎬 Creating GUIDED Interface Demo - Shows Features Mentioned in Narration"
echo ""
echo "🌐 React app running at: $FRONTEND_URL"
echo "🎵 Using narration: $NARRATION_FILE"
echo "📁 Output will be: $OUTPUT_FILE"
echo ""

if [ ! -f "$NARRATION_FILE" ]; then
    echo "❌ Error: Narration file not found: $NARRATION_FILE"
    exit 1
fi

echo "🎵 Narration duration..."
DURATION=$(ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$NARRATION_FILE")
echo "🎵 Narration duration: ${DURATION} seconds"
echo ""

echo "🎯 GUIDED DEMO PLAN:"
echo "   📊 0-15s: Dashboard with key indicators"
echo "   🌍 15-35s: Navigate to Global Analysis -> Network Map"
echo "   📈 35-55s: Switch to Multi-Country Dashboard tab"
echo "   📅 55-75s: Switch to Global Events Explorer tab"
echo "   🔍 75s+: Return to dashboard and explore features"
echo ""

echo "🎥 Recording the GUIDED browser interaction..."
echo "📹 This will demonstrate the ACTUAL features mentioned in narration:"
echo "   ✅ Dashboard with economic indicators"
echo "   ✅ Global Economic Network Map (D3.js visualization)"
echo "   ✅ Multi-Country Dashboard with comparisons"
echo "   ✅ Global Events Explorer with timeline"
echo "   ✅ Real navigation and working interface"
echo ""

# Open the browser to the frontend URL
open "$FRONTEND_URL"

# Give the browser some time to load
sleep 5

echo "🎬 Starting guided recording..."
echo "📋 FOLLOW THIS SCRIPT DURING RECORDING:"
echo ""
echo "⏰ 0-15 seconds: Stay on Dashboard"
echo "   - Show the dashboard with economic indicators"
echo "   - Hover over the featured indicators cards"
echo "   - Show the trending data and collaboration features"
echo ""
echo "⏰ 15-35 seconds: Navigate to Global Analysis"
echo "   - Click the hamburger menu (3 lines) to open sidebar"
echo "   - Click 'Global Analysis' in the sidebar"
echo "   - The Network Map tab should be selected by default"
echo "   - Show the interactive world map visualization"
echo ""
echo "⏰ 35-55 seconds: Multi-Country Dashboard"
echo "   - Click the 'Multi-Country Dashboard' tab"
echo "   - Show the country comparison interface"
echo "   - Demonstrate the interactive elements"
echo ""
echo "⏰ 55-77 seconds: Global Events Explorer"
echo "   - Click the 'Global Events' tab"
echo "   - Show the economic events timeline"
echo "   - Hover over event items to show details"
echo ""
echo "Press ENTER when ready to start recording..."
read

# Record the screen for the duration of the narration
# Using avfoundation for macOS screen capture
ffmpeg -f avfoundation -i "1:0" -t "$DURATION" -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p "$TEMP_SCREEN_CAPTURE" -y

if [ $? -ne 0 ]; then
    echo "❌ Error during screen recording."
    exit 1
fi

echo ""
echo "🎵 Adding narration to the guided screen recording..."
ffmpeg -i "$TEMP_SCREEN_CAPTURE" -i "$NARRATION_FILE" \
    -c:v copy -c:a aac -b:a 192k -map 0:v:0 -map 1:a:0 \
    -shortest "$OUTPUT_FILE" -y

if [ $? -eq 0 ]; then
    echo "✅ Guided interface video created: $OUTPUT_FILE"
    FINAL_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo "📊 File size: ${FINAL_SIZE}"
    echo ""
    echo "🎯 This guided video demonstrates:"
    echo "   ✅ ACTUAL screen recording with guided navigation"
    echo "   ✅ Features mentioned in narration are SHOWN"
    echo "   ✅ Dashboard -> Global Analysis -> Network Map"
    echo "   ✅ Multi-Country Dashboard and Global Events"
    echo "   ✅ Real React components and Material-UI interface"
    echo "   ✅ NO fake text boxes - genuine navigation flow"
    echo ""
    echo "🌐 Live interface: $FRONTEND_URL"
    echo "📋 Navigation path: Dashboard -> Sidebar -> Global Analysis"
else
    echo "❌ Error combining screen recording with narration."
    exit 1
fi

# Clean up temporary file
rm "$TEMP_SCREEN_CAPTURE"

echo ""
echo "🎬 Opening the guided demo video..."
open "$OUTPUT_FILE"
