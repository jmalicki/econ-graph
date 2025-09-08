#!/bin/bash

# Professional Human-Like Narration Creator
# Uses ElevenLabs API for high-quality, natural-sounding voice generation

set -e

echo "🎤 Creating Professional Human-Like Narration..."
echo ""
echo "This script will help you create professional, human-sounding narration"
echo "using ElevenLabs AI voice generation service."
echo ""

# Check if we have an API key
if [ -z "$ELEVENLABS_API_KEY" ]; then
    echo "⚠️  ElevenLabs API Key Required"
    echo ""
    echo "To use ElevenLabs for professional narration:"
    echo "1. Visit: https://elevenlabs.io"
    echo "2. Sign up for free account (10,000 characters/month free)"
    echo "3. Go to Profile -> API Keys"
    echo "4. Copy your API key"
    echo "5. Run: export ELEVENLABS_API_KEY='your_api_key_here'"
    echo ""
    echo "🎯 RECOMMENDED VOICES FOR ECONOMIC CONTENT:"
    echo "- 'Josh' - Professional, authoritative American male"
    echo "- 'Arnold' - Deep, confident British male"  
    echo "- 'Antoni' - Warm, trustworthy American male"
    echo "- 'Adam' - Clear, professional American male"
    echo ""
    echo "Alternative: Manual Process"
    echo "1. Visit https://elevenlabs.io/speech-synthesis"
    echo "2. Paste the narration text below"
    echo "3. Select a professional voice (Josh/Arnold recommended)"
    echo "4. Generate and download the audio"
    echo "5. Save as demo-videos/professional_narration.mp3"
    echo ""
    
    # Display the narration text for manual use
    echo "📝 COLLABORATION DEMO NARRATION TEXT:"
    echo "=================================="
    cat << 'EOF'
Welcome to EconGraph, a professional economic data analysis platform featuring Bloomberg Terminal-level collaboration capabilities.

This demonstration showcases our enhanced collaboration features, where team members can work together on economic analysis in real-time.

Notice the green dots indicating which team members are currently online and actively collaborating on this economic analysis.

Our professional collaboration panel shows four team members: Sarah Chen, Michael Rodriguez, Dr. Emily Watson, and James Park, with real-time status indicators.

The chart displays Real Gross Domestic Product data, and you can see the red vertical line marking the COVID-19 economic impact period in March 2020.

Team members can create professional annotations directly on economic charts, with full comment threading and discussion capabilities.

The collaboration system supports role-based permissions, allowing economists, analysts, and managers to work together with appropriate access levels.

Real-time synchronization ensures all team members see updates immediately, creating a seamless collaborative experience.

Chart annotations include professional styling with timestamps, author information, and categorization for institutional-grade analysis.

The interface features Bloomberg Terminal-inspired design elements, providing the professional experience expected by financial institutions.

Team collaboration extends beyond simple commenting, supporting complex economic analysis workflows with multiple stakeholders.

The system tracks all collaboration activity, providing audit trails and version history for regulatory compliance.

Advanced permission management allows administrators to control who can view, comment, edit, or manage economic data and analysis.

Professional annotation tools support technical analysis, forecasting discussions, and policy impact assessments.

The collaboration platform integrates seamlessly with existing economic analysis workflows, enhancing rather than disrupting established processes.

Visual indicators throughout the interface provide immediate feedback on collaboration status and team member activity.

This represents the future of collaborative economic analysis, combining institutional-grade features with modern user experience design.

The platform supports both individual research and team collaboration, adapting to the needs of economists, analysts, and policy makers.

Thank you for viewing this demonstration of EconGraph's professional collaboration capabilities.
EOF
    
    echo ""
    echo "=================================="
    echo ""
    echo "💡 TIPS FOR BEST RESULTS:"
    echo "- Choose 'Josh' or 'Arnold' voice for authority"
    echo "- Use stability: 0.5, clarity: 0.75 settings"
    echo "- Generate in segments if text is too long"
    echo "- Download as MP3 format"
    echo ""
    
    exit 0
fi

echo "✅ ElevenLabs API Key found"
echo "🎙️  Generating professional narration..."

# Narration segments for collaboration demo
declare -a segments=(
    "Welcome to EconGraph, a professional economic data analysis platform featuring Bloomberg Terminal-level collaboration capabilities."
    "This demonstration showcases our enhanced collaboration features, where team members can work together on economic analysis in real-time."
    "Notice the green dots indicating which team members are currently online and actively collaborating on this economic analysis."
    "Our professional collaboration panel shows four team members: Sarah Chen, Michael Rodriguez, Dr. Emily Watson, and James Park, with real-time status indicators."
    "The chart displays Real Gross Domestic Product data, and you can see the red vertical line marking the COVID-19 economic impact period in March 2020."
    "Team members can create professional annotations directly on economic charts, with full comment threading and discussion capabilities."
    "The collaboration system supports role-based permissions, allowing economists, analysts, and managers to work together with appropriate access levels."
    "Real-time synchronization ensures all team members see updates immediately, creating a seamless collaborative experience."
    "Chart annotations include professional styling with timestamps, author information, and categorization for institutional-grade analysis."
    "The interface features Bloomberg Terminal-inspired design elements, providing the professional experience expected by financial institutions."
    "Team collaboration extends beyond simple commenting, supporting complex economic analysis workflows with multiple stakeholders."
    "The system tracks all collaboration activity, providing audit trails and version history for regulatory compliance."
    "Advanced permission management allows administrators to control who can view, comment, edit, or manage economic data and analysis."
    "Professional annotation tools support technical analysis, forecasting discussions, and policy impact assessments."
    "The collaboration platform integrates seamlessly with existing economic analysis workflows, enhancing rather than disrupting established processes."
    "Visual indicators throughout the interface provide immediate feedback on collaboration status and team member activity."
    "This represents the future of collaborative economic analysis, combining institutional-grade features with modern user experience design."
    "The platform supports both individual research and team collaboration, adapting to the needs of economists, analysts, and policy makers."
    "Thank you for viewing this demonstration of EconGraph's professional collaboration capabilities."
)

