#!/bin/bash

echo "🎬 Creating ACTUAL UI Demo Video with Great Narration"
echo "This script will help you record the REAL UI while the narration plays"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

if ! command -v cargo &> /dev/null; then
    echo "❌ Rust/Cargo not found. Please install Rust first."
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not found. Please install PostgreSQL first."
    exit 1
fi

echo "✅ All prerequisites found!"
echo ""

# Combine the honest narration files
echo "🎵 Preparing the complete narration..."
if [ ! -f "../demo-videos/complete_honest_narration.mp3" ]; then
    echo "Combining honest narration segments..."
    ffmpeg -i ../demo-videos/honest_01.mp3 \
           -i ../demo-videos/honest_02.mp3 \
           -i ../demo-videos/honest_03.mp3 \
           -i ../demo-videos/honest_04.mp3 \
           -i ../demo-videos/honest_05.mp3 \
           -filter_complex "[0:0][1:0][2:0][3:0][4:0]concat=n=5:v=0:a=1[out]" \
           -map "[out]" ../demo-videos/complete_honest_narration.mp3 -y
fi

# Get narration duration
DURATION=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 ../demo-videos/complete_honest_narration.mp3 2>/dev/null)
echo "📊 Narration duration: ${DURATION} seconds"
echo ""

# Start backend
echo "🚀 Starting Rust backend..."
cd ../backend
cargo run &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"
sleep 5

# Start frontend
echo "🌐 Starting React frontend..."
cd ../frontend
npm start &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"
sleep 10

echo ""
echo "======================================================================="
echo "🎬 READY TO RECORD THE ACTUAL UI!"
echo "======================================================================="
echo ""
echo "📱 The EconGraph app is now running at: http://localhost:3000"
echo "🎵 Total narration time: ~${DURATION%.*} seconds"
echo ""
echo "🎯 RECORDING INSTRUCTIONS:"
echo "1. Open QuickTime Player (or your screen recorder)"
echo "2. Start a new Screen Recording"
echo "3. Focus on the browser window at http://localhost:3000"
echo "4. Play the narration: ../demo-videos/complete_honest_narration.mp3"
echo "5. Follow the narration and interact with the UI naturally:"
echo ""
echo "   📋 DEMO FLOW (follow the narration):"
echo "   • Show the landing page and explain the value"
echo "   • Search for economic indicators (GDP, unemployment, etc.)"
echo "   • Demonstrate interactive charts and tooltips"
echo "   • Apply data transformations (YoY, QoQ, MoM)"
echo "   • Show multi-country comparisons"
echo "   • Highlight the GraphQL API and data sources"
echo "   • Mention the robust tech stack (Rust + React)"
echo "   • Reference the exciting roadmap for ML features"
echo ""
echo "6. Stop recording when narration ends"
echo ""

# Play the narration (if available)
if command -v afplay &> /dev/null; then
    echo "🎵 Playing narration in 10 seconds..."
    echo "   (You can start your screen recording now)"
    sleep 10
    afplay ../demo-videos/complete_honest_narration.mp3 &
    AUDIO_PID=$!
    echo "🎵 Narration playing! Record your screen now!"
    wait $AUDIO_PID
    echo "🎵 Narration completed!"
elif command -v open &> /dev/null; then
    echo "🎵 Opening narration file - play it manually while recording:"
    open ../demo-videos/complete_honest_narration.mp3
fi

echo ""
echo "⏸️  Press ENTER when you've finished recording..."
read -p ""

# Cleanup
echo "🧹 Stopping services..."
echo "Stopping frontend (PID: $FRONTEND_PID)..."
kill $FRONTEND_PID 2>/dev/null
echo "Stopping backend (PID: $BACKEND_PID)..."
kill $BACKEND_PID 2>/dev/null

echo ""
echo "✅ ACTUAL UI Demo recording session completed!"
echo ""
echo "🎬 Next steps:"
echo "1. Your screen recording now shows the ACTUAL UI with great narration"
echo "2. Save it as: demo-videos/actual-ui-demo-with-narration.mp4"
echo "3. This combines the UI you wanted with the narration you loved!"
echo ""
echo "🚀 Perfect demo: Real UI + Great narration = Success!"
