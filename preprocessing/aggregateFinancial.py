import pandas as pd

# Read the CSV file into a DataFrame
df = pd.read_csv("./data/Datasets/Journals/FinancialJournal.csv")

# Take the absolute value of the 'amount' column
df["amount"] = df["amount"].abs()

# Group by 'participantId' and 'category', summing the 'amount' for each group
result_df = df.groupby(["participantId", "category"])["amount"].sum().reset_index()

# Write the result to a new CSV file
result_df.to_csv("AggregatedFinancialJournal.csv", index=False)
