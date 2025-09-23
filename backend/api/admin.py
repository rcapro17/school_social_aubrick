from django.contrib import admin
from .models import User, Post, PostImage, Reaction

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")
    search_fields = ("username", "email")

class PostImageInline(admin.TabularInline):
    model = PostImage
    extra = 0

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("id", "author", "created_at", "updated_at")
    list_filter = ("created_at",)
    search_fields = ("author__username", "content")
    inlines = [PostImageInline]

@admin.register(Reaction)
class ReactionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "post", "type")
    list_filter = ("type",)
    search_fields = ("user__username",)

