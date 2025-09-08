#!/bin/bash

OUTPUT_FILE="demo-videos/actual-interface-recording.mp4"
FRONTEND_URL="http://localhost:3000"
DURATION=90

echo "🎬 Recording ACTUAL EconGraph Interface"
echo "🌐 Frontend running at: $FRONTEND_URL"
echo "📁 Output will be: $OUTPUT_FILE"
echo "⏱️  Recording duration: ${DURATION} seconds"
echo ""

# Open the browser to the frontend URL
echo "🌐 Opening browser to EconGraph interface..."
open "$FRONTEND_URL"

# Give the browser time to load
sleep 5

echo ""
echo "🎬 ACTUAL INTERFACE RECORDING PLAN:"
echo "   📊 0-15s: Dashboard with economic indicators"
echo "   🌍 15-35s: Navigate to Global Analysis → Network Map"
echo "   📈 35-55s: Switch to Multi-Country Dashboard tab"
echo "   📅 55-75s: Switch to Global Events Explorer tab"
echo "   🔍 75-90s: Navigate back and show other features"
echo ""
echo "🎯 INSTRUCTIONS FOR RECORDING:"
echo "   1. Click hamburger menu (☰) to open sidebar"
echo "   2. Click 'Global Analysis' to see the map"
echo "   3. Click tabs: Network Map → Multi-Country Dashboard → Global Events"
echo "   4. Navigate through the actual React interface"
echo "   5. Show real Material-UI components and interactions"
echo ""
echo "📹 This will record the ACTUAL browser window with the running React app"
echo "   ✅ Real Material-UI components"
echo "   ✅ Working navigation and routing"
echo "   ✅ Actual D3.js visualizations"
echo "   ✅ Professional interface in action"
echo ""
echo "Press ENTER when ready to start recording the ACTUAL interface..."
read

# Record the screen using avfoundation (macOS screen capture)
echo "🎥 Starting screen recording of actual interface..."
ffmpeg -f avfoundation -i "1:0" -t "$DURATION" \
    -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p \
    "$OUTPUT_FILE" -y

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ACTUAL interface recording created: $OUTPUT_FILE"
    FINAL_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo "📊 File size: ${FINAL_SIZE}"
    echo ""
    echo "🎯 ACTUAL INTERFACE RECORDING FEATURES:"
    echo "   ✅ Real screen recording of browser window"
    echo "   ✅ Actual React application with Material-UI"
    echo "   ✅ Working navigation and component interactions"
    echo "   ✅ Real Global Analysis features demonstrated"
    echo "   ✅ Genuine D3.js visualizations and charts"
    echo "   ✅ Professional interface quality"
    echo ""
    echo "🌐 Interface recorded: $FRONTEND_URL"
    echo "📋 Features shown: Dashboard → Global Analysis → Real Components"
    echo ""
    echo "🎬 Opening the ACTUAL interface recording..."
    open "$OUTPUT_FILE"
else
    echo "❌ Error during actual interface recording."
    exit 1
fi
