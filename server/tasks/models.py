from django.db import models

class Task(models.Model):
  class State(models.TextChoices):
    TODO = 'todo'
    IN_PROGRESS = 'in_progress'
    DONE = 'done'
    BLOCKED = 'blocked'

  title = models.CharField(max_length=100)
  description = models.TextField(blank=True, default='')
  due_date = models.DateField(null=True, blank=True)
  state = models.CharField(max_length=20, choices=State.choices, default=State.TODO)
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  dependencies = models.ManyToManyField(
    'self', through='Dependency', symmetrical=False, related_name='dependents')

  class Meta:
    ordering = ['-created_at']

  def __str__(self):
    return f"{self.title} ({self.state})"

class TaskDependency(models.Model):
  task = models.ForeignKey(
    Task,
    on_delete=models.CASCADE,
    related_name = "task_dependencies",
  )

  dependency = models.ForeignKey(
    Task,
    on_delete = models.CASCADE,
    related_name = "dependency_of",
  )
  created_at = models.DateTimeField(auto_now_add=True)

  class Meta:
    unique_together = ('task','dependency')
    ordering = ['created_at']

  def __str__(self):
    return f"{self.task.title} depend on {self.dependency.title}"