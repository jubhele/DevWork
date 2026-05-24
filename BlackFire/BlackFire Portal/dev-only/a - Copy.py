import os
import re

def fix_js_bugs(file_path="portal.js"):
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return

    # Read the original file
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # --- BUG FIX 1: Prevent GET requests from attaching a body ---
    # fetch() throws a TypeError if a GET or HEAD request has a body. 
    # Ensure body is only appended for valid HTTP methods (like POST/PUT/PATCH).
    content = content.replace(
        "if (data) opts.body = JSON.stringify(data);",
        "if (data && method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD') opts.body = JSON.stringify(data);"
    )

    # --- BUG FIX 2: Add 401 Session Expiration handling to apiUpload() ---
    # Bring apiUpload() to parity with api() so file uploads gracefully handle 
    # expired sessions instead of crashing the UI during JSON parsing.
    api_upload_replacement = """    const res = await fetch(API_BASE + '/files.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      body: fd,
    });
    if (res.status === 401) {
      if (typeof SESSION !== 'undefined' && SESSION) {
        SESSION = null;
        document.documentElement.dataset.state = 'login';
        if (typeof showLoginPanel === 'function') showLoginPanel();
        if (typeof toast === 'function') toast('Session expired. Please log in again.', 'err');
      }
      return { success: false, error: 'Session expired' };
    }
    return await res.json();"""

    old_api_upload_fetch = """    const res = await fetch(API_BASE + '/files.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      body: fd,
    });
    return await res.json();"""
    
    content = content.replace(old_api_upload_fetch, api_upload_replacement)

    # Write the patched content back to the file
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Successfully patched bugs in {file_path}!")

if __name__ == "__main__":
    # Ensure portal.js is in the same directory as this script
    target_file = "portal.js"
    fix_js_bugs(target_file)