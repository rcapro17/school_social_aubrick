from rest_framework.permissions import BasePermission, SAFE_METHODS

class CanManagePost(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        if getattr(user, "role", None) == "teacher":
            return True
        return obj.author_id == user.id



class CanManageComment(BasePermission):
    """
    Teachers can edit/delete any comment.
    Students/Parents can edit/delete their own comments.
    """
    def has_object_permission(self, request, view, obj):
        if getattr(request.user, "role", None) == "teacher":
            return True
        return obj.author_id == request.user.id

