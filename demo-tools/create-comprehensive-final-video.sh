#!/bin/bash

echo "🎬 Creating final comprehensive Global Economic Network Analysis demo with narration..."

# Find the most recent video file
VIDEO_FILE=$(ls -t demo-videos/*.webm | head -1)
VIDEO_BASENAME=$(basename "$VIDEO_FILE")
echo "📹 Using video file: $VIDEO_FILE"

# Create concatenation list for audio files
echo "🎵 Creating audio concatenation list..."
cat > demo-videos/comprehensive_concat_list.txt << EOF
file 'comprehensive-narration/01_intro.aiff'
file 'comprehensive-narration/02_competitive.aiff'
file 'comprehensive-narration/03_overview.aiff'
file 'comprehensive-narration/04_network_intro.aiff'
file 'comprehensive-narration/05_controls.aiff'
file 'comprehensive-narration/06_correlation.aiff'
file 'comprehensive-narration/07_timeperiod.aiff'
file 'comprehensive-narration/08_interaction.aiff'
file 'comprehensive-narration/09_network_features.aiff'
file 'comprehensive-narration/10_dashboard_intro.aiff'
file 'comprehensive-narration/11_dashboard_config.aiff'
file 'comprehensive-narration/12_comparison_metrics.aiff'
file 'comprehensive-narration/13_chart_types.aiff'
file 'comprehensive-narration/14_dashboard_metrics.aiff'
file 'comprehensive-narration/15_dashboard_features.aiff'
file 'comprehensive-narration/16_events_intro.aiff'
file 'comprehensive-narration/17_advanced_filtering.aiff'
file 'comprehensive-narration/18_impact_analysis.aiff'
file 'comprehensive-narration/19_financial_crisis.aiff'
file 'comprehensive-narration/20_covid_pandemic.aiff'
file 'comprehensive-narration/21_brexit_analysis.aiff'
file 'comprehensive-narration/22_trade_war.aiff'
file 'comprehensive-narration/23_current_conflicts.aiff'
file 'comprehensive-narration/24_achievement_stats.aiff'
file 'comprehensive-narration/25_revolutionary_impact.aiff'
file 'comprehensive-narration/26_platform_excellence.aiff'
file 'comprehensive-narration/27_feature_integration.aiff'
file 'comprehensive-narration/28_technical_excellence.aiff'
file 'comprehensive-narration/29_future_vision.aiff'
EOF

# Concatenate all audio files
echo "🎵 Concatenating comprehensive narration audio..."
cd demo-videos
ffmpeg -f concat -safe 0 -i comprehensive_concat_list.txt -c copy comprehensive_complete_narration.aiff -y

# Convert to mp3 for better compatibility
echo "🎵 Converting to MP3..."
ffmpeg -i comprehensive_complete_narration.aiff -acodec mp3 -ab 192k comprehensive_complete_narration.mp3 -y

# Combine video with audio
echo "🎬 Combining video with comprehensive narration..."
ffmpeg -i "$VIDEO_BASENAME" -i comprehensive_complete_narration.mp3 -c:v libx264 -c:a aac -map 0:v:0 -map 1:a:0 -shortest comprehensive-global-analysis-demo-with-narration.mp4 -y

cd ..

echo "✅ Comprehensive demo with narration created successfully!"
echo "📁 Output file: demo-videos/comprehensive-global-analysis-demo-with-narration.mp4"

# Get file info
if [ -f "demo-videos/comprehensive-global-analysis-demo-with-narration.mp4" ]; then
    echo "📊 File size: $(ls -lh demo-videos/comprehensive-global-analysis-demo-with-narration.mp4 | awk '{print $5}')"
    echo "⏱️ Duration: $(ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 demo-videos/comprehensive-global-analysis-demo-with-narration.mp4 | awk '{printf "%.1f minutes", $1/60}')"
fi
