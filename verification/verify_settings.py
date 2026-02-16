from playwright.sync_api import sync_playwright

def test_settings_buttons(page):
    print("Navigating to app...")
    # 1. Arrange: Go to the app
    page.goto("http://localhost:3000")

    # 2. Act: Dismiss onboarding if present
    try:
        page.wait_for_selector(".driver-overlay", timeout=5000)
        print("Onboarding detected, dismissing...")
        # Try pressing Escape multiple times or clicking the overlay
        page.keyboard.press("Escape")
        page.wait_for_timeout(500)
        page.keyboard.press("Escape")
        page.wait_for_timeout(1000) # Wait for animation
    except:
        print("No onboarding detected or timed out waiting for it.")

    print("Waiting for settings button...")
    # 3. Act: Open Settings
    page.wait_for_selector("#settings-btn")
    # Force click to bypass any remaining overlay if possible
    page.click("#settings-btn", force=True)

    print("Waiting for settings dialog...")
    # 4. Assert: Check for "Settings" title
    page.wait_for_selector("#settings-title")

    print("Waiting for Export/Import buttons...")
    # 5. Assert: Check for Export and Import buttons
    # I can use get_by_title or text
    page.wait_for_selector("button[title='Export Settings']")
    page.wait_for_selector("button[title='Import Settings']")

    print("Taking screenshot...")
    # 6. Screenshot
    page.screenshot(path="/home/jules/verification/settings_dialog.png")
    print("Screenshot saved.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_settings_buttons(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
            raise e
        finally:
            browser.close()
