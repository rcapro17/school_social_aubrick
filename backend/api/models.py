# Create your models here.
from django.db import models
from django.contrib.auth.models import AbstractUser



class User(AbstractUser):
    class Roles(models.TextChoices):
        STUDENT = 'student', 'Student'
        TEACHER = 'teacher', 'Teacher'
        PARENT  = 'parent',  'Parent'

    role = models.CharField(max_length=10, choices=Roles.choices, default=Roles.STUDENT)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    # NEW
    bio = models.TextField(blank=True, default="")
    cover = models.ImageField(upload_to='covers/', blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField(max_length=2000, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Post #{self.pk} by {self.author.username}"


class PostImage(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='posts/')

    def __str__(self):
        return f"PostImage #{self.pk} for Post #{self.post_id}"
    

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    parent = models.ForeignKey("self", null=True, blank=True, on_delete=models.CASCADE, related_name="replies")
    content = models.TextField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]  # oldest first inside threads

    def __str__(self):
        return f"Comment #{self.pk} by {self.author.username} on Post #{self.post_id}"


# app/models.py
class Reaction(models.Model):
    class Types(models.TextChoices):
        EINSTEIN    = 'einstein',   'Einstein'
        SHAKESPEARE = 'shakespeare','Shakespeare'
        DAVINCI     = 'davinci',    'Leonardo da Vinci'
        MANDELA     = 'mandela',    'Nelson Mandela'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reactions')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='reactions')
    type = models.CharField(max_length=20, choices=Types.choices, default=Types.EINSTEIN)

    class Meta:
        unique_together = ('user', 'post')
        indexes = [
            models.Index(fields=['post', 'type']),
            models.Index(fields=['user', 'post']),
        ]

    def __str__(self):
        return f"{self.user.username} {self.type} Post #{self.post_id}"




