import re
import os

def refactor_portal():
    # Absolute paths mapped to your environment
    base_dir = r"C:\DevWork\BlackFire\BlackFire Portal"
    source_file = os.path.join(base_dir, 'portal.php')
    output_php = os.path.join(base_dir, 'portal_refactored.php')
    css_file = os.path.join(base_dir, 'portal.css')
    js_file = os.path.join(base_dir, 'portal.js')

    # Ensure the target file exists in the directory
    if not os.path.exists(source_file):
        print(f"Error: '{source_file}' not found.")
        print("Please verify the path and try again.")
        return

    print(f"Analyzing '{source_file}'...")
    with open(source_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update Content Security Policy
    # Removes 'unsafe-inline' specifically from the script-src directive
    csp_pattern = r"(script-src 'self') 'unsafe-inline'"
    content, csp_subs = re.subn(csp_pattern, r"\1", content)
    if csp_subs > 0:
        print("✓ CSP header updated (removed unsafe-inline from script-src).")

    # 2. Extract and Externalize CSS
    # Finds all <style> blocks, extracts the content, and links the external file
    style_pattern = re.compile(r'<style[^>]*>(.*?)</style>', re.DOTALL | re.IGNORECASE)
    styles = style_pattern.findall(content)
    
    if styles:
        with open(css_file, 'w', encoding='utf-8') as f:
            f.write("\n".join(styles).strip())
        print(f"✓ Extracted {len(styles)} style block(s) to 'portal.css'.")
        
        # Replace the first style block with the external link, remove any subsequent ones
        content = style_pattern.sub('<link rel="stylesheet" href="portal.css">', content, count=1)
        content = style_pattern.sub('', content)

    # 3. Extract and Externalize JavaScript
    # Finds all <script> blocks (ignoring those that already have a 'src' attribute)
    script_pattern = re.compile(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', re.DOTALL | re.IGNORECASE)
    scripts = script_pattern.findall(content)
    
    if scripts:
        with open(js_file, 'w', encoding='utf-8') as f:
            f.write("\n".join(scripts).strip())
        print(f"✓ Extracted {len(scripts)} script block(s) to 'portal.js'.")
        
        # Replace the first script block with the external source, remove any subsequent ones
        content = script_pattern.sub('<script src="portal.js"></script>', content, count=1)
        content = script_pattern.sub('', content)

    # 4. Convert DOM Event Handlers
    # Converts onclick="actionName()" to data-action="actionName"
    click_pattern = re.compile(r'onclick=["\']([a-zA-Z0-9_]+)\(\)["\']', re.IGNORECASE)
    content, click_subs = click_pattern.subn(r'data-action="\1"', content)
    print(f"✓ Converted {click_subs} inline 'onclick' handlers to 'data-action' attributes.")

    # 5. Save the Refactored File
    with open(output_php, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"\nRefactoring complete. Success.")
    print(f"The updated code has been saved to '{output_php}'.")
    print("Please review 'portal_refactored.php', 'portal.css', and 'portal.js' before deploying.")

if __name__ == "__main__":
    refactor_portal()