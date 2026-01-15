
from playwright.sync_api import sync_playwright, expect
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:4173/")

    # Wait for the app to load
    expect(page.get_by_role("heading", name="Pedro Pathing Visualizer").first).to_be_visible()

    # Check if "What's New" dialog is open and close it
    time.sleep(1)
    try:
        whats_new = page.locator("div[aria-labelledby='whats-new-title']")
        if whats_new.is_visible():
            print("Found What's New dialog, closing it...")
            page.keyboard.press("Escape")
            expect(whats_new).not_to_be_visible()
            print("Closed What's New dialog")
    except Exception as e:
        print(f"Error handling dialog: {e}")

    # Ensure loading screen is gone
    loading_screen = page.locator("#loading-screen")
    if loading_screen.is_visible():
        print("Waiting for loading screen to disappear...")
        expect(loading_screen).not_to_be_visible(timeout=10000)

    # Get initial estimated time
    est_time_label = page.get_by_text("Est. Time")
    time_element = est_time_label.locator("xpath=..").locator("span").nth(1)

    initial_time_text = time_element.text_content()
    print(f"Initial Time: {initial_time_text}")

    # Open Settings
    print("Opening Settings...")
    page.get_by_role("button", name="Settings").click()

    # Wait for Settings dialog
    expect(page.get_by_role("dialog", name="Settings")).to_be_visible()

    # Expand Motion Parameters if needed
    print("Expanding Motion Parameters...")
    motion_btn = page.get_by_text("Motion Parameters")
    motion_btn.click()

    # Find Angular Velocity input
    ang_vel_input = page.locator("#angular-velocity")
    expect(ang_vel_input).to_be_visible()

    # Change Angular Velocity to a very small value to increase time
    print("Changing Angular Velocity...")
    ang_vel_input.fill("0.1")
    ang_vel_input.press("Enter")

    # Close Settings
    print("Closing Settings...")
    # Use exact match for the bottom Close button
    page.get_by_role("button", name="Close", exact=True).click()

    # Wait for dialog to close
    expect(page.get_by_role("dialog", name="Settings")).not_to_be_visible()

    # Get new estimated time
    new_time_text = time_element.text_content()
    print(f"New Time: {new_time_text}")

    # Take screenshot
    page.screenshot(path="/home/jules/verification/verification.png")

    # Assert that time has changed
    if initial_time_text == new_time_text:
        print("FAIL: Time did not change!")
        exit(1)
    else:
        print("PASS: Time changed.")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
