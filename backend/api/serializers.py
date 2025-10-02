# backend/api/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.conf import settings
from .models import Post, PostImage, Reaction, Comment
from django.db.models import Count


User = get_user_model()


# ---------- User ----------
class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    cover = serializers.SerializerMethodField()

    # keep password here but write_only so it never leaks
    password = serializers.CharField(write_only=True, required=False, allow_blank=False)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "role",
            "avatar",
            "bio",
            "cover",
            "password",            # <- IMPORTANT: include it here
        ]
        extra_kwargs = {
            "email": {"required": False},
            "first_name": {"required": False},
            "last_name": {"required": False},
            "role": {"required": False},
        }

    def get_avatar(self, obj):
        request = self.context.get("request")
        if obj.avatar:
            url = obj.avatar.url
            return request.build_absolute_uri(url) if request else url
        return None

    def get_cover(self, obj):
        request = self.context.get("request")
        if obj.cover:
            url = obj.cover.url
            return request.build_absolute_uri(url) if request else url
        return None

    def create(self, validated_data):
        # pop password and hash it
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            # in case someone creates without password, set unusable (optional)
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        # allow password change via serializer (optional)
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


# ---------- Post images ----------
class PostImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = PostImage
        fields = ["id", "image"]

    def get_image(self, obj):
        request = self.context.get("request")
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url


# ---------- Reactions ----------
class ReactionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Reaction
        fields = ["id", "user", "post", "type"]


# ---------- Comments ----------
class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ["id", "post", "author", "content", "parent", "created_at", "replies"]
        read_only_fields = ["author", "created_at"]

    def get_replies(self, obj):
        # simple 1-level nesting
        children = obj.replies.all().select_related("author")
        return CommentSerializer(children, many=True, context=self.context).data


# ---------- Posts ----------
class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    images = PostImageSerializer(many=True, read_only=True)
    reactions = ReactionSerializer(many=True, read_only=True)

    # useful, FB-like summary fields
    reactions_count = serializers.SerializerMethodField()
    my_reaction = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id",
            "author",
            "content",
            "created_at",
            "updated_at",
            "images",
            "reactions",
            "reactions_count",
            "my_reaction",
            "comments_count",
        ]

    def get_reactions_count(self, obj):
        return obj.reactions.count()

    def get_my_reaction(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        r = obj.reactions.filter(user=request.user).first()
        return r.type if r else None

    def get_comments_count(self, obj):
        # count only top-level comments (or total, your choice)
        return obj.comments.count()


class PostImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = PostImage
        fields = ["id", "image"]

    def get_image(self, obj):
        request = self.context.get("request")
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url



class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "role", "avatar")


class CommentSerializer(serializers.ModelSerializer):
    author = UserMiniSerializer(read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ("id", "post", "author", "parent", "content", "created_at", "replies")
        read_only_fields = ("author", "created_at", "replies")

    def get_replies(self, obj):
        # One level of nested replies; you can expand if you want deeper trees
        qs = obj.replies.select_related("author").all().order_by("created_at")
        return CommentSerializer(qs, many=True, context=self.context).data

    def create(self, validated_data):
        # author from request.user
        request = self.context.get("request")
        validated_data["author"] = request.user
        return super().create(validated_data)


class ReactionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Reaction
        fields = ["id", "user", "post", "type"]

REACTION_KEYS = [k for k, _ in Reaction.Types.choices]  # ['einstein','shakespeare','davinci','mandela']

class PostSerializer(serializers.ModelSerializer):
    author = UserMiniSerializer(read_only=True)
    images = PostImageSerializer(many=True, read_only=True)
    reactions = ReactionSerializer(many=True, read_only=True)

    reaction_counts = serializers.SerializerMethodField()
    my_reaction = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = (
            "id", "author", "content", "created_at", "updated_at",
            "images", "reactions",
            "reaction_counts", "my_reaction",
        )

    def get_reaction_counts(self, obj):
        # Start with zeros so frontend keys are always present
        counts = {k: 0 for k in REACTION_KEYS}

        # Use the prefetched reactions (no extra queries)
        for r in getattr(obj, "reactions").all():
            if r.type in counts:
                counts[r.type] += 1

        counts["total"] = sum(counts.values())
        return counts

    def get_my_reaction(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return None
        mine = obj.reactions.filter(user_id=user.id).first()
        return mine.type if mine else None