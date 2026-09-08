import json
import re
import subprocess
import sys

TARGET = 'public/hap/app.js'

diff = subprocess.check_output(
    ['git', 'diff', '--unified=0', '--', TARGET],
    text=True,
)
changed_lines = set()
for line in diff.splitlines():
    if not line.startswith('@@'):
        continue
    match = re.search(r'\+(\d+)(?:,(\d+))?', line)
    if not match:
        continue
    start = int(match.group(1))
    count = int(match.group(2) or '1')
    changed_lines.update(range(start, start + count))

proc = subprocess.run(
    ['npx', 'eslint', '-f', 'json', TARGET],
    text=True,
    capture_output=True,
)
try:
    report = json.loads(proc.stdout)
except json.JSONDecodeError:
    print(proc.stdout)
    print(proc.stderr, file=sys.stderr)
    raise SystemExit('Could not parse ESLint JSON output')

messages = report[0].get('messages', []) if report else []
errors = [
    message for message in messages
    if message.get('severity') == 2 and message.get('line') in changed_lines
]

if errors:
    print('ESLint errors introduced on changed lines:')
    for message in errors:
        print(f"{TARGET}:{message.get('line')}:{message.get('column')} {message.get('ruleId')}: {message.get('message')}")
    raise SystemExit(1)

baseline_errors = sum(1 for message in messages if message.get('severity') == 2)
print(f'Changed-line ESLint passed. {TARGET} still has {baseline_errors} pre-existing file-wide lint errors outside this patch.')
