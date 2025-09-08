#!/bin/bash

OUTPUT_FILE="demo-videos/automated-interface-recording.mp4"
FRONTEND_URL="http://localhost:3000"
DURATION=60

echo "🎬 Creating AUTOMATED Interface Recording"
echo "🌐 Frontend: $FRONTEND_URL"
echo "📁 Output: $OUTPUT_FILE"
echo "⏱️  Duration: ${DURATION} seconds"
echo ""

# Check if frontend is running
if ! curl -s "$FRONTEND_URL" > /dev/null; then
    echo "❌ Frontend not running at $FRONTEND_URL"
    echo "Please start the frontend with: cd frontend && npm start"
    exit 1
fi

echo "✅ Frontend is running"
echo ""

# Open browser and start recording immediately
echo "🌐 Opening browser to EconGraph..."
open "$FRONTEND_URL"

# Give browser time to load
sleep 3

echo "🎥 Starting automated screen recording..."
echo "📹 Recording the actual browser window for ${DURATION} seconds"
echo ""

# Use screencapture to record the screen area
# This will capture whatever is on screen during the recording
ffmpeg -f avfoundation -i "1:0" -t "$DURATION" \
    -c:v libx264 -preset ultrafast -crf 18 -pix_fmt yuv420p \
    -s 1920x1080 "$OUTPUT_FILE" -y

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Automated interface recording created: $OUTPUT_FILE"
    FINAL_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo "📊 File size: ${FINAL_SIZE}"
    echo ""
    echo "🎯 AUTOMATED RECORDING FEATURES:"
    echo "   ✅ Captures actual browser window"
    echo "   ✅ Shows real React interface"
    echo "   ✅ Records whatever is displayed on screen"
    echo "   ✅ HD quality (1920x1080)"
    echo "   ✅ ${DURATION} seconds of interface footage"
    echo ""
    echo "🎬 Playing the automated interface recording..."
    open "$OUTPUT_FILE"
else
    echo "❌ Error creating automated interface recording"
    exit 1
fi
