from pathlib import Path
import re
import subprocess

path = Path('public/hap/app.js')
current = path.read_text()

proc = subprocess.run(
    ['npx', 'prettier', 'public/hap/app.js'],
    text=True,
    capture_output=True,
    check=True,
)
formatted = proc.stdout

patterns = [
    (r'function refreshDesignPreview\(\).*?(?=\nfunction updateDesignField)', 'refreshDesignPreview'),
    (r'function appearancePage\(\).*?(?=\n/\* ---------------- Billing)', 'appearancePage'),
]

for pattern, name in patterns:
    source_match = re.search(pattern, current, flags=re.S)
    formatted_match = re.search(pattern, formatted, flags=re.S)
    if not source_match or not formatted_match:
        raise SystemExit(f'Could not isolate {name}')
    current = current[:source_match.start()] + formatted_match.group(0) + current[source_match.end():]

path.write_text(current)
print('Formatted only the changed Design functions')
