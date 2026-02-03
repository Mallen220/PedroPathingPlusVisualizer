### What's New!

## **Features:**

### **Path Statistics & Graphs**

- **Deep Analysis**: View detailed breakdowns of your path's performance, including total time, distance, and maximum velocities.
- **Interactive Graphs**: Visualize velocity, acceleration, centripetal force, and angular velocity over time.
- **Safety Insights**: Get warnings about potential wheel slip or velocity limit violations.
- **Access It**: Click the **"Stats"** button in the editor toolbar or press **S**.

### **Diff Mode**

- **Compare Changes**: See exactly what changed between your current edits and the last saved version.
- **Visual Feedback**: The field shows both the current robot and the saved robot (ghosted) to compare trajectories.
- **Change Log**: A dedicated tab lists added, removed, and modified events with detailed property diffs.
- **Enable It**: Toggle Diff View with **Alt+D** or via the Command Palette.

### **Live Code Preview**

- **Real-time Code Generation**: See your Java code update instantly as you modify your path.
- **Smart Diff View**: Additions are highlighted in green and removals in red, making it easy to track changes.
- **Enable It**: To start using this feature, go to **Settings > Auto Export** and toggle **"Auto Export Code"** to ON. A new "Code" tab will appear in the editor.

### **Export Improvements**

- **Direct Download**: You can now download the generated code as a `.java` file directly from the Code tab.
- **Smart Filenames**: The downloader automatically suggests a filename based on your project or class name.
- **Quick Settings**: Access "Auto Export Settings" directly from the preview toolbar to switch between Java Class and Sequential formats.

### **Follow Robot Mode**

- **Automatic Camera Tracking**: The field view now follows your robot during playback, keeping the action centered.
- **Seamless Control**: Manually panning or zooming temporarily pauses tracking, allowing you to inspect specific details. Tracking resumes automatically when you restart playback.
- **Enable It**: Toggle this feature in **Settings > Interface > Follow Robot**.

## **Performance:**

### **Optimized Code Preview**

- **Smarter Generation**: The Code tab now only generates Java code when you are actually viewing it. This significantly improves performance and battery life while editing paths.
