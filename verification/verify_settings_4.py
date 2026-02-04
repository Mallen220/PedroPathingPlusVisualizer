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

        container = page.locator("div").filter(has_text="Auto Export Code").filter(has=page.locator("input[type='checkbox']")).last
        checkbox = container.locator("input[type='checkbox']")

        if not checkbox.is_checked():
            checkbox.check()
            page.wait_for_timeout(500)

        # Scroll down in the settings content
        # Find the scrollable container.
        # It's usually the one with class "overflow-y-auto".
        # We can just focus on the last element or scroll programmatically.
        # Let's try hovering over "OpMode Group" if it exists, or just scroll the panel.

        # We assume the new fields are rendered.
        # Let's verify they exist first.
        # "Include Warning"
        # "OpMode Group"

        # If "Java Class" is selected (default), they should be there.

        # Scroll to bottom
        # page.mouse.wheel(0, 500)

        # Better: locate "OpMode Group" and scroll into view.
        try:
            opmode_group = page.get_by_label("OpMode Group") # Or by text
            opmode_group.scroll_into_view_if_needed()
        except:
            # Maybe label isn't associated correctly. Try finding text.
            page.locator("text=OpMode Group").scroll_into_view_if_needed()

        page.wait_for_timeout(500)
        page.screenshot(path="/home/jules/verification/settings_code_export_scrolled.png")
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
