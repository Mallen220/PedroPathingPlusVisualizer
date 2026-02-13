from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    page.goto("http://localhost:4174/")
    page.wait_for_load_state("networkidle")
    page.keyboard.press("Shift+N")
    dialog = page.locator("[role='dialog'][aria-labelledby='whats-new-title']")
    expect(dialog).to_be_visible(timeout=5000)
    page.fill("input[placeholder='Search...']", "Windows Store")
    page.wait_for_timeout(1000)
    results = page.locator("button h3")
    if results.count() > 0:
        results.first.click()
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/whats_new_search.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