# Create audio directory
mkdir -p demo-videos/professional-audio

# Voice ID for professional male voice (Josh - authoritative American)
VOICE_ID="TxGEqnHWrfWFTfGW9XjX"

echo "🎯 Using professional voice: Josh (Authoritative American Male)"
echo "📁 Creating audio segments..."

# Generate each segment
for i in "${!segments[@]}"; do
    segment_num=$(printf "%02d" $((i + 1)))
    output_file="demo-videos/professional-audio/segment_${segment_num}.mp3"
    
    echo "🎤 Generating segment ${segment_num}/19: ${segments[i]:0:50}..."
    
    curl -X POST \
        "https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}" \
        -H "Accept: audio/mpeg" \
        -H "Content-Type: application/json" \
        -H "xi-api-key: ${ELEVENLABS_API_KEY}" \
        -d "{
            \"text\": \"${segments[i]}\",
            \"model_id\": \"eleven_monolingual_v1\",
            \"voice_settings\": {
                \"stability\": 0.5,
                \"similarity_boost\": 0.75,
                \"style\": 0.0,
                \"use_speaker_boost\": true
            }
        }" \
        --output "$output_file"
    
    if [ $? -eq 0 ]; then
        echo "✅ Generated: $output_file"
    else
        echo "❌ Failed to generate segment ${segment_num}"
        exit 1
    fi
    
    # Small delay to respect API limits
    sleep 1
done

echo ""
echo "🔄 Concatenating professional audio segments..."

# Create concatenation list
cat > demo-videos/professional_concat_list.txt << EOF
file 'professional-audio/segment_01.mp3'
file 'professional-audio/segment_02.mp3'
file 'professional-audio/segment_03.mp3'
file 'professional-audio/segment_04.mp3'
file 'professional-audio/segment_05.mp3'
file 'professional-audio/segment_06.mp3'
file 'professional-audio/segment_07.mp3'
file 'professional-audio/segment_08.mp3'
file 'professional-audio/segment_09.mp3'
file 'professional-audio/segment_10.mp3'
file 'professional-audio/segment_11.mp3'
file 'professional-audio/segment_12.mp3'
file 'professional-audio/segment_13.mp3'
file 'professional-audio/segment_14.mp3'
file 'professional-audio/segment_15.mp3'
file 'professional-audio/segment_16.mp3'
file 'professional-audio/segment_17.mp3'
file 'professional-audio/segment_18.mp3'
file 'professional-audio/segment_19.mp3'
EOF

# Concatenate all segments
ffmpeg -f concat -safe 0 -i demo-videos/professional_concat_list.txt -c copy demo-videos/complete_professional_narration.mp3 -y >/dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Professional narration created: demo-videos/complete_professional_narration.mp3"
else
    echo "❌ Failed to concatenate audio segments"
    exit 1
fi

echo ""
echo "🎬 Combining with enhanced video..."

# Combine with the enhanced video
ffmpeg -i demo-videos/enhanced-collaboration-demo.html -i demo-videos/complete_professional_narration.mp3 \
    -c:v libx264 \
    -c:a aac \
    -b:a 192k \
    -map 0:v:0 \
    -map 1:a:0 \
    -shortest \
    demo-videos/collaboration-demo-professional-narration.mp4 -y >/dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Professional collaboration demo created: collaboration-demo-professional-narration.mp4"
else
    echo "⚠️  Video combination failed. Audio file is ready for manual combination."
fi

echo ""
echo "🎉 Professional Human-Like Narration Complete!"
echo "📁 Output: demo-videos/complete_professional_narration.mp3"
echo "🎬 Enhanced Demo: demo-videos/collaboration-demo-professional-narration.mp4"
echo ""
echo "🎤 Voice Features:"
echo "   ✅ ElevenLabs 'Josh' - Professional, authoritative American male"
echo "   ✅ Human-like intonation and pacing"
echo "   ✅ Professional business tone perfect for economic content"
echo "   ✅ Clear articulation suitable for institutional presentations"
echo "   ✅ Natural emotional expression and emphasis"
echo ""
echo "🚀 This narration sounds genuinely human and authoritative!"

# Display file information
if [ -f "demo-videos/complete_professional_narration.mp3" ]; then
    echo "📊 Audio File Information:"
    ls -lh demo-videos/complete_professional_narration.mp3
fi
