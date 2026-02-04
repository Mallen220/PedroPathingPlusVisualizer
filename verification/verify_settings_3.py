from playwright.sync_api import sync_playwright

def verify_settings(page):
    page.goto("http://localhost:4173")
    page.wait_for_timeout(3000)

    try:
        page.keyboard.press("Escape")
        page.wait_for_timeout(500)
    except:
        pass

    page.keyboard.press("Control+,")

    try:
        page.wait_for_selector("text=Settings", timeout=2000)
    except:
        pass

    if page.is_visible("text=Settings"):
        page.get_by_text("Code Export").click(force=True)
        page.wait_for_timeout(500)

        # Locate checkbox by finding the container with text "Auto Export Code"
        # SettingsItem usually wraps label and content in a div.
        # We look for a container that has the text and an input.
        container = page.locator("div").filter(has_text="Auto Export Code").filter(has=page.locator("input[type='checkbox']")).last
        checkbox = container.locator("input[type='checkbox']")

        if not checkbox.is_checked():
            checkbox.check()
            page.wait_for_timeout(500)

        page.screenshot(path="/home/jules/verification/settings_code_export_enabled.png")
        print("Screenshot taken")

    else:
        print("Failed to open settings")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_settings(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
