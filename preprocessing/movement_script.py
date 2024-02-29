import os


def process_logfile(logfile, output_file):
    with open(logfile, "r") as f:
        lines = f.readlines()[1:]  # Skip the first line
        for line in lines:
            fields = line.strip().split(",")
            if fields[3] == "NA":
                continue
            timestamp = fields[0].replace(":00Z", "")
            point = fields[1].split("(")[1].split(")")[0]
            x, y = point.split(" ")
            participant_id = fields[2]
            output_file.write(
                f"{timestamp},{int(float(x))},{int(float(y))},{participant_id}\n"
            )


def remove_duplicates(input_file, output_file):
    previous_key = None
    with open(input_file, "r") as f_in, open(output_file, "w") as f_out:
        lines = [line.split(",") for line in f_in]
        lines.sort(key=lambda x: (x[3], x[0]))
        for line in lines:
            key = line[1] + line[2] + line[3]
            if key != previous_key:
                f_out.write(",".join(line) + "\n")
                previous_key = key


# Remove existing movement.csv and create a new one
if os.path.exists("movement.csv"):
    os.remove("movement.csv")

with open("movement.csv", "w") as movement_file:
    # Process each logfile in data/Datasets/ActivityLogs
    for logfile in os.listdir("data/Datasets/ActivityLogs"):
        if logfile.endswith(".csv"):
            print("Processing", logfile)
            process_logfile(
                os.path.join("data/Datasets/ActivityLogs", logfile), movement_file
            )

# Sort and remove duplicates
# remove_duplicates("movement.csv", "movement2.csv")
# use the following bash line, because the pyton code explode in memory usage:
# sort -t ',' -k 4n -k1 movement.csv | awk -F, '{n=$2$3$4}l1!=n{if(p)print l0; print; p=0}l1==n{p=1}{l0=$0; l1=n}END{print}' >movement2.csv
# also this need 20 GB of memory to run, so be careful

# then do this to split the movement2.csv file into 25MB chunks to be able to display it as svg points
# split -C 25m --numeric-suffixes --additional-suffix=.csv movement2.csv movement_split
