### What's New!

## **Features:**

- **Embed Pose Data in Code**: You can now choose to embed pose data directly into the generated Java file instead of loading it from an external `.pp` file. This is useful for teams who prefer a single-file solution.
- **NextFTC Support (Experimental)**: Added experimental support for exporting code compatible with the NextFTC library. Select it from the "Target Library" dropdown in the Sequential Command export.
- **Enhanced Code Export**:
    - **Full Class Generation**: Option to generate the complete Java class structure, including imports and package declaration.
    - **Code Search**: Quickly find specific parts of your generated code using the new search bar (Ctrl+F).
    - **Project Download**: Easily download your project as a `.pp` file directly from the JSON export view.
- **Advanced Optimization Settings**: Fine-tune the path optimizer with new settings for:
    - **Iterations**: Control how long the optimizer runs.
    - **Population Size**: Adjust the number of candidate paths per generation.
    - **Mutation Rate & Strength**: Tweak how aggressively the optimizer explores new paths.
- **Optimizer Improvements**: The path optimizer now provides better feedback ("Validating...") and strictly prevents applying paths that still have collisions.

## **Bug Fixes:**

- **Optimizer Stability**: Fixed issues where the optimizer might suggest invalid paths. It now enforces collision checks before allowing you to apply the result.
