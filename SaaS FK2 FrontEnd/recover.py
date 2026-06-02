import json
import os

log_file = r'C:\Users\CRM\.gemini\antigravity-ide\brain\869ea8a1-969b-47f6-8b04-b9b539d2acb9\.system_generated\logs\transcript.jsonl'
target_dir = r'd:\SaaS_FK\SaaS FK2 FrontEnd'

file_contents = {}
original_paths = {}

def get_content(filepath):
    filepath = filepath.strip('"\'')
    norm_path = os.path.normpath(filepath).lower()
    if norm_path not in file_contents:
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                file_contents[norm_path] = f.read()
        else:
            file_contents[norm_path] = ''
    return file_contents[norm_path]

def set_content(filepath, content):
    filepath = filepath.strip('"\'')
    norm_path = os.path.normpath(filepath).lower()
    if isinstance(content, str):
        if content.startswith('"') and content.endswith('"'):
            try:
                content = json.loads(content)
            except:
                pass
    file_contents[norm_path] = content
    original_paths[norm_path] = filepath

with open(log_file, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            step = json.loads(line)
        except:
            continue
        
        tool_calls = step.get('tool_calls', [])
        for call in tool_calls:
            name = call.get('name')
            args = call.get('args', {})
            
            # The args might be a JSON string
            if isinstance(args, str):
                try:
                    args = json.loads(args)
                except:
                    args = {}
            
            if name == 'default_api:write_to_file' or name == 'write_to_file':
                filepath = args.get('TargetFile', '')
                if filepath and filepath.strip('"\'').endswith(('.tsx', '.css', '.ts', '.js')):
                    set_content(filepath, args.get('CodeContent', ''))
                    
            elif name == 'default_api:replace_file_content' or name == 'replace_file_content':
                filepath = args.get('TargetFile', '')
                if filepath and filepath.strip('"\'').endswith(('.tsx', '.css', '.ts', '.js')):
                    content = get_content(filepath)
                    lines = content.split('\n')
                    start = int(args.get('StartLine', 1)) - 1
                    end = int(args.get('EndLine', len(lines)))
                    
                    chunk = '\n'.join(lines[start:end])
                    target = args.get('TargetContent', '')
                    if isinstance(target, str) and target.startswith('"') and target.endswith('"'):
                        try: target = json.loads(target)
                        except: pass
                        
                    replacement = args.get('ReplacementContent', '')
                    if isinstance(replacement, str) and replacement.startswith('"') and replacement.endswith('"'):
                        try: replacement = json.loads(replacement)
                        except: pass
                    
                    if target in chunk:
                        if args.get('AllowMultiple', False):
                            chunk = chunk.replace(target, replacement)
                        else:
                            chunk = chunk.replace(target, replacement, 1)
                    
                    lines[start:end] = chunk.split('\n')
                    set_content(filepath, '\n'.join(lines))
                    
            elif name == 'default_api:multi_replace_file_content' or name == 'multi_replace_file_content':
                filepath = args.get('TargetFile', '')
                if filepath and filepath.strip('"\'').endswith(('.tsx', '.css', '.ts', '.js')):
                    content = get_content(filepath)
                    chunks = args.get('ReplacementChunks', [])
                    if isinstance(chunks, str):
                        try: chunks = json.loads(chunks)
                        except: chunks = []
                        
                    chunks = sorted(chunks, key=lambda x: int(x.get('StartLine', 0)), reverse=True)
                    
                    lines = content.split('\n')
                    for chunk_info in chunks:
                        start = int(chunk_info.get('StartLine', 1)) - 1
                        end = int(chunk_info.get('EndLine', len(lines)))
                        chunk_str = '\n'.join(lines[start:end])
                        
                        target = chunk_info.get('TargetContent', '')
                        if isinstance(target, str) and target.startswith('"') and target.endswith('"'):
                            try: target = json.loads(target)
                            except: pass
                            
                        replacement = chunk_info.get('ReplacementContent', '')
                        if isinstance(replacement, str) and replacement.startswith('"') and replacement.endswith('"'):
                            try: replacement = json.loads(replacement)
                            except: pass
                        
                        if target in chunk_str:
                            if chunk_info.get('AllowMultiple', False):
                                chunk_str = chunk_str.replace(target, replacement)
                            else:
                                chunk_str = chunk_str.replace(target, replacement, 1)
                        
                        lines[start:end] = chunk_str.split('\n')
                    set_content(filepath, '\n'.join(lines))

print(f"Recovering {len(file_contents)} files...")
for norm_path, content in file_contents.items():
    orig_path = original_paths.get(norm_path)
    if orig_path and 'SaaS_FK' in orig_path:
        os.makedirs(os.path.dirname(orig_path), exist_ok=True)
        with open(orig_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Restored: {orig_path}")
