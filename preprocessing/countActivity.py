import pandas as pd
import numpy as np

# Read data from the current file
df = pd.read_csv(
    "../data/Datasets/Journals/CheckinJournal.csv", dtype={"participantId": str}
)

dropped_out = pd.read_csv(
    "../preprocessing/DroppedOut.csv", dtype={"participantId": str}
)

# Filter out the participants who dropped out
df = df[~df["participantId"].isin(dropped_out["participantId"])]

# Filter rows where venueType is 'Restaurant' or 'Pub'
filtered_df = df[df["venueType"].isin(["Restaurant", "Pub"])]

# Count the unique occurrences of each participant at each location
counts = (
    filtered_df.groupby(["participantId", "venueId", "venueType"])
    .size()
    .reset_index(name="count")
)

# Load the pubs data
pubs_data = pd.read_csv(
    "../data/Datasets/Attributes/Pubs.csv", dtype={"buildingId": str}
)
# Load the restaurant data
restaurant_data = pd.read_csv(
    "../data/Datasets/Attributes/Restaurants.csv", dtype={"buildingId": str}
)

# Convert the 'location' column in pubs_data to a tuple of coordinates
pubs_data["location"] = pubs_data["location"].apply(
    lambda x: tuple(map(float, x.strip("POINT ()").split()))
)

restaurant_data["location"] = restaurant_data["location"].apply(
    lambda x: tuple(map(float, x.strip("POINT ()").split()))
)

participant_augmented = pd.read_csv(
    "../data/Datasets/Attributes/ParticipantsAugmented.csv",
    dtype={"participantId": str},
)


# Function to calculate Euclidean distance between two points
def euclidean_distance(point1, point2):
    return np.sqrt((point1[0] - point2[0]) ** 2 + (point1[1] - point2[1]) ** 2)


# join counts with pubs_data and restaurant_data on venueId == pubId and venueId == restaurantId
counts = pd.merge(
    counts,
    pubs_data,
    left_on="venueId",
    right_on="pubId",
    how="left",
).drop(columns=["pubId"])

merged_df = pd.merge(
    counts,
    restaurant_data,
    left_on=["venueId"],
    right_on=["restaurantId"],
    suffixes=("", "_restaurant"),
    how="left",
).drop(columns=["restaurantId"])

# Update location and buildingId columns from the merged DataFrame
merged_df["location"] = merged_df["location_restaurant"].fillna(merged_df["location"])
merged_df["buildingId"] = merged_df["buildingId_restaurant"].fillna(
    merged_df["buildingId"]
)
merged_df["maxOccupancy"] = merged_df["maxOccupancy_restaurant"].fillna(
    merged_df["maxOccupancy"]
)
merged_df["cost"] = merged_df["hourlyCost"].fillna(merged_df["foodCost"])

# Drop the redundant columns
merged_df = merged_df.drop(
    columns=[
        "location_restaurant",
        "buildingId_restaurant",
        "maxOccupancy_restaurant",
        "hourlyCost",
        "foodCost",
    ],
)

merged_df = merged_df.sort_values(by="participantId")


def add_distance_column(merged_df):

    # Merge participant location counts with participant augmented data on participantId
    merged_df = pd.merge(
        merged_df,
        participant_augmented[["participantId", "locationX", "locationY"]],
        on="participantId",
        how="left",
    )

    merged_df["location_X"] = merged_df["location"].apply(lambda x: float(x[0]))
    merged_df["location_Y"] = merged_df["location"].apply(lambda x: float(x[1]))

    # Calculate Euclidean distance between location and (locationX, locationY)
    merged_df["distance"] = np.sqrt(
        (merged_df["locationX"] - merged_df["location_X"]) ** 2
        + (merged_df["locationY"] - merged_df["location_Y"]) ** 2
    )

    # Drop 'locationX' and 'locationY' columns
    merged_df = merged_df.drop(
        ["locationX", "locationY", "location_X", "location_Y"], axis=1
    )

    # Save the updated DataFrame to a new CSV file
    return merged_df


final_df = add_distance_column(merged_df)
print("Updated df with distance column successfully.")

# Write the updated DataFrame to a CSV file
final_df.to_csv("../data/Datasets/Attributes/VisitsLog.csv", index=False)
print("Output CSV file VisitsLog generated successfully.")
