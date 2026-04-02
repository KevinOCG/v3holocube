import re

# Read the file with line numbers
with open('../app/page.tsx', 'r') as f:
    content = f.read()

# Split into lines
lines = content.split('\n')

# Filter out header/footer and strip line number prefixes
cleaned_lines = []
in_content = False

for line in lines:
    if 'FILE_CONTENT_START' in line:
        in_content = True
        continue
    if 'FILE_CONTENT_END' in line:
        in_content = False
        continue
    if not in_content:
        continue
    
    # Strip the line number prefix (number followed by tab)
    # Match pattern like "123\t" at start of line
    cleaned = re.sub(r'^\d+\t', '', line)
    cleaned_lines.append(cleaned)

# Join and write back
cleaned_content = '\n'.join(cleaned_lines)

# Remove trailing empty lines but keep one newline at end
cleaned_content = cleaned_content.rstrip() + '\n'

with open('../app/page.tsx', 'w') as f:
    f.write(cleaned_content)

print(f"Cleaned {len(cleaned_lines)} lines")
print("First 5 lines:")
for i, line in enumerate(cleaned_lines[:5]):
    print(f"  {i+1}: {line[:60]}...")
