#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper Functions
print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_info() { echo -e "${BLUE}[i]${NC} $1"; }
print_header() { echo -e "${CYAN}$1${NC}"; }

print_logo() {
    echo -e "${PURPLE}"
    echo '╔══════════════════════════════════════════════════════════════╗'
    echo '║                                                              ║'
    echo '║     Pedro Pathing Visualizer                                 ║'
    echo '║                     Installation                             ║'
    echo '║                                                              ║'
    echo '╚══════════════════════════════════════════════════════════════╝'
    echo -e "${NC}"
}

get_download_url() {
    local pattern=$1
    curl -s "https://api.github.com/repos/Mallen220/PedroPathingVisualizer/releases/latest" | \
    grep -o '"browser_download_url": "[^"]*"' | \
    cut -d'"' -f4 | \
    grep "$pattern" | \
    head -1
}

install_mac() {
    print_header "Starting macOS Installation..."
    
    # Homebrew Check
    if ! command -v brew &> /dev/null; then
        print_warning "Homebrew not found. Installing..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        if [[ $(uname -m) == 'arm64' ]]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
        fi
    fi

    # Cleanup
    if [ -d "/Applications/Pedro Pathing Visualizer.app" ]; then
        sudo rm -rf "/Applications/Pedro Pathing Visualizer.app"
        print_status "Removed old version"
    fi

    print_status "Fetching latest DMG..."
    DOWNLOAD_URL=$(get_download_url "\.dmg")

    if [ -z "$DOWNLOAD_URL" ]; then
        print_error "No DMG found in latest release or app is running. Please close the app and try again."
        exit 1
    fi

    DMG_PATH="/tmp/pedro-installer.dmg"
    curl -L -o "$DMG_PATH" "$DOWNLOAD_URL"
    
    print_status "Mounting and Installing..."
    TEMP_MOUNT=$(mktemp -d /tmp/pedro-mount.XXXXXX)
    hdiutil attach "$DMG_PATH" -mountpoint "$TEMP_MOUNT" -nobrowse -quiet
    
    APP_SOURCE=$(find "$TEMP_MOUNT" -name "*.app" -type d -maxdepth 2 | head -1)
    if [ -z "$APP_SOURCE" ]; then
        print_error "App not found in DMG"
        hdiutil detach "$TEMP_MOUNT" -quiet
        exit 1
    fi
    
    cp -R "$APP_SOURCE" "/Applications/"
    hdiutil detach "$TEMP_MOUNT" -quiet
    rm "$DMG_PATH"
    rm -rf "$TEMP_MOUNT"

    # Fix permissions
    sudo xattr -rd com.apple.quarantine "/Applications/Pedro Pathing Visualizer.app" 2>/dev/null
    
    print_status "Installation Complete! Look in your Applications folder."
}

install_linux() {
    print_header "Starting Linux Installation..."
    
    print_status "Fetching latest AppImage..."
    DOWNLOAD_URL=$(get_download_url "\.AppImage")
    
    if [ -z "$DOWNLOAD_URL" ]; then
        print_error "No AppImage found in latest release."
        exit 1
    fi

    # Create directory if it doesn't exist
    INSTALL_DIR="$HOME/Applications"
    mkdir -p "$INSTALL_DIR"
    
    APP_PATH="$INSTALL_DIR/PedroPathingVisualizer.AppImage"
    
    print_info "Downloading to $APP_PATH..."
    curl -L -o "$APP_PATH" "$DOWNLOAD_URL"
    
    print_status "Making executable..."
    chmod +x "$APP_PATH"
    
    # Optional: Create Desktop Entry
    if [ -d "$HOME/.local/share/applications" ]; then
        print_info "Creating desktop entry..."
        cat > "$HOME/.local/share/applications/pedro-visualizer.desktop" << EOL
[Desktop Entry]
Name=Pedro Pathing Visualizer
Exec=$APP_PATH
Icon=utilities-terminal
Type=Application
Categories=Development;
Comment=Visualizer for Pedro Pathing
Terminal=false
EOL
        print_status "Desktop shortcut created."
    fi

    print_status "Installation Complete!"
    echo "Run it via: $APP_PATH"
}

# Main Script Execution
print_logo

# Detect OS
OS_TYPE=$(uname -s)
case "$OS_TYPE" in
    Darwin*)    DETECTED_OS="macOS" ;;
    Linux*)     DETECTED_OS="Linux" ;;
    CYGWIN*|MINGW*|MSYS*) DETECTED_OS="Windows" ;;
    *)          DETECTED_OS="Unknown" ;;
esac

echo "Detected System: $DETECTED_OS"
echo ""
echo "Select installation type:"
echo "1) macOS (DMG)"
echo "2) Linux (AppImage)"
echo "3) Windows (Info)"
echo ""
read -p "Enter choice [1-3] (Default: Auto-detect): " CHOICE

if [ -z "$CHOICE" ]; then
    case "$DETECTED_OS" in
        "macOS") CHOICE=1 ;;
        "Linux") CHOICE=2 ;;
        "Windows") CHOICE=3 ;;
        *) print_error "Could not auto-detect OS. Please select manualy."; exit 1 ;;
    esac
fi

case "$CHOICE" in
    1)
        install_mac
        ;;
    2)
        install_linux
        ;;
    3)
        print_header "Windows Installation"
        echo "This script cannot install the Windows .exe directly."
        echo "Please download the latest 'Pedro-Pathing-Visualizer-Setup.exe' from:"
        echo ""
        echo "   https://github.com/Mallen220/PedroPathingVisualizer/releases/latest"
        echo ""
        ;;
    *)
        print_error "Invalid selection."
        exit 1
        ;;
esac