import sys
import os
import joblib
import pandas as pd
import json

def main(model_path, value_to_test):
    model = joblib.load(model_path)
    
    value_df = pd.DataFrame([[value_to_test]], columns=['count'])
    
    prediction = model.predict(value_df)
    decision = model.decision_function(value_df)
    
    result = {
        "prediction": int(prediction[0]), # 1 = inlier, -1 = outlier
        "score": float(decision[0])
    }
    
    print(json.dumps(result))



if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Usage: python predict.py <model_path> <count>"}))
        sys.exit(1)

    model_path = sys.argv[1]
    count = float(sys.argv[2])
    
    main(model_path, count)