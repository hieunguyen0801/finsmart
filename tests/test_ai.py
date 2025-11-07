import pytest
import requests

BASE_URL = "http://localhost:5000"

# Test khi user có đủ dữ liệu (user_id=1 giả định đã có dữ liệu)
def test_predict_transaction_success():
    response = requests.get(f"{BASE_URL}/predict/transactions", params={"user_id": 1, "periods": 30})
    assert response.status_code == 200
    json_data = response.json()
    assert "forecast" in json_data
    assert len(json_data["forecast"]) == 30

# Test khi user không đủ dữ liệu
def test_predict_transaction_insufficient_data():
    response = requests.get(f"{BASE_URL}/predict/transactions", params={"user_id": 999})  # 999 giả định chưa có data
    assert response.status_code == 404
    json_data = response.json()
    assert "message" in json_data
    assert "không đủ" in json_data["message"]

# Test yêu cầu ảnh
def test_predict_transaction_image_only():
    response = requests.get(f"{BASE_URL}/predict/transactions", params={"user_id": 1, "full_data": "false"})
    assert response.status_code == 200
    json_data = response.json()
    assert "plot" in json_data
    assert "forecast" in json_data

