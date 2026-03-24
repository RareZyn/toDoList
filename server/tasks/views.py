import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404

from .models import Task
from .serializers import (
    TaskSerializer,
    TaskCreateUpdateSerializer,
    StateChangeSerializer,
    AddDependencySerializer,
)
from . import service as services

# Create your views here.

def serialize_task(task):
  return TaskSerializer(task).data

# /api/tasks/ and /api/tasks/<pk>/
@csrf_exempt
@require_http_methods(['GET','POST'])
def task_list_create(request):
  if request.method == 'GET':
    queryset = Task.objects.prefetch_related('dependencies','dependents').all()

    state_filter = request.GET.get('state')
    if state_filter:
      queryset = queryset.filter(state = state_filter)

    data = [serialize_task(task) for task in queryset]
    return JsonResponse(data,safe=False)
  
  # Create (Post)
  try:
    body = json.loads(request.body)
  except json.JSONDecodeError:
    return JsonResponse({'error':'Invalid JSON body'}, status =400)
  
  serializer = TaskCreateUpdateSerializer(data=body)
  if not serializer.is_valid():
    return JsonResponse(serializer.errors, status=400)
  
  task = serializer.save()
  return JsonResponse(serialize_task(task),status=201)


#GET    /api/tasks/<pk>/ 
#PATCH  /api/tasks/<pk>/ 
#DELETE /api/tasks/<pk>/
@csrf_exempt
@require_http_methods(['GET','PATCH','DELETE'])
def task_detail(request, pk):
  task = get_object_or_404(
    Task.objects.prefetch_related('dependencies','dependents'),
    pk=pk
  )

  if request.method == 'GET':
    return JsonResponse(serialize_task(task))
  
  if request.method == 'PATCH':
    try:
      body = json.loads(request.body)
    except json.JSONDecodeError:
      return JsonResponse({'error':'Invalid JSON body'},status=400)
    
    serializer = TaskCreateUpdateSerializer(task, data=body, partial=True)
    if not serializer.is_valid():
      return JsonResponse(serializer.errors,status=400)
  
  if request.method == 'DELETE':
    task.delete()
    return JsonResponse({'message':'Task deleted'}, status=400)
  
#/api/tasks/<pk>/change_state/
@csrf_exempt
@require_http_methods(['POST'])
def task_change_state(request,pk):
  task = get_object_or_404(Task, pk=pk)

  try:
    body = json.loads(request.body)
  except json.JSONDecodeError:
    return JsonResponse({'error':'Invalid JSON body'}, status=400)
  
  serializer = StateChangeSerializer(data = body)
  if not serializer.is_valid():
    return JsonResponse(serializer.errors,status=400)
  
  updated_task, error = services.change_task_state(task,serializer.validated_data['state'])
  if error:
    return JsonResponse({'error': error}, status=400)

  return JsonResponse(serialize_task(updated_task))

#/api/tasks/<pk>/dependencies/
@csrf_exempt
@require_http_methods(['POST'])
def task_add_dependency(request,pk):
  task = get_object_or_404(Task, pk=pk)

  try:
    body = json.loads(request.body)
  except json.JSONDecodeError:
    return JsonResponse({'error','Invalid JSON body'}, status =400)
  
  serializer = AddDependencySerializer(data=body)
  if not serializer.is_valid():
    return JsonResponse(serializer.errors, status=400)
  
  dependency = get_object_or_404(Task, pk=serializer.validated_data['dependency_id'])

  success, error = services.add_dependency(task, dependency)
  if not success:
    return JsonResponse({'error': error}, status=400)

  task.refresh_from_db()
  return JsonResponse(serialize_task(task))

#/api/tasks/<pk>/dependencies/<dep_id>/
@csrf_exempt
@require_http_methods(['DELETE'])
def task_remove_dependency(request, pk, dep_id):
  task = get_object_or_404(Task, pk=pk)
  dependency = get_object_or_404

  success, error = services.remove_dependency(task, dependency)

  if not success:
    return JsonResponse({'error':error},status=400)
  
  task.refresh_from_db()
  return JsonResponse(serialize_task(task))
