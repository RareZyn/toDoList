from django.urls import path, include
from . import views

urlpatterns = [
  # Task create ,update, delete
  path('tasks/',views.task_list_create,name='task-list-create'),
  
  path('tasks/<int:pk>/', views.task_detail, name='task-detail'),

  # Change state
  path('tasks/<int:pk>/change_state',views.task_change_state,name='task-change-state'),

  #Dependency
  path('tasks/<int:pk>/dependencies/', views.task_add_dependency, name='task-add-dependency'),

  path('tasks/<int:pk>/dependencies/<int:dep_id>/', views.task_remove_dependency, name='task-remove-dependency'),

]