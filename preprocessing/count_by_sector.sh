#!/bin/bash

input_file="movement2.csv"
# Define the output file
output_file="countBySectors.json"

# Use awk to extract the fourth column and count occurrences, plus various stuff for add [] and , but not for the last line
awk -F',' '{
    count[$4]++
}
END {
    print "["; 
    first=1;
    for (id in count) {
        if (!first) {
            printf ",";
        } else {
            first=0;
        }
        printf "{\"id\": %d, \"count\": %d}", id, count[id];
    }
    print "]";
}' "$input_file" > "$output_file"