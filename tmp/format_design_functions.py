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
    (r'function refreshDesignPreview\(\).*?(?=\n\s*function updateDesignField)', 'refreshDesignPreview'),
    (r'function appearancePage\(\).*?(?=\n\s*/\* ---------------- Billing)', 'appearancePage'),
]

for pattern, name in patterns:
    source_match = re.search(pattern, current, flags=re.S)
    formatted_match = re.search(pattern, formatted, flags=re.S)
    if not source_match or not formatted_match:
        raise SystemExit(f'Could not isolate {name}')
    formatted_function = '  ' + formatted_match.group(0).rstrip()
    current = current[:source_match.start()] + formatted_function + '\n' + current[source_match.end():].lstrip('\n')

path.write_text(current)
print('Formatted only the changed Design functions')
