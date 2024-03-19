import pandas as pd
import numpy as np

# Load the participant location counts file
participant_location_counts = pd.read_csv(
    "../participant_location_counts.csv", dtype={"participantId": str}
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


# Function to calculate Euclidean distance between two points
def euclidean_distance(point1, point2):
    return np.sqrt((point1[0] - point2[0]) ** 2 + (point1[1] - point2[1]) ** 2)


# Iterate over each row in the participant location counts DataFrame
for index, row in participant_location_counts.iterrows():
    participant_location = tuple(
        map(float, row["currentLocation"].strip("POINT ()").split())
    )

    # Find the nearest restaurant or pub based on participant's current mode
    if row["currentMode"] == "AtRestaurant":
        filtered_restaurant_data = restaurant_data
        nearest_restaurant_dist = float("inf")
        nearest_restaurant_building_id = None
        for restaurant_index, restaurant_row in filtered_restaurant_data.iterrows():
            restaurant_location = restaurant_row["location"]
            distance = euclidean_distance(participant_location, restaurant_location)
            if distance <= 100 and distance < nearest_restaurant_dist:
                nearest_restaurant_dist = distance
                nearest_restaurant_building_id = restaurant_row["buildingId"]
        # Add buildingId to the participant location counts DataFrame
        participant_location_counts.at[index, "buildingId"] = (
            nearest_restaurant_building_id
        )
    elif row["currentMode"] == "AtRecreation":
        filtered_pubs_data = pubs_data
        nearest_pub_dist = float("inf")
        nearest_pub_building_id = None
        for pub_index, pub_row in filtered_pubs_data.iterrows():
            pub_location = pub_row["location"]
            distance = euclidean_distance(participant_location, pub_location)
            if distance <= 100 and distance < nearest_pub_dist:
                nearest_pub_dist = distance
                nearest_pub_building_id = pub_row["buildingId"]
        # Add buildingId to the participant location counts DataFrame
        participant_location_counts.at[index, "buildingId"] = nearest_pub_building_id


def add_distance_column(participant_location_counts):

    # Read participant augmented file
    participant_augmented = pd.read_csv(
        "../data/Datasets/Attributes/ParticipantsAugmented.csv",
        dtype={"participantId": str},
    )

    # Merge participant location counts with participant augmented data on participantId
    merged_df = pd.merge(
        participant_location_counts,
        participant_augmented[["participantId", "locationX", "locationY"]],
        on="participantId",
        how="left",
    )

    merged_df["currentLocation_X"] = merged_df["currentLocation"].apply(
        lambda x: float(x.strip("POINT ()").split()[0])
    )
    merged_df["currentLocation_Y"] = merged_df["currentLocation"].apply(
        lambda x: float(x.strip("POINT ()").split()[1])
    )

    # Calculate Euclidean distance between currentLocation and (locationX, locationY)
    merged_df["distance"] = np.sqrt(
        (merged_df["locationX"] - merged_df["currentLocation_X"]) ** 2
        + (merged_df["locationY"] - merged_df["currentLocation_Y"]) ** 2
    )

    # Drop 'locationX' and 'locationY' columns
    merged_df = merged_df.drop(
        ["locationX", "locationY", "currentLocation_X", "currentLocation_Y"], axis=1
    )

    # Save the updated DataFrame to a new CSV file
    return merged_df


participant_location_counts = add_distance_column(participant_location_counts)
print("Updated CSV file with distance column generated successfully.")

# Write the updated DataFrame to a CSV file
participant_location_counts.to_csv(
    "../participant_location_counts_with_building.csv", index=False
)
print("Output CSV file with buildingId generated successfully.")
