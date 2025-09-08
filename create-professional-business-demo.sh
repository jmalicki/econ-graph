#!/bin/bash

NARRATION_FILE="demo-videos/professional_business_impact_narration.mp3"
OUTPUT_FILE="demo-videos/professional-business-impact-demo.mp4"
TEMP_SCREEN_CAPTURE="temp_professional_screen_capture.mp4"
FRONTEND_URL="http://localhost:3000"

echo "🏢 Creating PROFESSIONAL BUSINESS IMPACT Demo"
echo "💰 Comparing to Bloomberg Terminal ($24k), Thomson Reuters ($22k), CapIQ ($12k)"
echo ""
echo "🌐 React app running at: $FRONTEND_URL"
echo "🎵 Using narration: $NARRATION_FILE"
echo "📁 Output will be: $OUTPUT_FILE"
echo ""

if [ ! -f "$NARRATION_FILE" ]; then
    echo "❌ Error: Professional narration file not found: $NARRATION_FILE"
    exit 1
fi

echo "🎵 Professional narration duration..."
DURATION=$(ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$NARRATION_FILE")
echo "🎵 Narration duration: ${DURATION} seconds"
echo ""

echo "🏢 PROFESSIONAL BUSINESS IMPACT DEMO PLAN:"
echo "   💼 0-8s: Dashboard - Bloomberg Terminal-level interface"
echo "   🌍 8-25s: Global Analysis - Network Map (Premium feature comparison)"
echo "   📊 25-45s: Multi-Country Dashboard - Institutional-grade analysis"
echo "   📅 45-55s: Global Events Explorer - Crisis tracking capabilities"
echo "   💰 55-90s: Navigate features showing business value"
echo ""

echo "🎥 Recording PROFESSIONAL BUSINESS DEMONSTRATION..."
echo "📹 This demonstrates INSTITUTIONAL-GRADE capabilities:"
echo "   ✅ Bloomberg Terminal-level dashboard ($24k value)"
echo "   ✅ S&P CapIQ-style global analysis ($12k value)"
echo "   ✅ Thomson Reuters economic network mapping ($22k value)"
echo "   ✅ Professional Material-UI interface"
echo "   ✅ Open-source competitive advantage"
echo ""

# Open the browser to the frontend URL
open "$FRONTEND_URL"

# Give the browser some time to load
sleep 5

echo "🎬 PROFESSIONAL RECORDING SCRIPT:"
echo ""
echo "⏰ 0-8 seconds: Dashboard (Bloomberg Terminal Comparison)"
echo "   - Show professional dashboard with economic indicators"
echo "   - Highlight clean Material-UI interface"
echo "   - Demonstrate collaboration features"
echo "   - Emphasize institutional-grade presentation"
echo ""
echo "⏰ 8-25 seconds: Global Economic Network Analysis"
echo "   - Click hamburger menu → 'Global Analysis'"
echo "   - Show the interactive world map (Network Map tab)"
echo "   - Demonstrate D3.js visualization capabilities"
echo "   - Highlight premium terminal-level features"
echo ""
echo "⏰ 25-45 seconds: Multi-Country Dashboard"
echo "   - Click 'Multi-Country Dashboard' tab"
echo "   - Show comparative analysis interface"
echo "   - Demonstrate Bloomberg Terminal-style layout"
echo "   - Highlight institutional-grade capabilities"
echo ""
echo "⏰ 45-55 seconds: Global Events Explorer"
echo "   - Click 'Global Events' tab"
echo "   - Show economic crisis tracking (2008, COVID-19, Brexit)"
echo "   - Demonstrate comprehensive event analysis"
echo "   - Highlight S&P CapIQ-level functionality"
echo ""
echo "⏰ 55-90 seconds: Professional Value Demonstration"
echo "   - Navigate back to dashboard or explore other features"
echo "   - Show responsive design and professional UI"
echo "   - Emphasize open-source advantage"
echo "   - Demonstrate cost-saving business impact"
echo ""
echo "🎯 FOCUS ON BUSINESS VALUE:"
echo "   💰 Cost savings vs Bloomberg Terminal ($24k/year)"
echo "   🏢 Institutional-grade capabilities"
echo "   🚀 Open-source flexibility"
echo "   📊 Professional presentation quality"
echo ""
echo "Press ENTER when ready to start PROFESSIONAL recording..."
read

# Record the screen for the duration of the narration
# Using avfoundation for macOS screen capture
ffmpeg -f avfoundation -i "1:0" -t "$DURATION" -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p "$TEMP_SCREEN_CAPTURE" -y

if [ $? -ne 0 ]; then
    echo "❌ Error during professional screen recording."
    exit 1
fi

echo ""
echo "🎵 Adding professional business impact narration..."
ffmpeg -i "$TEMP_SCREEN_CAPTURE" -i "$NARRATION_FILE" \
    -c:v copy -c:a aac -b:a 192k -map 0:v:0 -map 1:a:0 \
    -shortest "$OUTPUT_FILE" -y

if [ $? -eq 0 ]; then
    echo "✅ Professional business impact demo created: $OUTPUT_FILE"
    FINAL_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo "📊 File size: ${FINAL_SIZE}"
    echo ""
    echo "🏢 PROFESSIONAL BUSINESS IMPACT DEMO FEATURES:"
    echo "   ✅ Bloomberg Terminal cost comparison ($24k vs FREE)"
    echo "   ✅ Thomson Reuters capabilities comparison ($22k vs FREE)"
    echo "   ✅ S&P CapIQ functionality comparison ($12k vs FREE)"
    echo "   ✅ Institutional-grade interface demonstration"
    echo "   ✅ Open-source competitive advantage"
    echo "   ✅ Professional Material-UI presentation"
    echo "   ✅ Real React application with working features"
    echo ""
    echo "💰 BUSINESS VALUE PROPOSITION:"
    echo "   📈 Hundreds of thousands in annual savings"
    echo "   🚀 Enterprise capabilities with startup agility"
    echo "   🔧 Customization impossible with proprietary systems"
    echo "   🌍 Global economic analysis at zero cost"
    echo ""
    echo "🌐 Live interface: $FRONTEND_URL"
    echo "📋 Navigation: Dashboard → Global Analysis → Professional Features"
else
    echo "❌ Error combining screen recording with professional narration."
    exit 1
fi

# Clean up temporary file
rm "$TEMP_SCREEN_CAPTURE"

echo ""
echo "🎬 Opening the PROFESSIONAL BUSINESS IMPACT demo..."
open "$OUTPUT_FILE"
