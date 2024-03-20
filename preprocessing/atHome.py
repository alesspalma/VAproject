import pandas as pd
import os
from multiprocessing import Pool


# Function to process a single CSV file
def process_csv(file_path):
    print(f"Processing {file_path}")
    # Read CSV file into a DataFrame
    df = pd.read_csv(
        file_path, dtype={"participantId": str, "apartmentId": str, "JobId": str}
    )

    # Filter rows where currentMode is 'AtHome'
    df_at_home = df[df["currentMode"] == "AtHome"]

    # Drop duplicates based on 'participantId', 'currentMode', and 'apartmentId'
    df_at_home_unique = df_at_home.drop_duplicates(
        subset=["participantId", "apartmentId"]
    )

    return df_at_home_unique


# Function to process multiple CSV files
def process_multiple_csv(files, use_multiprocess=False):
    # Create an empty DataFrame to store combined data
    combined_df = pd.DataFrame()
    if use_multiprocess:
        # Create a multiprocessing Pool
        with Pool() as pool:
            # Read and process CSV files in parallel
            dfs = pool.map(process_csv, files)

        # Concatenate the processed DataFrames
        combined_df = pd.concat(dfs, ignore_index=True)
    else:
        # Process each CSV file and append to combined DataFrame
        for file in files:
            df = process_csv(file)
            combined_df = pd.concat([combined_df, df], ignore_index=True)

    combined_df = combined_df.drop_duplicates(subset=["participantId", "apartmentId"])

    # Convert 'participantId' column to integer and 'timestamp' to datetime for the correct sorting
    combined_df["timestamp"] = pd.to_datetime(combined_df["timestamp"])
    combined_df["participantId"] = combined_df["participantId"].astype(int)

    # Sort by 'participantId'
    combined_df = combined_df.sort_values(by="timestamp")
    combined_df = combined_df.sort_values(by="participantId")

    return combined_df


INPUT_PATH = "../data/Datasets/ActivityLogs/"

# List all CSV files in the directory
csv_files = [
    f"{INPUT_PATH}{file}" for file in os.listdir(INPUT_PATH) if file.endswith(".csv")
]
print("CSV files to process:", len(csv_files))

# Process multiple CSV files
result_df = process_multiple_csv(csv_files)
print("Processed all CSV files")

# Write result to a new CSV file called 'atHome.csv' without the last empty row
data1 = result_df.iloc[0 : len(result_df) - 1]
data2 = result_df.iloc[[len(result_df) - 1]]
data1.to_csv("../atHome.csv", sep=",", encoding="utf-8", header=False, index=False)
data2.to_csv(
    "../atHome.csv",
    sep=",",
    encoding="utf-8",
    header=False,
    index=False,
    mode="a",
    lineterminator="",
)

print("Processed and saved 'atHome.csv'")
