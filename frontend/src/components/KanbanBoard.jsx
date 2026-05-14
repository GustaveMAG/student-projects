import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Link } from 'react-router-dom';
import { format, isPast, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLUMNS = [
  {
    id:     'todo',
    label:  'À faire',
    dot:    'bg-primary-muted',
    badge:  'badge-todo',
  },
  {
    id:     'in_progress',
    label:  'En cours',
    dot:    'bg-accent',
    badge:  'badge-progress',
  },
  {
    id:     'done',
    label:  'Terminé',
    dot:    'bg-success',
    badge:  'badge-done',
  },
];

export default function KanbanBoard({ tasks, projectId, onStatusChange, onDelete, userId, isEncadrant }) {
  const columns = COLUMNS.map((col) => ({
    ...col,
    tasks: tasks.filter((t) => t.statut === col.id),
  }));

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    onStatusChange(parseInt(draggableId, 10), destination.droppableId);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
        {columns.map((col) => (
          <div key={col.id} className="flex flex-col rounded-lg overflow-hidden border border-border">

            {/* Column header */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-surface border-b border-border">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                <span className="text-xs font-medium text-primary">{col.label}</span>
              </div>
              <span className="text-[10px] font-semibold text-primary-muted bg-surface-2 border border-border rounded-full px-1.5 py-0.5">
                {col.tasks.length}
              </span>
            </div>

            {/* Droppable area */}
            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex flex-col gap-2 p-2 min-h-[200px] transition-colors ${
                    snapshot.isDraggingOver ? 'bg-accent/5' : 'bg-base'
                  }`}
                >
                  {col.tasks.map((task, index) => (
                    <KanbanCard
                      key={task.id}
                      task={task}
                      index={index}
                      projectId={projectId}
                      userId={userId}
                      isEncadrant={isEncadrant}
                      onDelete={onDelete}
                    />
                  ))}
                  {provided.placeholder}

                  {col.tasks.length === 0 && !snapshot.isDraggingOver && (
                    <div className="flex-1 flex items-center justify-center py-8 text-[11px] text-primary-muted/40 border border-dashed border-border rounded-lg m-1">
                      Déposer ici
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}

/* ── Draggable card ── */
function KanbanCard({ task, index, projectId, userId, isEncadrant, onDelete }) {
  const isLate  = task.deadline && isPast(parseISO(task.deadline)) && task.statut !== 'done';
  const canEdit = isEncadrant || task.assigne_a === userId;

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-surface rounded-lg border p-3 select-none transition-all ${
            snapshot.isDragging
              ? 'shadow-xl border-accent/50 rotate-1 ring-1 ring-accent/30'
              : isLate
              ? 'border-danger/30'
              : 'border-border hover:border-border-2'
          }`}
        >
          {/* Late warning */}
          {isLate && (
            <div className="flex items-center gap-1 text-[11px] text-danger font-medium mb-1.5">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              En retard
            </div>
          )}

          {/* Title */}
          <Link
            to={`/projects/${projectId}/tasks/${task.id}`}
            className="block text-xs font-medium text-primary hover:text-accent transition-colors leading-snug mb-2"
            onClick={(e) => snapshot.isDragging && e.preventDefault()}
          >
            {task.titre}
          </Link>

          {/* Description */}
          {task.description && (
            <p className="text-[11px] text-primary-muted line-clamp-2 mb-2">{task.description}</p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border">
            <div className="flex items-center gap-2 min-w-0">
              {task.assignee_nom ? (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-semibold flex-shrink-0"
                  style={{ background: `hsl(${task.assignee_nom.charCodeAt(0) * 5 % 360}deg 50% 45%)` }}
                >
                  {task.assignee_nom.charAt(0).toUpperCase()}
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-surface-2 border border-border flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-primary-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}

              {task.deadline && (
                <span className={`text-[11px] truncate ${isLate ? 'text-danger font-medium' : 'text-primary-muted'}`}>
                  {format(parseISO(task.deadline), 'dd MMM', { locale: fr })}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-primary-muted flex-shrink-0">
              {canEdit && (
                <button
                  onClick={(e) => { e.preventDefault(); onDelete(task.id, task.titre); }}
                  className="hover:text-danger transition-colors"
                  title="Supprimer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              {/* Drag handle dots */}
              <svg className="w-3 h-3 opacity-30" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 6a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4zm8-16a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4z"/>
              </svg>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
