from playwright.sync_api import Page, expect, sync_playwright
import time

def test_stats_dialog(page: Page):
    # 1. Arrange: Go to the app
    page.goto("http://localhost:4173/")

    # Wait for app to load
    page.wait_for_selector("text=Pedro Pathing Plus Visualizer")

    # 2. Act: Click the Stats button
    # The Stats button has text "Stats"
    stats_btn = page.get_by_role("button", name="Stats")
    stats_btn.click()

    # 3. Assert: Dialog opens
    # It should have "Path Statistics" title
    expect(page.get_by_role("heading", name="Path Statistics")).to_be_visible()

    # 4. Screenshot
    time.sleep(1) # Wait for animation
    page.screenshot(path="verification_stats.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_stats_dialog(page)
        finally:
            browser.close()
