from supabase import create_client
import pandas as pd
from prophet import Prophet
from flask import Flask, jsonify, request
import io
import base64
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use("Agg")
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app)  # Cho phép CORS cho tất cả routes

SUPABASE_URL = os.getenv("REACT_APP_SUPABASE_URL")
SUPABASE_KEY = os.getenv("REACT_APP_SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_user_financial_data(user_id: int) -> pd.DataFrame:
    response_income = supabase.table("income").select("created_at, amount").eq("user_id", user_id).execute()
    response_transactions = supabase.table("transactions").select("created_at, amount").eq("user_id", user_id).execute()

    if not response_income.data and not response_transactions.data:
        print(f"Khong co du lieu income hoac transactions cho user_id: {user_id}")
        return pd.DataFrame()

    df_income = pd.DataFrame(response_income.data)
    df_transactions = pd.DataFrame(response_transactions.data)

    df_income["created_at"] = pd.to_datetime(df_income["created_at"], format="ISO8601", errors="coerce").dt.date
    df_transactions["created_at"] = pd.to_datetime(df_transactions["created_at"], format="ISO8601", errors="coerce").dt.date

    df_income = df_income.groupby("created_at", as_index=False).agg({"amount": "sum"})
    df_income.rename(columns={"created_at": "ds", "amount": "total_income"}, inplace=True)

    df_transactions = df_transactions.groupby("created_at", as_index=False).agg({"amount": "sum"})
    df_transactions.rename(columns={"created_at": "ds", "amount": "total_spent"}, inplace=True)

    start_date = min(df_income["ds"].min(), df_transactions["ds"].min())  # Lấy ngày nhỏ nhất từ income & transaction
    end_date = max(df_income["ds"].max(), df_transactions["ds"].max())    # Lấy ngày lớn nhất từ income & transaction
    all_days = pd.date_range(start=start_date, end=end_date, freq="D")

    df_full = pd.DataFrame({"ds": all_days})
    df_full["ds"] = df_full["ds"].dt.date  # Chuyển về dạng date

    df_full = df_full.merge(df_income, on="ds", how="left").fillna(0)
    df_full = df_full.merge(df_transactions, on="ds", how="left").fillna(0)

    df_full["balance"] = 0

    current_balance = 0
    balance_list = []
    
    for _, row in df_full.iterrows():
        current_balance += row["total_income"]
        current_balance -= row["total_spent"]
        balance_list.append(current_balance)

    df_full["balance"] = balance_list  

    df_full["total_income"] = df_full["total_income"].astype(int)
    df_full["total_spent"] = df_full["total_spent"].astype(int)
    df_full["balance"] = df_full["balance"].astype(int)

    print("Du lieu tai chinh da xu ly:")
    print(df_full.tail())

    return df_full


def preprocess_transactions(user_id: int) -> pd.DataFrame:
    response = supabase.table("transactions").select("created_at, amount").eq("user_id", user_id).execute()

    if not response.data:
        print(f"Khong co du lieu cho user_id = {user_id}")
        return pd.DataFrame()

    df = pd.DataFrame(response.data)
    
    if df.empty:
        print(" Khong co du lieu de xu ly.")
        return df

    df["created_at"] = pd.to_datetime(df["created_at"], format="ISO8601", errors="coerce").dt.date # Chỉ lấy ngày, bỏ giờ

    #  Gộp dữ liệu theo ngày (tổng số tiền chi tiêu mỗi ngày)
    df = df.groupby("created_at", as_index=False).agg({"amount": "sum"})

    # Đổi tên cột cho Prophet
    df.rename(columns={"created_at": "ds", "amount": "y"}, inplace=True)

    #  Tạo danh sách đầy đủ các ngày từ ngày nhỏ nhất đến lớn nhất
    all_days = pd.date_range(start=df["ds"].min(), end=df["ds"].max(), freq="D")

    # Tạo DataFrame với tất cả ngày đầy đủ
    df_full = pd.DataFrame({"ds": all_days})

    # Chuyển cột 'ds' về dạng datetime64 để tránh lỗi khi merge
    df["ds"] = pd.to_datetime(df["ds"])
    df_full["ds"] = pd.to_datetime(df_full["ds"])

    # Gộp dữ liệu, điền ngày không có chi tiêu bằng 0
    df_full = df_full.merge(df, on="ds", how="left").fillna(0)

    # Chuyển số tiền về kiểu số nguyên (VNĐ)
    df_full["y"] = df_full["y"].astype(int)

    # Hiển thị thông tin
    print("Du lieu sau khi xu ly:")
    print(df_full.tail())

    return df_full

def get_model():
    holidays = pd.DataFrame({
    "holiday": "tet",
    "ds": pd.to_datetime(["2025-01-29", "2026-02-17"]),
    "lower_window": -7,  # Ảnh hưởng trước Tết 7 ngày
    "upper_window": 7,   # Ảnh hưởng sau Tết 7 ngày
    })
    model = Prophet(
        
    seasonality_mode="additive",  # Giữ additive nếu biến động không tăng theo thời gian
    changepoint_prior_scale=0.1,  # Giảm để tránh bắt nhiễu
    holidays=holidays,
    holidays_prior_scale=5.0     # Tăng để phản ánh biến động mạnh của Tết 
    )
    model.add_seasonality(
            name="monthly",
            period=30.5,
            fourier_order=3,
            prior_scale=3.0
        )
    
    return model

@app.route('/predict/transactions', methods=['GET'])
def predict_transaction():
    try:
        user_id = int(request.args.get('user_id', 1))
        periods = int(request.args.get('periods', 30))
        full_data = request.args.get('full_data', 'false')
        
        df_processed = preprocess_transactions(user_id)
        
        if df_processed.empty or (df_processed.shape[0]) < 30:
            print(len(df_processed))
            return jsonify({"message":"Du lieu tai chinh hien tai cua ban khong du de du doan hay giao dich it nhat 1 thang!"}), 404
        model = get_model()
        model.fit(df_processed)

        future = model.make_future_dataframe(periods=periods)

        forecast = model.predict(future)
        forecast["yhat"] = forecast["yhat"].clip(lower=0)

        next_month_spending = forecast.tail(30)["yhat"].sum()

        print(f" Tong chi tieu du doan trong thang toi: {next_month_spending:,.0f} VND")

        model.plot(forecast)
        # Tạo hình ảnh
        fig = model.plot(forecast)
        plt.ticklabel_format(style='plain', axis='y')
        plt.ylabel("VNĐ")
        
        # Chuyển hình thành base64
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        plot_data = base64.b64encode(buf.getvalue()).decode('utf-8')
        plt.close()
        if full_data == "true":
            return jsonify({
                "forecast": forecast[["ds", "yhat"]].to_dict(orient="records")
            })
        else:
            return jsonify({
                "plot": plot_data,
                "forecast": forecast[["ds", "yhat"]].tail(periods).to_dict(orient='records')
            })
    except Exception as e:
        return jsonify({"message": str(e)}), 500


@app.route('/predict/financial', methods=['GET'])
def predict_user_financial():
    try:
        user_id = int(request.args.get('user_id', 1))
        periods = int(request.args.get('periods', 30))
        full_data = request.args.get('full_data', 'false')
        
        df_prophet = get_user_financial_data(user_id=user_id)
        
        if df_prophet.empty or (df_prophet.shape[0]) < 30:
            return jsonify({"message":"Du lieu tai chiunh hien tai cua ban khong du de du doan hay giao dich it nhat 1 thang!"}), 404
        df_prophet.rename(columns={"balance": "y"}, inplace=True)
        
        train_size = int(len(df_prophet) * 0.8)
        df_train = df_prophet[:train_size]
        df_test = df_prophet[train_size:]
        model = get_model()
        model.fit(df_train)  # Huấn luyện mô hình

        future = model.make_future_dataframe(periods=periods)
        forecast = model.predict(future)

        fig = model.plot(forecast)
        plt.ylabel("Triệu VNĐ")
        
        # Chuyển thành base64
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        plot_data = base64.b64encode(buf.getvalue()).decode('utf-8')
        plt.close()
        if full_data == "true":
            return jsonify({
                "forecast": forecast[["ds", "yhat"]].to_dict(orient="records")
            })
        else:
            return jsonify({
                "plot": plot_data,
                "forecast": forecast[["ds", "yhat"]].tail(periods).to_dict(orient='records')
            })
    except Exception as e:
        return jsonify({"message": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)