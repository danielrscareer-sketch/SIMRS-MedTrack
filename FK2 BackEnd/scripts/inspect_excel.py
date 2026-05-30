import pandas as pd
import os

from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent
file_path = BASE_DIR / "data" / "Members Transactions16042026_.xlsx"
if os.path.exists(file_path):
    print(f"File found: {file_path}")
    df = pd.read_excel(file_path)
    print("\nColumns found:")
    print(df.columns.tolist())
    print(f"\nTotal Rows: {len(df)}")
    print("\nSample Data:")
    print(df.head(5))
    
    # Check for nulls in key columns
    print("\nNull counts:")
    print(df.isnull().sum())
    
    # See unique values for Category and Tier to see if there are variations
    print("\nCategory variations (first 20):")
    print(df[df.columns[df.columns.str.contains('Cat', case=False)]].iloc[:,0].unique()[:20] if any(df.columns.str.contains('Cat', case=False)) else "No Category column found")
else:
    print(f"File not found at {file_path}")
