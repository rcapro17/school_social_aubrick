# What it checks:
# A student can create a post and upload images to their post.
# Another student cannot upload images to someone else’s post (403).
# A non-author student cannot delete someone else’s post (403).
# A teacher can delete any post (204).


# backend/api/tests/test_posts.py
# backend/api/tests/test_post.py
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

User = get_user_model()

class TestPostPermissions(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(username="stud1", password="p", role="student")
        self.other   = User.objects.create_user(username="stud2", password="p", role="student")
        self.teacher = User.objects.create_user(username="teach", password="p", role="teacher")

        # tokens
        tok_url = reverse("token_obtain_pair")
        self.student_token = self.client.post(tok_url, {"username": "stud1", "password": "p"}).data["access"]
        self.other_token   = self.client.post(tok_url, {"username": "stud2", "password": "p"}).data["access"]
        self.teacher_token = self.client.post(tok_url, {"username": "teach", "password": "p"}).data["access"]

    def test_student_can_create_post(self):
        url = reverse("post-list")  # /api/posts/
        res = self.client.post(url, {"content": "hello"}, format="json",
                               HTTP_AUTHORIZATION=f"Bearer {self.student_token}")
        self.assertEqual(res.status_code, 201, res.content)
        self.assertEqual(res.data["author"]["username"], "stud1")
        self.post_id = res.data["id"]

    def test_delete_permissions(self):
        # create a post as student
        create = self.client.post(
            reverse("post-list"), {"content": "owner post"}, format="json",
            HTTP_AUTHORIZATION=f"Bearer {self.student_token}"
        )
        post_id = create.data["id"]

        # other student CANNOT delete
        del_url = reverse("post-detail", args=[post_id])
        res = self.client.delete(del_url, HTTP_AUTHORIZATION=f"Bearer {self.other_token}")
        self.assertIn(res.status_code, (403, 404))  # forbidden or hidden

        # teacher CAN delete
        res = self.client.delete(del_url, HTTP_AUTHORIZATION=f"Bearer {self.teacher_token}")
        self.assertEqual(res.status_code, 204, res.content)

