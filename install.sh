#!/bin/bash

echo "Installing Pedro Pathing Visualizer..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Install Homebrew if needed
if ! command -v brew &> /dev/null; then
    print_status "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add to PATH for Apple Silicon
    if [[ $(uname -m) == 'arm64' ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
        print_status "Homebrew configured for Apple Silicon"
    fi
fi

# Clean up any previous installations
print_status "Cleaning up previous installations..."
if [ -d "/Applications/Pedro Pathing Visualizer.app" ]; then
    sudo rm -rf "/Applications/Pedro Pathing Visualizer.app"
    print_status "Removed old version from Applications"
fi

# Check if we're in a local build directory
if [ -d "dist" ] && [ -f "dist/"*".dmg" ] 2>/dev/null; then
    print_status "Using local DMG from dist folder..."
    DMG_PATH=$(ls -t dist/*.dmg | head -1)
else
    # Download from GitHub releases
    print_status "Checking for latest release..."
    
    # Use the correct repo
    API_URL="https://api.github.com/repos/Mallen220/PedroPathingVisualizer/releases/latest"
    
    # Get download URL
    print_status "Fetching download URL from GitHub..."
    DOWNLOAD_URL=$(curl -s "$API_URL" | grep -o '"browser_download_url": "[^"]*\.dmg"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$DOWNLOAD_URL" ]; then
        print_error "No DMG found in releases. Please check:"
        echo "  https://github.com/Mallen220/PedroPathingVisualizer/releases"
        echo ""
        echo "To build locally:"
        echo "  npm run build"
        echo "  npm run dist:unsigned"
        exit 1
    fi
    
    print_status "Downloading: $(basename "$DOWNLOAD_URL")"
    DMG_PATH="$HOME/Downloads/pedro-installer-$(date +%s).dmg"
    curl -L -o "$DMG_PATH" "$DOWNLOAD_URL"
    
    if [ ! -f "$DMG_PATH" ]; then
        print_error "Download failed!"
        exit 1
    fi
fi

print_status "DMG ready: $(basename "$DMG_PATH")"

# Create a temporary mount directory
TEMP_MOUNT=$(mktemp -d /tmp/pedro-mount.XXXXXX)
print_status "Created temporary mount point: $TEMP_MOUNT"

# Mount the DMG to our controlled directory
print_status "Mounting DMG..."
hdiutil attach "$DMG_PATH" -mountpoint "$TEMP_MOUNT" -nobrowse -quiet -noautoopen

# Check if mount succeeded
if [ $? -ne 0 ]; then
    print_error "Failed to mount DMG"
    rm -rf "$TEMP_MOUNT"
    exit 1
fi

print_status "DMG mounted successfully at $TEMP_MOUNT"

# List contents for debugging
print_status "Contents of mounted DMG:"
ls -la "$TEMP_MOUNT"

# Find the app (should be at the root)
APP_SOURCE=$(find "$TEMP_MOUNT" -name "*.app" -type d -maxdepth 1 2>/dev/null | head -1)

if [ -z "$APP_SOURCE" ]; then
    print_error "No .app file found at root of DMG"
    echo "Looking deeper..."
    APP_SOURCE=$(find "$TEMP_MOUNT" -name "*.app" -type d 2>/dev/null | head -1)
fi

if [ -z "$APP_SOURCE" ]; then
    print_error "No .app file found in the DMG!"
    hdiutil detach "$TEMP_MOUNT" 2>/dev/null || true
    rm -rf "$TEMP_MOUNT"
    exit 1
fi

print_status "Found app: $(basename "$APP_SOURCE")"

# Copy to Applications
print_status "Installing to Applications..."
cp -R "$APP_SOURCE" "/Applications/"

# Unmount the DMG
print_status "Unmounting DMG..."
hdiutil detach "$TEMP_MOUNT" 2>/dev/null || true
rm -rf "$TEMP_MOUNT"

# Clean up downloaded file
if [[ "$DMG_PATH" == *"pedro-installer-"* ]]; then
    rm "$DMG_PATH"
    print_status "Cleaned up temporary DMG"
fi

# Fix permissions (crucial for unsigned apps)
print_status "Fixing macOS security permissions..."
sudo xattr -rd com.apple.quarantine "/Applications/Pedro Pathing Visualizer.app"
sudo chmod -R 755 "/Applications/Pedro Pathing Visualizer.app"

print_status "Installation complete!"
echo ""
echo "🌟 ${GREEN}Pedro Pathing Visualizer is now installed!${NC}"
echo ""
echo "To open the app:"
echo "  1. Open Finder"
echo "  2. Go to Applications"
echo "  3. Find 'Pedro Pathing Visualizer'"
echo "  4. Double-click it"
echo ""
echo "${YELLOW}⚠  IMPORTANT: On first run, you may see a security warning.${NC}"
echo "   Here's how to fix it:"
echo ""
echo "   Option A (Recommended):"
echo "     1. Go to ${YELLOW}System Settings → Privacy & Security${NC}"
echo "     2. Scroll down until you see 'Pedro Pathing Visualizer'"
echo "     3. Click '${GREEN}Open Anyway${NC}'"
echo ""
echo "   Option B:"
echo "     1. Right-click the app in Applications"
echo "     2. Select '${GREEN}Open${NC}'"
echo "     3. Click '${GREEN}Open${NC}' in the dialog"
echo ""
echo "${GREEN}Need help?${NC} Visit: https://github.com/Mallen220/PedroPathingVisualizer"
echo ""