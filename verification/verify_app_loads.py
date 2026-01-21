from playwright.sync_api import Page, expect, sync_playwright
import time

def test_app_loads(page: Page):
    page.goto("http://localhost:4173/")

    # Expect title
    expect(page).to_have_title("Pedro Pathing Visualizer")

    # Wait for loading screen to be hidden or removed
    expect(page.locator("#loading-screen")).to_be_hidden(timeout=10000)

    # We can check for a key element in the UI, e.g. the Navbar or PlaybackControls.
    expect(page.locator("#playback-controls")).to_be_visible(timeout=10000)

    # Take screenshot
    page.screenshot(path="verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_app_loads(page)
        finally:
            browser.close()
