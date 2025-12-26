import pandas as pd
import json
import re

file_path = '2025.xlsx'
xl = pd.ExcelFile(file_path)

# Map sheets to approximate time labels
sheet_labels = []
# We will just use the sheet names as time labels for now, or simplify them.
# Or we can try to map them to "Tháng 1", "Tháng 2"...
# Let's try to interpret the list.
sheets = xl.sheet_names

monthly_data = [] # List of { label: "...", scores: {name: val} }
cumulative_scores = {}

def normalize_name(name):
    if not isinstance(name, str):
        return str(name)
    name = name.strip()
    if name == "Linh Mar":
        return "Linh Đào"
    return name

# Heuristic to guess month from sheet name
def guess_label(sheet_name, index, total_sheets):
    # Simply mapping index to a progression throughout the year
    # If we have ~16 sheets, it covers the year.
    # We can just return the sheet name for accuracy, or try to be fancy.
    # The user asked for "Tính tháng" (Calculate by month).
    # Grouping strictly by month might be hard if sheets bridge months.
    # Instead, let's treat each sheet as a data point and label it with the likely month.
    
    name = sheet_name.replace(' ', '')
    if '2412-101' in name: return "Tháng 1"
    if '111-221' in name: return "Tháng 1"
    if '102-113' in name: return "Tháng 2"
    if '113-283' in name: return "Tháng 3"
    if '283-55' in name: return "Tháng 4"
    if '55-265' in name: return "Tháng 5"
    if '275-27' in name: return "Tháng 6"
    if '37-68' in name: return "Tháng 7 & 8"
    if '78-129' in name: return "Tháng 9"
    if '1010' in name: return "Tháng 10"
    if '0111' in name or '1411' in name or '2111' in name: return "Tháng 11"
    if '512' in name or '1212' in name: return "Tháng 12"
    
    return sheet_name

for i, sheet_name in enumerate(sheets):
    try:
        df = xl.parse(sheet_name)
        if 'Unnamed: 0' in df.columns:
            df.rename(columns={'Unnamed: 0': 'Name'}, inplace=True)
            
        if 'Name' not in df.columns or 'Phạt' not in df.columns:
            continue
            
        current_sheet_scores = {}
        
        for _, row in df.iterrows():
            name = row['Name']
            fine = row['Phạt']
            
            if pd.isna(name) or pd.isna(fine):
                continue
            
            name = normalize_name(name)

            if "Tổng" in name:
                continue

            try:
                fine = float(fine)
            except:
                continue
                
            current_sheet_scores[name] = current_sheet_scores.get(name, 0) + fine

        # Update cumulative
        for name, val in current_sheet_scores.items():
            cumulative_scores[name] = cumulative_scores.get(name, 0) + val
            
        # Snapshot
        label = guess_label(sheet_name, i, len(sheets))
        
        # We need a list of objects for the JS
        # Sort by value
        sorted_sc = sorted(cumulative_scores.items(), key=lambda x: x[1], reverse=True)
        # Keep all data, frontend filters top 10
        
        monthly_data.append({
            "label": label,
            "data": [{"name": k, "val": v} for k, v in sorted_sc]
        })
        
    except Exception as e:
        print(f"Skipping {sheet_name}: {e}")

# Output to JS file
js_content = f"const raceData = {json.dumps(monthly_data, ensure_ascii=False, indent=2)};"
with open('saodo_wrap/race_data.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Created race_data.js")
