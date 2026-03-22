import time
from playwright.sync_api import sync_playwright

def verify_feature(page):
    # Navigate to the app
    page.goto("http://localhost:4173")
    page.wait_for_timeout(2000)

    # Close What's New
    whats_new_close = page.locator("div[role='dialog'] button:has(.lucide-x), button:has-text('Close')").first
    if whats_new_close.count() > 0:
        whats_new_close.click(force=True)
        page.wait_for_timeout(1000)
    else:
        page.keyboard.press("Escape")
        page.wait_for_timeout(500)

    # Close Tutorial
    tutorial_close = page.get_by_text("×", exact=True)
    if tutorial_close.count() > 0:
        tutorial_close.first.click(force=True)
        page.wait_for_timeout(500)
    else:
        page.keyboard.press("Escape")
        page.wait_for_timeout(500)

    # Click Settings
    settings_btn = page.locator("button[aria-label='Settings'], button[title='Settings']").first
    if settings_btn.count() > 0:
        settings_btn.click()
    else:
        page.locator("button:has(.lucide-settings), .lucide-settings").first.click()
    page.wait_for_timeout(1000)

    # Click the "Robot" tab
    page.get_by_text("Robot", exact=True).click()
    page.wait_for_timeout(1000)

    # Toggle Camera FOV (using role switch or click on label)
    # the HTML is:
    # <label class="...">
    #   <div class="...">
    #     <span class="text-sm font-medium text-gray-900 dark:text-gray-100">Show Camera FOV Visualization</span>
    # ...
    # Wait! the structure of SettingsItem boolean might not have a button.
    # It might be an input[type="checkbox"]!
    # Let's just click the text to toggle it since it's inside a label!
    fov_label_text = page.locator("text='Show Camera FOV Visualization'")
    if fov_label_text.count() > 0:
        fov_label_text.first.click()

    page.wait_for_timeout(1000)

    # Change range to 100
    range_input = page.locator("input[type='number']").nth(-1) # The last input in the camera section is likely the range. But let's find it better.
    # We can just click on "Camera Range" text to focus or find its associated input
    range_label = page.locator("text='Camera Range'")
    if range_label.count() > 0:
        range_input = range_label.locator("xpath=ancestor::label[1]").locator("input[type='number']").first
        if range_input.count() > 0:
            range_input.fill("100")
            range_input.press("Enter")

    page.wait_for_timeout(1000)

    # Close settings
    page.keyboard.press("Escape")
    page.wait_for_timeout(1000)

    # Take screenshot of the field showing the FOV cone
    page.screenshot(path="/home/jules/verification/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="/home/jules/verification/video")
        page = context.new_page()
        try:
            verify_feature(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
        finally:
            context.close()
            browser.close()
