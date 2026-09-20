import json
import re

with open('scratch_script.txt', 'r', encoding='utf-8') as f:
    text = f.read()

prefix = 'window.__reactRouterContext.streamController.enqueue('
idx = text.find(prefix)
if idx != -1:
    content_part = text[idx + len(prefix):].rstrip('); \n\r')
    # This is a JSON string literal like "..."
    # load it with json.loads to decode string
    try:
        unwrapped = json.loads(content_part)
        parsed_array = json.loads(unwrapped)
        print(f"Parsed array with {len(parsed_array)} elements")
        
        # Save readable conversational texts
        conversation_blocks = []
        for item in parsed_array:
            if isinstance(item, str) and len(item.strip()) > 50:
                conversation_blocks.append(item)
                
        with open('extracted_chat_messages.txt', 'w', encoding='utf-8') as out:
            for b in conversation_blocks:
                out.write("==============================\n")
                out.write(b + "\n\n")
        print(f"Wrote {len(conversation_blocks)} blocks to extracted_chat_messages.txt")
    except Exception as e:
        print(f"Error parsing json: {e}")
