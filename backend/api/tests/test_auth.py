# What it checks:
# You can log in and get a JWT.
# /api/me/ returns the correct user when a valid token is provided.


# backend/api/tests/test_auth.py
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

User = get_user_model()

class TestAuth(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="alice", password="pass1234", role="student"
        )

    def test_jwt_login_and_me(self):
        # 1) obtain token
        url = reverse("token_obtain_pair")  # /api/auth/token/
        res = self.client.post(url, {"username": "alice", "password": "pass1234"}, format="json")
        self.assertEqual(res.status_code, 200, res.content)
        access = res.data["access"]

        # 2) call /api/me/
        me_url = reverse("me")
        res = self.client.get(me_url, HTTP_AUTHORIZATION=f"Bearer {access}")
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(res.data["username"], "alice")
        self.assertEqual(res.data["role"], "student")

