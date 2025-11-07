from locust import HttpUser, task, between
import random

class FinancialUser(HttpUser):
    wait_time = between(1, 3)  # Đợi ngẫu nhiên giữa 1s và 3s giữa các request

    @task(2)
    def predict_transactions(self):
        user_id = random.randint(1, 5)  # Random user_id để mô phỏng nhiều user
        periods = random.choice([30, 60])
        self.client.get(f"/predict/transactions?user_id={user_id}&periods={periods}")

    @task(1)
    def predict_financial(self):
        user_id = random.randint(1, 5)
        periods = random.choice([30, 60])
        self.client.get(f"/predict/financial?user_id={user_id}&periods={periods}")
