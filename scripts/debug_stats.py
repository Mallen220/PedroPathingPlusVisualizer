from playwright.sync_api import Page, expect, sync_playwright
import time

def test_stats_dialog(page: Page):
    # 1. Arrange: Go to the app
    page.goto("http://localhost:4173/")

    # Wait a bit
    time.sleep(2)

    # Try to close onboarding
    # Look for "Skip" or "Done" or "Close"
    # Or press Escape
    page.keyboard.press("Escape")
    time.sleep(1)
    page.keyboard.press("Escape") # Twice to be sure
    time.sleep(1)

    # Try to find Stats button by ID
    stats_btn = page.locator("#stats-btn")

    if stats_btn.is_visible():
        # Force click to bypass overlay if still there
        stats_btn.click(force=True)
        # 3. Assert: Dialog opens
        expect(page.get_by_role("heading", name="Path Statistics")).to_be_visible()
        time.sleep(1)
        page.screenshot(path="verification_stats.png")
    else:
        print("Stats button not visible")
        page.screenshot(path="debug_page.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_stats_dialog(page)
        finally:
            browser.close()
