#!/usr/bin/env python3
import zipfile
import json
import sys
import argparse

def main():
    parser = argparse.ArgumentParser(description="Extract exact error message from Playwright trace.zip")
    parser.add_argument("zip_path", help="Path to trace.zip")
    args = parser.parse_args()

    try:
        with zipfile.ZipFile(args.zip_path, 'r') as z:
            for filename in z.namelist():
                if filename.endswith('.trace'):
                    with z.open(filename) as f:
                        for line in f:
                            if not line.strip():
                                continue
                            try:
                                data = json.loads(line)
                                if data.get('type') == 'action' and 'error' in data.get('metadata', {}):
                                    err = data['metadata']['error'].get('message', 'No message')
                                    print("--- Action Error ---")
                                    print("Error:", err)
                                    print("API Name:", data['metadata'].get('apiName'))
                                    
                                if data.get('type') == 'error':
                                    print("--- Trace Error ---")
                                    print("Message:", data.get('message'))
                                    stack = data.get('stack', [])
                                    if stack:
                                        print("Location:", f"{stack[0].get('file')}:{stack[0].get('line')}:{stack[0].get('column')}")

                            except Exception:
                                pass
    except Exception as e:
        print("Error reading zip:", e)

if __name__ == '__main__':
    main()
