import os
import re

def fix_js_links():
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Target the files in the refactored directory
    files_to_check = [
        os.path.join(script_dir, 'refactored_portal', 'portal.php'),
        os.path.join(script_dir, 'refactored_portal', 'includes', 'portal_footer.php')
    ]
    
    # The new modular JS files
    new_scripts = (
        '<script src="js/portal_api.js"></script>\n'
        '<script src="js/portal_state.js"></script>\n'
        '<script src="js/portal_main.js"></script>'
    )
    
    # Regex to catch any variation (e.g., src="portal.js", src="./portal.js", src="portal.js?v=123")
    old_script_regex = r'<script[^>]*src="[^"]*portal\.js[^"]*"[^>]*></script>'
    
    fixed_something = False
    
    for filepath in files_to_check:
        if not os.path.exists(filepath):
            continue
            
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if re.search(old_script_regex, content):
            content = re.sub(old_script_regex, new_scripts, content)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
                
            print(f"Fixed broken JS links inside: {os.path.basename(filepath)}")
            fixed_something = True

    if fixed_something:
        print("\nAll done! Refresh your browser (you may need to press Ctrl+F5 to clear the cache) and the buttons will come back to life.")
    else:
        print("\nCould not find the old script tags. Press F12 in your browser, check the 'Console' tab for red errors, and let me know what they say!")

if __name__ == "__main__":
    fix_js_links()