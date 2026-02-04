from playwright.sync_api import sync_playwright

def verify_settings(page):
    page.goto("http://localhost:4173")

    # Wait for app to load
    page.wait_for_timeout(3000)

    # Dismiss tutorial if present
    try:
        # Close button for Onboarding Tutorial
        # It's an svg inside a button usually.
        # "Welcome to Pedro Pathing Plus Visualizer!" text is there.
        # Check for close button.
        # Or click "Next" until done?
        # Or click the X.
        # Let's try to find the X.
        close_tutorial = page.locator("button[aria-label='Close tutorial']")
        if close_tutorial.is_visible():
            close_tutorial.click()
        else:
            # Maybe just click on the backdrop or the X in the dialog header?
            # Inspecting screenshot: X is top right.
            # Let's just try pressing Escape.
            page.keyboard.press("Escape")
            page.wait_for_timeout(500)
    except:
        pass

    # Try pressing Ctrl+,
    page.keyboard.press("Control+,")

    # Wait for dialog
    try:
        page.wait_for_selector("text=Settings", timeout=2000)
    except:
        pass

    # Check if Settings opened
    if page.is_visible("text=Settings"):
        print("Settings dialog open")

        # Click "Code Export" tab
        page.get_by_text("Code Export").click(force=True)
        page.wait_for_timeout(1000)

        page.screenshot(path="/home/jules/verification/settings_code_export_2.png")
        print("Screenshot taken")

    else:
        print("Failed to open settings")
        page.screenshot(path="/home/jules/verification/failed_to_open_settings_2.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_settings(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error_2.png")
        finally:
            browser.close()
