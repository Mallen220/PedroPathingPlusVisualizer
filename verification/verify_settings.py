from playwright.sync_api import sync_playwright

def verify_settings(page):
    page.goto("http://localhost:4173")

    # Wait for app to load
    page.wait_for_timeout(3000)

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

        # Click "Code Export" tab with force=True to bypass overlay check if legitimate
        page.get_by_text("Code Export").click(force=True)
        page.wait_for_timeout(1000)

        page.screenshot(path="/home/jules/verification/settings_code_export.png")
        print("Screenshot taken")

    else:
        print("Failed to open settings")
        page.screenshot(path="/home/jules/verification/failed_to_open_settings.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_settings(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
        finally:
            browser.close()
