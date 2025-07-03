import os
import sys
import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib
import matplotlib.pyplot as plt
import numpy as np


def plot_training_data():
    base_dir = os.path.dirname(__file__)
    csv_path = os.path.join(base_dir, 'data', 'data.csv')
    model_path = os.path.join(base_dir, 'model', 'if_model.pkl')

    df = pd.read_csv(csv_path)
    df = df.dropna(subset=['count'])

    model = joblib.load(model_path)

    # Generate anomaly scores
    df['score'] = model.decision_function(df[['count']])
    df['anomaly'] = model.predict(df[['count']])

    # Plot
    plt.figure(figsize=(10, 6))
    normal = df[df['anomaly'] == 1]
    outliers = df[df['anomaly'] == -1]

    plt.scatter(normal.index, normal['count'], label="Normal", alpha=0.7)
    plt.scatter(outliers.index, outliers['count'], color='red', label="Anomaly", alpha=0.9)
    plt.title("Training Data with Anomaly Detection")
    plt.xlabel("Index")
    plt.ylabel("Visit Count")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.show()


def plot_prediction_range():
    base_dir = os.path.dirname(__file__)
    model_path = os.path.join(base_dir, 'model', 'if_model.pkl')
    model = joblib.load(model_path)

    # Generate test values from 1 to 100
    test_values = np.arange(1, 101).reshape(-1, 1)
    predictions = model.predict(test_values)
    scores = model.decision_function(test_values)

    # Plot
    plt.figure(figsize=(10, 6))
    plt.scatter(test_values, scores, c=np.where(predictions == -1, 'red', 'green'), label='Scores')
    plt.axhline(y=0, color='gray', linestyle='--', label='Decision Threshold (~0)')
    plt.title("Isolation Forest Predictions for Values 1–100")
    plt.xlabel("Visit Count")
    plt.ylabel("Anomaly Score")
    plt.grid(True)
    plt.legend()
    plt.tight_layout()
    plt.show()


def estimate_contamination(df):
    q1 = df['count'].quantile(0.25)
    q3 = df['count'].quantile(0.75)
    iqr = q3 - q1
    outliers = df[(df['count'] < q1 - 1.5 * iqr) | (df['count'] > q3 + 1.5 * iqr)]
    contamination = len(outliers) / len(df)
    return min(max(contamination, 0.01), 0.05)  # cap between 1% and 5%


def train_model():
    print("\n=====Training Model=====")
    base_dir = os.path.dirname(__file__)
    csv_path = os.path.join(base_dir, 'data', 'data.csv')
    model_path = os.path.join(base_dir, 'model', 'if_model.pkl')
    
    df = pd.read_csv(csv_path)
    
    if 'count' not in df.columns:
        raise ValueError(f"Missing 'count' column in {csv_path}")
    
    df = df.dropna(subset=['count'])
    
    contamination = estimate_contamination(df)
    print("contamination value: ", contamination)
    
    model = IsolationForest(contamination=contamination, random_state=42)
    model.fit(df[['count']])
    
    joblib.dump(model, model_path)
    print(f"Model saved: {model_path}")
    
    


def test_model(value_to_test):
    print("\n=====Testing Model=====")
    base_dir = os.path.dirname(__file__)
    model_path = os.path.join(base_dir, 'model', 'if_model.pkl')

    model = joblib.load(model_path)
    
    value_df = pd.DataFrame([[value_to_test]], columns=['count'])
    
    prediction = model.predict(value_df)
    decision = model.decision_function(value_df)

    # IsolationForest returns:
    #  1 for inliers, -1 for outliers
    if prediction[0] == 1:
        print(f"✅  {value_to_test} [{decision[0]}]")
    else:
        print(f"⚠️  {value_to_test} [{decision[0]}]")
    


def train_model_for_file(csv_path, model_path):
    df = pd.read_csv(csv_path)
    
    if 'count' not in df.columns:
        raise ValueError(f"Missing 'count' column in {csv_path}")
    
    df = df.dropna(subset=['count'])
    
    contamination = estimate_contamination(df)
    print("contamination value: ", contamination)
    
    model = IsolationForest(contamination=contamination, random_state=42)
    model.fit(df[['count']])
    
    joblib.dump(model, model_path)
    print(f"Model saved: {model_path}")
    
    
def main(data_dir, model_dir):
    os.makedirs(model_dir, exist_ok=True)
    
    for filename in os.listdir(data_dir):
        if filename.endswith(".csv"):
            embassy_user_id = filename.replace(".csv", "")
            csv_path = os.path.join(data_dir, filename)
            model_path = os.path.join(model_dir, f"{embassy_user_id}.pkl")

            try:
                train_model_for_file(csv_path, model_path)
            except Exception as e:
                print(f"Failed to train model for {filename}: {e}")



# train_model()

# plot_training_data()

# plot_prediction_range()

# test_model(0)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 train.py <data_dir> <model_dir>")
        sys.exit(1)

    data_dir = sys.argv[1]
    model_dir = sys.argv[2]
    
    main(data_dir, model_dir)