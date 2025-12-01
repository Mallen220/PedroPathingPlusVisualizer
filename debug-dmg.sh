#!/bin/bash
echo "Debugging DMG structure..."

# Find DMG file
DMG=$(find . -name "*.dmg" -type f | head -1)
if [ -z "$DMG" ]; then
    echo "No DMG found. Building one..."
    npm run dist:unsigned
    DMG=$(find . -name "*.dmg" -type f | head -1)
fi

echo "DMG: $DMG"

# Mount it
hdiutil attach "$DMG" -nobrowse -mountpoint /tmp/pedro-debug

echo ""
echo "Contents of mounted DMG:"
ls -la /tmp/pedro-debug/

echo ""
echo "Looking for .app files:"
find /tmp/pedro-debug -name "*.app" -type d

echo ""
echo "Volume name:"
diskutil info /tmp/pedro-debug | grep "Volume Name"

# Unmount
hdiutil detach /tmp/pedro-debug
