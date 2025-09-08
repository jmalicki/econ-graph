#!/bin/bash

echo "🎬 Creating Interface Demo Video with Actual EconGraph Features"
echo ""

# Check if we have the built frontend
if [ ! -f "frontend/build/index.html" ]; then
    echo "❌ Frontend build not found. Building frontend..."
    cd frontend
    npm run build
    cd ..
fi

echo "🌐 Starting local server for frontend..."

# Start a simple HTTP server for the built frontend
cd frontend/build
python3 -m http.server 3000 &
SERVER_PID=$!
cd ../..

echo "⏳ Waiting for server to start..."
sleep 3

echo "🎥 Opening EconGraph interface in browser..."
open "http://localhost:3000"

echo ""
echo "📋 DEMO RECORDING INSTRUCTIONS:"
echo "================================"
echo ""
echo "The EconGraph interface is now open in your browser at http://localhost:3000"
echo ""
echo "🎯 Features to demonstrate:"
echo "   1. Interactive World Map with country selection"
echo "   2. Multi-Country Dashboard with economic indicators"
echo "   3. Global Events Explorer with timeline"
echo "   4. Professional search and filtering"
echo "   5. Correlation analysis tools"
echo "   6. Real-time data visualization"
echo ""
echo "🎙️  To create the demo video:"
echo "   1. Use QuickTime Player > File > New Screen Recording"
echo "   2. Select the browser window area"
echo "   3. Start recording and narrate while demonstrating features"
echo "   4. Show each major component mentioned in the narration"
echo "   5. Save as 'interface-demo-recording.mov'"
echo ""
echo "⏹️  When finished, press any key to stop the local server..."

read -n 1 -s

echo ""
echo "🛑 Stopping local server..."
kill $SERVER_PID

echo "✅ Demo setup complete!"
echo ""
echo "📁 Next steps:"
echo "   1. You should now have a screen recording showing the actual interface"
echo "   2. Use this command to convert to web-friendly format:"
echo "      ffmpeg -i interface-demo-recording.mov -c:v libx264 -crf 23 demo-videos/interface-demo.mp4"
echo "   3. Combine with existing narration if needed"
