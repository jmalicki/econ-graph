#!/bin/bash

# Corrected Collaboration-Focused Demo Narration Audio Generator
# Creates narration that matches the actual video content

set -e

echo "🎤 Creating Corrected Collaboration Demo Narration Audio..."

# Create audio directory
mkdir -p demo-videos/corrected-collaboration-audio

# Professional voice settings for macOS 'say' command
VOICE="Alex"  # Professional male voice
RATE="175"    # Slightly slower for clarity
OUTPUT_FORMAT="aiff"  # High quality audio format

# CORRECTED collaboration-focused narration script (fixed to match actual video)
declare -a CORRECTED_COLLABORATION_SEGMENTS=(
    "Welcome to EconGraph's Revolutionary Collaboration Platform - where economic analysis meets real-time teamwork. Today we'll explore how teams collaborate on economic research like never before."
    "Let's start with our Bloomberg Terminal-inspired collaboration workspace. This professional interface demonstrates how economic teams can work together on complex data analysis."
    "The platform supports real-time collaboration with team members, showing their roles and permission levels for secure economic analysis workflows."
    "Now let's demonstrate the chart annotation system. Economic analysts can add professional annotations to mark significant events and periods in economic data."
    "The system provides multiple annotation types including data points, trend indicators, and contextual markers. Each annotation can include detailed descriptions and professional styling."
    "I'm adding a detailed description explaining the economic significance of key data points. Notice the professional interface for organizing and managing annotations."
    "Annotations appear with professional styling and can be shared with team members. This enables collaborative economic analysis where insights are preserved and discussed."
    "Now let's explore the comment and discussion system. Team members can engage in professional conversations about economic data and analysis findings."
    "Comments include timestamps and author attribution, creating a professional audit trail of economic discussions and analytical insights."
    "The collaboration interface shows annotation management with filtering and organization options for complex economic analysis workflows."
    "Let's demonstrate the annotation management features. Users can organize annotations, control visibility, and structure their collaborative economic analysis."
    "The permission system ensures secure collaboration. Team leads can control access levels and maintain professional standards for economic research."
    "Chart sharing capabilities allow teams to collaborate with specific permission levels, ensuring appropriate access to sensitive economic analysis."
    "The collaboration system maintains complete audit trails of all changes, comments, and annotations - essential for institutional compliance and research integrity."
    "Multiple team members can work simultaneously on economic analysis, with the platform managing collaborative workflows and maintaining data consistency."
    "The system supports professional economic research workflows where analysts, economists, and managers can contribute their expertise collaboratively."
    "All collaboration features work seamlessly across desktop, tablet, and mobile devices, enabling economic teams to collaborate from anywhere professionally."
    "This represents the future of collaborative economic analysis - combining professional-grade functionality with modern team collaboration technology."
    "Thank you for exploring EconGraph's collaboration platform. Transform your economic analysis workflow with professional-grade real-time collaboration tools."
)

# Generate audio files for each corrected segment
for i in "${!CORRECTED_COLLABORATION_SEGMENTS[@]}"; do
    segment_num=$(printf "%02d" $((i + 1)))
    output_file="demo-videos/corrected-collaboration-audio/corrected_collab_segment_${segment_num}.aiff"
    
    echo "  🎙️  Generating corrected collaboration segment ${segment_num}/19..."
    
    # Use macOS 'say' command to generate high-quality speech
    say -v "$VOICE" -r "$RATE" -o "$output_file" "${CORRECTED_COLLABORATION_SEGMENTS[$i]}"
    
    # Convert to high-quality MP3 for better compression
    mp3_file="demo-videos/corrected-collaboration-audio/corrected_collab_segment_${segment_num}.mp3"
    ffmpeg -i "$output_file" -codec:a libmp3lame -b:a 192k "$mp3_file" -y >/dev/null 2>&1
    
    # Remove the AIFF file to save space
    rm "$output_file"
    
    echo "    ✅ Created: $mp3_file"
done

echo ""
echo "🎉 Corrected collaboration demo narration audio generation complete!"
echo "📁 Audio segments saved in: demo-videos/corrected-collaboration-audio/"
echo "🎵 Format: High-quality MP3 (192kbps)"
echo "🎤 Voice: Professional male voice (Alex)"
echo "📊 Segments: 19 corrected collaboration-focused narration segments"
echo ""
echo "✅ CORRECTIONS MADE:"
echo "   - Removed specific mention of 'green dots' for online users"
echo "   - Removed specific mention of 'vertical line annotation at March 2020'"
echo "   - Updated narration to match actual video content"
echo ""
echo "Next step: Create corrected collaboration demo video with accurate narration..."
