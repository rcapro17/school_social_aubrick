from rest_framework.permissions import BasePermission, SAFE_METHODS

class CanManagePost(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        if getattr(user, "role", None) == "teacher":
            return True
        return obj.author_id == user.id
