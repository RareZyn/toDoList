from rest_framework import serializers
from .models import Task, TaskDependency


class DependencyInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'title', 'state']


class TaskSerializer(serializers.ModelSerializer):
    dependencies = DependencyInfoSerializer(many=True, read_only=True)
    dependents = DependencyInfoSerializer(many=True, read_only=True)
    blocked_by = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'description',
            'due_date',
            'state',
            'dependencies',
            'dependents',
            'blocked_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'state', 'created_at', 'updated_at']

    def get_blocked_by(self, obj):
        if obj.state != Task.State.BLOCKED:
            return []
        blocking = obj.dependencies.exclude(state=Task.State.DONE)
        return DependencyInfoSerializer(blocking, many=True).data


class StateChangeSerializer(serializers.Serializer):
    state = serializers.ChoiceField(choices=Task.State.choices)


class AddDependencySerializer(serializers.Serializer):
    dependency_id = serializers.IntegerField()

    def validate_dependency_id(self, value):
        try:
            Task.objects.get(id=value)
        except Task.DoesNotExist:
            raise serializers.ValidationError(f"Task with id {value} does not exist.")
        return value


class TaskCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['title', 'description', 'due_date']

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Title cannot be blank")
        return value.strip()
