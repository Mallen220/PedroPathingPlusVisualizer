# Installation Guide

Pedro Pathing Visualizer is available for macOS, Windows, and Linux. This guide covers installation and common troubleshooting steps.

## System Requirements

- **Operating System**:
  - macOS 10.13+ (Intel or Apple Silicon)
  - Windows 10/11
  - Linux (Ubuntu/Debian recommended)
- **Memory**: 4GB RAM recommended
- **Disk Space**: ~300MB

## macOS

### Method 1: One-line Installer (Recommended)

Open your Terminal and run the following command:

```bash
curl -fsSL https://raw.githubusercontent.com/Mallen220/PedroPathingVisualizer/main/install.sh | bash
```

Enter your password when prompted to complete the installation. This script downloads the latest version and handles permissions automatically.

### Method 2: Manual Installation

1. Go to the [Releases Page](https://github.com/Mallen220/PedroPathingVisualizer/releases).
2. Download the latest `.dmg` file.
3. Open the `.dmg` file.
4. Drag "Pedro Pathing Visualizer.app" to your Applications folder.
5. Right-click the app and select "Open", then confirm.

### Troubleshooting

**"App is damaged and can't be opened"**
Run this command in Terminal:
```bash
sudo xattr -rd com.apple.quarantine "/Applications/Pedro Pathing Visualizer.app"
```

**Gatekeeper Blocking**
1. Open System Settings → Privacy & Security.
2. Scroll down to the Security section.
3. Click "Open Anyway" next to the notification about Pedro Pathing Visualizer.

## Windows

1. Go to the [Releases Page](https://github.com/Mallen220/PedroPathingVisualizer/releases).
2. Download the latest `.exe` installer.
3. Run the installer and follow the wizard.

### Troubleshooting

**SmartScreen Warning**
Windows might flag the installer because it's not signed with an expensive certificate.
1. Click "More info".
2. Click "Run anyway".

**Antivirus False Positive**
Some antivirus software might flag new executables. Add an exception for the application directory if this happens.

## Linux

We provide `.deb` packages for Debian/Ubuntu and `.AppImage` files for other distributions.

### Method 1: .deb Package (Ubuntu/Debian)

1. Download the `.deb` file from [Releases](https://github.com/Mallen220/PedroPathingVisualizer/releases).
   - Use `_amd64.deb` for standard PCs.
   - Use `_arm64.deb` for ARM-based devices (like Raspberry Pi 4/5).
2. Install via command line:
   ```bash
   sudo dpkg -i Pedro*.deb
   ```

### Method 2: AppImage (Universal)

1. Download the `.AppImage` file from [Releases](https://github.com/Mallen220/PedroPathingVisualizer/releases).
2. Make it executable:
   ```bash
   chmod +x Pedro*.AppImage
   ```
3. Run it:
   ```bash
   ./Pedro*.AppImage
   ```

### Troubleshooting

**Missing Dependencies**
If the AppImage fails to run, you might need `libfuse2`:
```bash
sudo apt install libfuse2
```
