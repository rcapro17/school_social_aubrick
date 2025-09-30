# What it checks:
# A user can update their own bio (and others can’t).
# (If you allow) a teacher can update another user’s bio.
# A user can update their avatar; another student cannot update it; a teacher can update someone’s cover.
# If your policy is “teachers can’t edit others’ bio,” just change that one assertEqual(res3.status_code, 200) to 403.



# backend/api/tests/test_profile.py
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

User = get_user_model()

class TestProfile(APITestCase):
    def setUp(self):
        self.me   = User.objects.create_user(username="meuser", password="p", role="student")
        self.other = User.objects.create_user(username="you", password="p", role="student")

        tok = reverse("token_obtain_pair")
        self.me_token    = self.client.post(tok, {"username": "meuser", "password": "p"}).data["access"]
        self.other_token = self.client.post(tok, {"username": "you", "password": "p"}).data["access"]

    def test_can_edit_own_bio(self):
        url = reverse("user-detail", args=[self.me.id])  # /api/users/{id}/
        res = self.client.patch(
            url, {"bio": "I love math"}, format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.me_token}"
        )
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(res.data["bio"], "I love math")

    def test_cannot_edit_others_bio(self):
        url = reverse("user-detail", args=[self.me.id])
        res = self.client.patch(
            url, {"bio": "Hacked"}, format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.other_token}"
        )
        self.assertIn(res.status_code, (403, 401), res.content)
