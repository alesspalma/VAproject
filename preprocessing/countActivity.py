import pandas as pd
from glob import glob

# Define the path to your data files
DATA_PATH = "../data/Datasets/ActivityLogs/*.csv"

# Initialize an empty DataFrame to store the results
results_df = pd.DataFrame(
    columns=["participantId", "currentLocation", "count", "currentMode"]
)

# Iterate over each file in the directory
for file_path in glob(DATA_PATH):
    print(f"Processing {file_path}")

    # Read data from the current file
    df = pd.read_csv(file_path, dtype={"participantId": str})

    # Convert timestamp to datetime object
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    # Round timestamp to nearest hour
    df["timestamp"] = df["timestamp"].dt.round("h")

    # Filter rows where currentMode is 'AtRestaurant' or 'AtRecreation'
    filtered_df = df[df["currentMode"].isin(["AtRestaurant", "AtRecreation"])]

    # Group by participantId, currentLocation, currentMode, and timestamp (count how many times each participant is at each location within each hour, usless to our scenario)
    grouped_df = (
        filtered_df.groupby(
            ["participantId", "currentLocation", "currentMode", "timestamp"]
        )
        .size()
        .reset_index(name="count")
    )

    # Aggregate count over each location within each hour (useless aggregation function just to obtain a row to have a count after)
    agg_df = (
        grouped_df.groupby(
            ["participantId", "currentLocation", "currentMode", "timestamp"]
        )["count"]
        .max()
        .reset_index()
    )

    # Count the unique occurrences of each participant at each location (here we have the correct counting)
    counts = (
        agg_df.groupby(["participantId", "currentLocation", "currentMode"])
        .size()
        .reset_index(name="count")
    )

    # Append the counts to the results DataFrame
    results_df = pd.concat([results_df, counts], ignore_index=True)

# Write the results to a CSV file
results_df.to_csv("../participant_location_counts.csv", index=False)

print("Output CSV file generated successfully.")
