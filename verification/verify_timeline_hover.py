from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    try:
        page.goto("http://localhost:4173")
    except:
        print("Could not connect to localhost:4173.")
        return

    # Wait for the app to load
    page.wait_for_load_state("networkidle")

    # Check if there is a dialog
    # The error showed "whats-new-title".
    dialog = page.locator('div[role="dialog"][aria-labelledby="whats-new-title"]')
    if dialog.count() > 0 and dialog.first.is_visible():
        print("Whats New Dialog found. attempting to close via Escape.")
        page.keyboard.press("Escape")
        page.wait_for_timeout(500)

    # Locate the slider to confirm we are on the page
    slider = page.locator('input[type="range"]')
    expect(slider).to_be_visible()

    # Add a path to ensure markers exist
    add_path_btn = page.get_by_role("button", name="Add Path")
    if add_path_btn.is_visible():
        try:
            add_path_btn.click()
        except Exception as e:
             print(f"Could not click Add Path normally: {e}")
             print("Trying force.")
             add_path_btn.click(force=True)

        page.wait_for_timeout(500)

    markers = page.locator('div[role="button"][aria-label]')

    count = markers.count()
    print(f"Found {count} markers")

    if count > 0:
        first_marker = markers.first

        # Check Initial Opacity
        opacity = first_marker.evaluate("el => window.getComputedStyle(el).opacity")
        print(f"Initial opacity: {opacity}")

        if opacity != "0":
            print("Error: Marker should have opacity 0 initially")
        else:
            print("Verified: Initial opacity is 0")

        # Hover
        first_marker.hover(force=True)

        # Wait for transition
        page.wait_for_timeout(300)

        opacity_hover = first_marker.evaluate("el => window.getComputedStyle(el).opacity")
        print(f"Hover opacity: {opacity_hover}")

        if opacity_hover == "1":
             print("Verified: Marker opacity is 1 on hover")
        else:
             print("Error: Marker opacity is not 1 on hover")

        # Take a screenshot while hovering
        page.screenshot(path="verification/verification.png")
        print("Screenshot taken")

    else:
        print("No markers found to verify")
        page.screenshot(path="verification/verification_failed.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
