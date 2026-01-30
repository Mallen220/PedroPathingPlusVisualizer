from playwright.sync_api import sync_playwright
import time

def verify_empty_state():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Mock electronAPI and settings
        page.add_init_script("""
            window.electronAPI = {
                getSavedDirectory: () => Promise.resolve(null),
                getDirectory: () => Promise.resolve(null),
                listFiles: () => Promise.resolve([]),
                getAppDataPath: () => Promise.resolve('/tmp'),
                readFile: () => Promise.resolve(JSON.stringify({ lastSeenVersion: '1.7.1' })),
                on: () => {},
                off: () => {}
            };
            localStorage.setItem('pedro-settings', JSON.stringify({ lastSeenVersion: '1.7.1' }));
        """)

        page.goto("http://localhost:5173")

        # Wait a bit for initial render
        time.sleep(2)

        # Brute force remove the dialog if it exists
        page.evaluate("""
            const dialog = document.querySelector('div[role="dialog"][aria-labelledby="whats-new-title"]');
            if (dialog) dialog.remove();
        """)

        # Also remove loading screen if stuck
        page.evaluate("""
            const loader = document.getElementById('loading-screen');
            if (loader) loader.remove();
        """)

        # Wait for app to load
        page.wait_for_selector("text=Path 1", timeout=15000)

        # Find the delete button for Path 1
        delete_btn = page.locator('button[title="Delete Path"]')

        # Click to arm confirmation
        delete_btn.click()

        # Wait for "Confirm" text or aria-label change
        confirm_btn = page.locator('button[aria-label="Confirm Deletion"]')
        confirm_btn.wait_for(state="visible", timeout=2000)

        # Click confirm
        confirm_btn.click()

        # Now we expect empty state
        # Look for "Start your path" text
        page.wait_for_selector("text=Start your path", timeout=5000)

        # Look for "Add Path" button inside empty state
        add_path_btn = page.locator('button', has_text="Add Path").first
        add_path_btn.wait_for(state="visible", timeout=2000)

        # Take screenshot
        page.screenshot(path="verification/empty_state.png")

        browser.close()

if __name__ == "__main__":
    verify_empty_state()
