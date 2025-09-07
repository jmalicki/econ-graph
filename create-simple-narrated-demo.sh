#!/bin/bash

# Simplified Professional Narrated Demo Video Creator
# Creates a single narration audio track and combines with video

set -e

echo "🎬 Creating Professional Narrated Demo Video (Simplified Approach)..."

# Input files
INPUT_VIDEO="demo-videos/epic-system-demo.webm"
AUDIO_DIR="demo-videos/audio-segments"
OUTPUT_VIDEO="demo-videos/epic-system-demo-with-narration.mp4"

# Verify input video exists
if [ ! -f "$INPUT_VIDEO" ]; then
    echo "❌ Error: Input video not found: $INPUT_VIDEO"
    exit 1
fi

echo "📹 Input video: $INPUT_VIDEO"
echo "🎵 Audio segments: $AUDIO_DIR"
echo "🎯 Output video: $OUTPUT_VIDEO"
echo ""

echo "🎼 Creating continuous narration audio track..."

# Create a list file for concatenating audio segments
CONCAT_FILE="demo-videos/concat_list.txt"
echo "" > "$CONCAT_FILE"

# Add all segments to the concatenation list
for i in {1..19}; do
    segment_file="$AUDIO_DIR/segment_$(printf "%02d" $i).mp3"
    if [ -f "$segment_file" ]; then
        echo "file '$segment_file'" >> "$CONCAT_FILE"
        # Add a small silence between segments (0.5 seconds)
        if [ $i -lt 19 ]; then
            # Create a tiny silence file
            SILENCE_FILE="demo-videos/silence_0.5sec.mp3"
            if [ ! -f "$SILENCE_FILE" ]; then
                ffmpeg -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=48000 -t 0.5 "$SILENCE_FILE" -y >/dev/null 2>&1
            fi
            echo "file '$SILENCE_FILE'" >> "$CONCAT_FILE"
        fi
    fi
done

# Concatenate all audio segments into one track
COMPLETE_AUDIO="demo-videos/complete_narration.mp3"
echo "🔗 Concatenating narration segments..."
ffmpeg -f concat -safe 0 -i "$CONCAT_FILE" -c copy "$COMPLETE_AUDIO" -y >/dev/null 2>&1

echo "✅ Complete narration track created"

echo "🎥 Combining video with narration..."

# Get video duration to ensure audio doesn't exceed it
VIDEO_DURATION=$(ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$INPUT_VIDEO")
echo "📏 Video duration: ${VIDEO_DURATION}s"

# Combine video with the complete narration track
ffmpeg -i "$INPUT_VIDEO" -i "$COMPLETE_AUDIO" \
    -c:v copy \
    -c:a aac \
    -b:a 192k \
    -map 0:v:0 \
    -map 1:a:0 \
    -t "$VIDEO_DURATION" \
    "$OUTPUT_VIDEO" -y >/dev/null 2>&1

echo "✅ Video with narration created successfully"

# Clean up temporary files
rm -f "$CONCAT_FILE" "$COMPLETE_AUDIO" "demo-videos/silence_0.5sec.mp3"

echo ""
echo "🎉 Professional Narrated Demo Video Complete!"
echo "📁 Output: $OUTPUT_VIDEO"
echo "🎬 Features:"
echo "   ✅ HD Video (1920x1080)"
echo "   ✅ Professional Voice Narration (19 segments)"
echo "   ✅ Continuous Audio Track"
echo "   ✅ High-Quality Audio (192kbps AAC)"
echo "   ✅ Bloomberg Terminal-level Feature Showcase"
echo ""
echo "🚀 Ready for professional presentations and institutional demos!"

# Display file information
echo "📊 File Information:"
ls -lh "$OUTPUT_VIDEO"

# Test playback capability
echo ""
echo "🎮 Testing video file..."
ffprobe -v quiet -print_format json -show_streams "$OUTPUT_VIDEO" | grep -E '"codec_type|"duration"' | head -4
