# backend/api/urls.py
from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import UserViewSet, PostViewSet, CommentViewSet, me

router = DefaultRouter()
# Basenames chosen so route names match your tests:
# user-list/user-detail, post-list/post-detail, comment-list/comment-detail
router.register(r'users', UserViewSet, basename='user')
router.register(r'posts', PostViewSet, basename='post')
router.register(r'comments', CommentViewSet, basename='comment')

urlpatterns = [
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", me, name="me"),
]

# Important: only append router.urls once. Do NOT also include("", include(router.urls))
urlpatterns += router.urls


