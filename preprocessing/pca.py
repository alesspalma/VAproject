import pandas
import numpy as np
from matplotlib import pyplot as plt
from sklearn.decomposition import PCA
from sklearn import preprocessing

df1 = pandas.read_csv("../ParticipantsWithEngels.csv", header=0)
df_drop = pandas.read_csv("../DroppedOut.csv", header=0)
df2 = pandas.read_csv("../AggregatedFinancialJournal.csv", header=0)

# exclude the dropped out participants
df1 = df1[~df1["participantId"].isin(df_drop["participantId"])]
df2 = df2[~df2["participantId"].isin(df_drop["participantId"])]

df2 = df2.pivot_table(
    index="participantId", columns="category", values="amount", fill_value=0
).reset_index()
df1 = df1.merge(df2, on="participantId", how="left")

# read data from a xlsx file with heders
df = df1[
    [
        # "participantId",
        "householdSize",
        # "haveKids",
        "age",
        "educationLevel",
        # "interestGroup",
        "joviality",
        "engels",
        "Education",
        "Food",
        "Recreation",
        "RentAdjustment",
        "Shelter",
        "Wage",
    ]
]

value_map_d = {
    "Low": 0,
    "HighSchoolOrCollege": 1,
    "Bachelors": 2,
    "Graduate": 3,
}
df.loc[:, "educationLevel"] = df["educationLevel"].apply(lambda x: value_map_d.get(x))
print(df)
print(df.shape)

d = df.values
print(df.columns, len(df.columns))
# used for x projections#############
zeros = [0 for i in range(len(d))]  # [0,0,0,0,0,.....
minusOnes = [-1 for i in range(len(d))]  # [-1,-1,-1,-1,-1,.....
minusTwos = [-2 for i in range(len(d))]  # [-2,-2,-2,-2,-2,.....
minusThrees = [-3 for i in range(len(d))]  # [-3,-3,-3,-3,-3,...
##################################

# normalize the data with StandardScaler
d_std = preprocessing.StandardScaler().fit_transform(d)
# compute PCA
pca = PCA(n_components=len(df.columns))
d_pca = pca.fit_transform(d_std)

# computing the mean on the 2 axes
mean_x1 = np.mean(d_std[:, 0])
mean_x2 = np.mean(d_std[:, 1])
mean_vector = np.array([[mean_x1], [mean_x2]])

print("Mean Vector:\n", mean_vector)

# computing the covariance matrix
cov_mat = np.cov(d_std.T)
print("Covariance Matrix:\n", cov_mat)

# eigenvectors and eigenvalues from the covariance matrix
d_val, d_vec = np.linalg.eig(cov_mat)
print("Eigenvectors:\n", d_vec.T)

for i in range(len(d_val)):
    print("Eigenvalue {} from covariance matrix: {}".format(i + 1, d_val[i]))
    print(40 * "-")

# plotting eigenvectors on the scatterplot
x_y_ratio = 1.2  # compensate the wrong aspect ration of the plot
plt.figure()
plt.plot(
    mean_x1,
    mean_x2,
    "o",
    markersize=7,
    color="red",
    alpha=0.5,
    label="(mu_x1,mu_x2)",
)
plt.title("Eigenvectors")

soa = [
    [
        mean_x1,
        mean_x2,
        (d_vec.T[0][0] + mean_x1),
        x_y_ratio * d_vec.T[0][1] + x_y_ratio * mean_x2,
    ],
    [
        mean_x1,
        mean_x2,
        d_vec.T[1][0] + mean_x1,
        x_y_ratio * d_vec.T[1][1] + x_y_ratio * mean_x2,
    ],
]
X, Y, U, V = zip(*soa)  # quiver data for printing arrows
ax = plt.gca()
ax.quiver(X, Y, U, V, angles="xy", scale_units="xy", scale=1)
plt.plot(
    d_std[:, 0],
    x_y_ratio * d_std[:, 1],
    "o",
    markersize=5,
    color="blue",
    alpha=0.5,
    label="normalized data",
)
plt.xlabel("X1")
plt.ylabel("X2")
plt.legend()
plt.show()

plt.plot(
    d_pca[:, 0],
    d_pca[:, 1],
    "o",
    markersize=3,
    color="blue",
    alpha=0.5,
    label="PCA transformed data in the new 2D space",
)
plt.xlabel("Y1")
plt.ylabel("Y2")
plt.legend()
plt.title("Transformed data with PCA")
plt.show()

plt.figure(figsize=(8, 6))
plt.plot(
    d_pca[:, 0],
    1 + d_pca[:, 1],
    "o",
    markersize=3,
    color="blue",
    alpha=0.5,
    label="PCA transformed data in the new 2D space (moved at y=+1 for readability)",
)
plt.plot(
    d_pca[:, 0],
    zeros,
    "o",
    markersize=7,
    color="green",
    alpha=0.5,
    label="PCA first component proj:  THE RESULT",
)
plt.plot(
    d_pca[:, 1],
    minusOnes,
    "o",
    markersize=7,
    color="red",
    alpha=0.5,
    label="PCA second component proj (moved at y=-1 and rotated for readability)",
)
plt.plot(
    d_std[:, 0],
    minusTwos,
    "o",
    markersize=7,
    color="orange",
    alpha=0.5,
    label="Original X1 projection(moved at y=-2 for readability)",
)
plt.plot(
    d_std[:, 1],
    minusThrees,
    "o",
    markersize=7,
    color="blue",
    alpha=0.5,
    label="Original X2 projection (moved at y=-3 and rotated for readability)",
)
plt.xlabel("Y1")
plt.ylabel("Y2")
plt.legend()
plt.title("Comparison")
plt.show()

# plot pca values with multiple colors assigned by the column interestGroup or Wage in df1
# assign a color to each value of the column interestGroup
plt.figure(figsize=(8, 6))
plt.scatter(
    d_pca[:, 0],
    d_pca[:, 1],
    # c=df1["interestGroup"].apply(lambda x: ord(x)),
    c=df1["Wage"],
    cmap="viridis",
    alpha=0.8,
)
plt.xlabel("Y1")
plt.ylabel("Y2")
plt.legend()
plt.title("PCA Wage colored data")
plt.show()

# plt.figure(figsize=(8, 6))
# plt.scatter(
#     df["joviality"],
#     df["Wage"],
#     # c=df1["interestGroup"].apply(lambda x: ord(x)),
#     c=df1["Wage"],
#     cmap="viridis",
#     alpha=0.8,
# )
# plt.xlabel("joviality")
# plt.ylabel("Wage")
# plt.legend()
# plt.title("PCA Wage colored data")
# plt.show()

print(d_pca)
print(d_pca.shape)

column_names = [f"PCA{i}" for i in range(1, len(df.columns) + 1)]
df_pca = pandas.DataFrame(d_pca, columns=column_names)
# insert the participantId column
df_pca.insert(0, "participantId", df1["participantId"])
print(df_pca)

df_pca.to_csv("../PCA.csv", index=False)
