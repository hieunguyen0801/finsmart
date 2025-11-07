import pandas as pd
from prophet import Prophet
from sklearn.metrics import mean_absolute_error, mean_squared_error
import numpy as np
import sys
import os

# Thêm đường dẫn đến thư mục src
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))
from backend.ai import get_user_financial_data, get_model

def evaluate_model(user_id=1, split_ratio=0.8):
    df = get_user_financial_data(user_id)
    
    if df.empty or df.shape[0] < 30:
        print(" Dữ liệu không đủ để đánh giá.")
        return

    df = df.rename(columns={"balance": "y"})
    df = df[["ds", "y"]]
    
    # Chia thành train/validation
    train_size = int(len(df) * split_ratio)
    df_train = df[:train_size]
    df_valid = df[train_size:]

    model = get_model()
    model.fit(df_train)

    # Dự đoán trên tập validation
    future = model.make_future_dataframe(periods=len(df_valid))
    forecast = model.predict(future)

    # Chỉ lấy phần tương ứng với validation
    y_true = df_valid["y"].values
    y_pred = forecast.tail(len(df_valid))["yhat"].values

    # MAE và RMSE để đo sai số trung bình 1 ngày của dự đoán và thực tế
    mae = mean_absolute_error(y_true, y_pred) 
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))

    print(f"MAE: {mae:,.2f}")
    print(f"RMSE: {rmse:,.2f}")
    return mae, rmse

if __name__ == "__main__":
    evaluate_model(user_id=1)
