# backend/api/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model

from .models import Post, PostImage, Reaction
from .serializers import (
    UserSerializer,
    PostSerializer,
    PostImageSerializer,
    ReactionSerializer,
)


from .permissions import CanManagePost, CanManageComment



User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """
    /api/users/           [GET public list, POST signup]
    /api/users/{id}/      [GET public retrieve, PATCH/DELETE require auth/permissions]
    /api/users/{id}/avatar/  [POST/PATCH multipart: 'avatar' - self or teacher]
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    # default lookup is by 'pk' (id). Keep it that way to match the frontend.

    def get_permissions(self):
        # Signup (create) is public; list/retrieve are public so profiles are visible;
        # all other actions require authentication (and server-side checks per action).
        if self.action in ["create", "list", "retrieve"]:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        me = request.user
        if not me.is_authenticated:
            return Response({"detail": "Authentication required."}, status=401)
        if (me.id != instance.id) and (getattr(me, "role", None) != "teacher"):
            return Response({"detail": "Not allowed."}, status=403)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        me = request.user
        if not me.is_authenticated:
            return Response({"detail": "Authentication required."}, status=401)
        if (me.id != instance.id) and (getattr(me, "role", None) != "teacher"):
            return Response({"detail": "Not allowed."}, status=403)
        return super().partial_update(request, *args, **kwargs)
    
    
    @action(detail=True, methods=["post", "patch"], parser_classes=[MultiPartParser, FormParser])
    def cover(self, request, pk=None):
        """
        Upload/replace cover image (multipart 'cover').
        Allowed: the user themself, or a teacher.
        """
        user_obj = self.get_object()
        me = request.user
        if not me.is_authenticated:
            return Response({"detail": "Authentication required."}, status=401)
        if (me.id != user_obj.id) and (getattr(me, "role", None) != "teacher"):
            return Response({"detail": "Not allowed."}, status=403)

        file = request.FILES.get("cover")
        if not file:
            return Response({"detail": "cover file required"}, status=400)

        user_obj.cover = file
        user_obj.save(update_fields=["cover"])
        return Response(UserSerializer(user_obj, context={"request": request}).data, status=200)

    @action(detail=True, methods=["post", "patch"], parser_classes=[MultiPartParser, FormParser])
    def avatar(self, request, pk=None):
        """
        Upload or replace user avatar (multipart field: 'avatar').
        - A user can update their own avatar.
        - Teachers can update any user's avatar.
        """
        user_obj = self.get_object()
        me = request.user

        if not me.is_authenticated:
            return Response({"detail": "Authentication required."}, status=401)

        if (me.id != user_obj.id) and (getattr(me, "role", None) != "teacher"):
            return Response({"detail": "Not allowed."}, status=403)

        file = request.FILES.get("avatar")
        if not file:
            return Response({"detail": "avatar file required"}, status=400)

        user_obj.avatar = file
        user_obj.save(update_fields=["avatar"])
        return Response(UserSerializer(user_obj, context={"request": request}).data, status=200)


class PostViewSet(viewsets.ModelViewSet):
    """
    /api/posts/                [GET list feed, POST create]
    /api/posts/{id}/           [GET, PATCH, DELETE with permissions]
    /api/posts/{id}/upload_image/  [POST multipart 'image' - author or teacher]
    /api/posts/{id}/react/     [POST {'type': 'like'|'love'|...}]
    /api/posts/{id}/unreact/   [POST remove reaction]
    Supports filter: /api/posts/?author=<user_id>
    """
    queryset = (
        Post.objects
        .select_related("author")
        .prefetch_related("images", "reactions")
        .all()
    )
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated, CanManagePost]

    def get_queryset(self):
        qs = super().get_queryset()
        author_id = self.request.query_params.get("author")
        if author_id:
            qs = qs.filter(author_id=author_id)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=["post"], parser_classes=[MultiPartParser, FormParser])
    def upload_image(self, request, pk=None):
        post = self.get_object()
        user = request.user
        if (post.author_id != user.id) and (getattr(user, "role", None) != "teacher"):
            return Response({"detail": "Not allowed."}, status=403)

        file = request.FILES.get("image")
        if not file:
            return Response({"detail": "image file required"}, status=400)

        img = PostImage.objects.create(post=post, image=file)
        return Response(PostImageSerializer(img, context={"request": request}).data, status=201)

    @action(detail=True, methods=["post"])
    def react(self, request, pk=None):
        post = self.get_object()
        rtype = request.data.get("type", "like")
        reaction, _ = Reaction.objects.update_or_create(
            user=request.user, post=post, defaults={"type": rtype}
        )
        return Response(ReactionSerializer(reaction, context={"request": request}).data, status=200)

    @action(detail=True, methods=["post"])
    def unreact(self, request, pk=None):
        post = self.get_object()
        Reaction.objects.filter(user=request.user, post=post).delete()
        return Response(status=204)



from .models import Post, PostImage, Reaction, Comment
from .serializers import (
    UserSerializer, PostSerializer, PostImageSerializer, ReactionSerializer,
    CommentSerializer
)


class CommentViewSet(viewsets.ModelViewSet):
    """
    /api/comments/?post=<post_id>  [GET list for a post]
    /api/comments/                 [POST create {post, content, parent?}]
    /api/comments/{id}/            [GET, PATCH, DELETE]
    """
    queryset = Comment.objects.select_related("author", "post", "parent").prefetch_related("replies__author").all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated, CanManageComment]

    def get_queryset(self):
        qs = super().get_queryset()
        post_id = self.request.query_params.get("post")
        if post_id:
            qs = qs.filter(post_id=post_id, parent__isnull=True)  # only roots; replies come nested
        return qs.order_by("created_at")

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def perform_create(self, serializer):
        # author injected in serializer.create()
        serializer.save()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """
    /api/me/  -> current user's profile
    """
    return Response(UserSerializer(request.user, context={"request": request}).data)
