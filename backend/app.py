from flask import Flask, request, jsonify
import pandas
from sklearn.decomposition import PCA
from sklearn import preprocessing
from flask_cors import CORS
import numpy
from sklearn.cluster import KMeans, DBSCAN
from sklearn.mixture import GaussianMixture

app = Flask(__name__)
CORS(app) # This will enable CORS for all routes

@app.route('/pca', methods=['POST'])
def pca():
    # Retrieve input argument from the query parameters
    data = request.json.get('data')

    df1 = pandas.read_csv("../data/Datasets/Attributes/ParticipantsAugmented.csv", header=0)
    if len(data) > 0:
        df1 = df1[df1["participantId"].isin(data)]

    df = df1[
        [
            # "participantId",
            "householdSize", # 2
            # "haveKids",
            "age", # 2
            "educationLevel", # 2
            # "interestGroup",
            "joviality", # 2
            #"engels",
            "Education", # 4
            "Food", # 2
            "Recreation", # 2
            "RentAdjustment", # 2
            "Shelter", # 2
            #"Wage",
            #"locationX",
            #"locationY",
        ]
    ]

    if "educationLevel" in df.columns:
        value_map_d = {
            "Low": 0,
            "HighSchoolOrCollege": 1,
            "Bachelors": 2,
            "Graduate": 3,
        }
        df.loc[:, "educationLevel"] = df["educationLevel"].apply(lambda x: value_map_d.get(x))
    #print(df)
    #print(df.shape)

    d = df.values

    # Perform PCA
    # normalize the data with StandardScaler
    d_std = preprocessing.StandardScaler().fit_transform(d)
    # compute PCA
    pca = PCA(n_components=min(len(df.columns), len(df)))
    d_pca = pca.fit_transform(d_std)

    # insert the participantId column
    d_pca = numpy.insert(d_pca, 0, df1["participantId"], axis=1)
    #print(d_pca)
    # perform kmeans on the first 2 principal components
    #clusters = KMeans(n_clusters=4, random_state=1, n_init=10).fit_predict(d_pca[:, 1:3])
    clusters = GaussianMixture(n_components=4, n_init=10, init_params='random_from_data', random_state=0).fit_predict(d_pca[:, 1:3])
    #clusters = DBSCAN().fit_predict(d_pca[:, 1:3])

    #print(len(clusters))
    d_pca = numpy.insert(d_pca, len(d_pca[0]), clusters, axis=1)
    return jsonify({'transformed_data': d_pca.tolist()})

if __name__ == '__main__':
    app.run(debug=True)
