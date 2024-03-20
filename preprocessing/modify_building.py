import json


def modify_building_type(json_data, building_ids, new_building_type):
    data = json.loads(json_data)

    geometries = data["objects"]["buildings"]["geometries"]

    for geometry in geometries:
        building_id = geometry["properties"]["buildingId"]
        if building_id in building_ids:
            geometry["properties"]["buildingType"] = new_building_type

    return json.dumps(data, indent=4)


# Read building JSON file
with open("buildings.json", "r") as file:
    json_data = file.read()

# List of restaurant buildingId
building_ids_to_restaurant = [
    304,
    308,
    58,
    964,
    181,
    164,
    619,
    875,
    917,
    86,
    991,
    27,
    679,
    124,
    888,
    160,
    714,
    213,
    101,
    285,
]

# Modifica buildingType
modified_json_data = modify_building_type(
    json_data, building_ids_to_restaurant, "Restaurant"
)

# List of restaurant buildingId
building_ids_to_pub = [
    556,
    29,
    1012,
    502,
    164,
    238,
    429,
    489,
    585,
    953,
    234,
    627,
]

# Modifica buildingType
modified_json_data = modify_building_type(
    modified_json_data, building_ids_to_pub, "Pub"
)

# Stampa del documento JSON modificato
with open("buildings_mod.json", "w") as outfile:
    outfile.write(modified_json_data)

print("File saved in 'buildings_mod.json'.")
