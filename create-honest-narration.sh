#!/bin/bash

echo "🎙️ Creating HONEST Narration for EconGraph Demo"
echo ""

# Create narration directory if it doesn't exist
mkdir -p demo-videos

# Honest narration script
cat > create-honest-demo-narration.sh << 'EOF'
#!/bin/bash

echo "🎙️ Generating Honest Demo Narration"

# Create individual narration segments
say "Welcome to EconGraph, an economic data visualization platform. This is a prototype demonstration showing our user interface concepts and sample data." -o demo-videos/honest_01.aiff

say "Let's explore the Global Economic Network Map. This prototype visualizes economic relationships between countries using sample data." -o demo-videos/honest_02.aiff

say "Currently, our demo includes data for 5 major economies: the United States, China, Japan, Germany, and the United Kingdom." -o demo-videos/honest_03.aiff

say "The map shows economic correlations as connecting lines. We have 3 sample correlation pairs demonstrating how countries' economies might be interconnected." -o demo-videos/honest_04.aiff

say "You can adjust the correlation threshold using this slider to filter which relationships are displayed. This is a prototype feature showing how users could explore different correlation strengths." -o demo-videos/honest_05.aiff

say "The dropdown menu allows selection of different economic indicators like GDP, inflation, unemployment, and trade balance. This demonstrates the interface concept for indicator switching." -o demo-videos/honest_06.aiff

say "Clicking on a country reveals basic information. The circle size represents GDP, showing a visual comparison between economies." -o demo-videos/honest_07.aiff

say "Now let's look at the Multi-Country Dashboard. This prototype shows how users could compare economic metrics across countries." -o demo-videos/honest_08.aiff

say "The dashboard displays sample economic data including GDP, growth rates, inflation, and unemployment figures for our demo countries." -o demo-videos/honest_09.aiff

say "These charts demonstrate how time-series data could be visualized, though currently they show sample data for demonstration purposes." -o demo-videos/honest_10.aiff

say "The comparison table shows how countries could be ranked and compared across different metrics in a production system." -o demo-videos/honest_11.aiff

say "Finally, let's explore the Global Events Explorer. This prototype demonstrates how major economic events could be tracked and analyzed." -o demo-videos/honest_12.aiff

say "Our demo includes 6 sample events like the 2008 Financial Crisis and COVID-19 pandemic, showing how event impacts could be visualized." -o demo-videos/honest_13.aiff

say "Each event shows sample impact data for affected countries, demonstrating how a production system might track economic disruptions." -o demo-videos/honest_14.aiff

say "The filtering options show how users could search and categorize events by type, severity, and time period." -o demo-videos/honest_15.aiff

say "This concludes our honest demonstration of EconGraph. What you've seen is a working prototype with sample data, demonstrating the user interface concepts and visualization capabilities we're developing." -o demo-videos/honest_16.aiff

say "The next steps would involve integrating real economic data sources, implementing advanced analytics, and expanding the country coverage for a production-ready system." -o demo-videos/honest_17.aiff

say "Thank you for viewing our EconGraph prototype demonstration." -o demo-videos/honest_18.aiff

echo ""
echo "🎵 Converting AIFF files to MP3..."

# Convert all AIFF files to MP3
for i in {01..18}; do
    if [ -f "demo-videos/honest_${i}.aiff" ]; then
        ffmpeg -i "demo-videos/honest_${i}.aiff" -acodec mp3 -ab 192k "demo-videos/honest_${i}.mp3" -y
        rm "demo-videos/honest_${i}.aiff"
    fi
done

echo ""
echo "🔗 Concatenating all narration segments..."

# Create file list for concatenation
echo "# Honest Demo Narration Segments" > demo-videos/honest_narration_list.txt
for i in {01..18}; do
    if [ -f "demo-videos/honest_${i}.mp3" ]; then
        echo "file 'honest_${i}.mp3'" >> demo-videos/honest_narration_list.txt
    fi
done

# Concatenate all segments
ffmpeg -f concat -safe 0 -i demo-videos/honest_narration_list.txt -c copy demo-videos/honest_complete_narration.mp3 -y

# Get duration
DURATION=$(ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 demo-videos/honest_complete_narration.mp3)
echo ""
echo "✅ Honest narration complete!"
echo "📊 Total duration: ${DURATION} seconds"
echo "🎵 Output file: demo-videos/honest_complete_narration.mp3"

# Clean up individual files
rm demo-videos/honest_*.mp3 2>/dev/null || true
rm demo-videos/honest_narration_list.txt 2>/dev/null || true

echo ""
echo "🎬 Ready for honest demo recording!"
EOF

chmod +x create-honest-demo-narration.sh
echo "✅ Honest narration script created!"
echo ""
echo "Run: ./create-honest-demo-narration.sh"
