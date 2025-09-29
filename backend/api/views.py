from django.shortcuts import render

# Create your views 
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model

from .models import Post, PostImage, Reaction
from .serializers import UserSerializer, PostSerializer, PostImageSerializer, ReactionSerializer
from .permissions import CanManagePost

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        # Allow signup without auth; everything else requires auth.
        return [AllowAny()] if self.action == "create" else [IsAuthenticated()]

    @action(detail=True, methods=["post", "patch"], parser_classes=[MultiPartParser, FormParser])
    def avatar(self, request, pk=None):
        """Upload or replace user avatar (multipart: 'avatar').
        - A user can update their own avatar.
        - Teachers can update any user's avatar.
        """
        user_obj = self.get_object()
        me = request.user
        if me.id != user_obj.id and getattr(me, "role", None) != "teacher":
            return Response({"detail": "Not allowed"}, status=403)

        file = request.FILES.get("avatar")
        if not file:
            return Response({"detail": "avatar file required"}, status=400)

        user_obj.avatar = file
        user_obj.save(update_fields=["avatar"])
        return Response(UserSerializer(user_obj).data, status=200)

        
class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.select_related("author").prefetch_related("images", "reactions").all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated, CanManagePost]

    def get_queryset(self):
        qs = super().get_queryset()
        author_id = self.request.query_params.get("author")
        if author_id:
            qs = qs.filter(author_id=author_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
    ...


    @action(detail=True, methods=["post"])
    def upload_image(self, request, pk=None):
        post = self.get_object()
        if post.author_id != request.user.id and getattr(request.user, "role", None) != "teacher":
            return Response({"detail": "Not allowed"}, status=403)
        file = request.FILES.get("image")
        if not file:
            return Response({"detail": "image file required"}, status=400)
        img = PostImage.objects.create(post=post, image=file)
        return Response(PostImageSerializer(img).data, status=201)

    @action(detail=True, methods=["post"])
    def react(self, request, pk=None):
        post = self.get_object()
        rtype = request.data.get("type", "like")
        reaction, _ = Reaction.objects.update_or_create(
            user=request.user, post=post, defaults={"type": rtype}
        )
        return Response(ReactionSerializer(reaction).data)

    @action(detail=True, methods=["post"])
    def unreact(self, request, pk=None):
        post = self.get_object()
        Reaction.objects.filter(user=request.user, post=post).delete()
        return Response(status=204)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)
