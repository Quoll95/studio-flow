import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import PostItNote from "./PostItNote";

interface NoteItem {
  id: string;
  testo: string;
  colore: string;
  timestamp?: string;
}

interface DraggablePostItGridProps {
  notes: NoteItem[];
  onReorder: (reordered: NoteItem[]) => void;
  onUpdate: (id: string, newText: string) => void;
  onDelete: (id: string) => void;
  droppableId: string;
}

export default function DraggablePostItGrid({ notes, onReorder, onUpdate, onDelete, droppableId }: DraggablePostItGridProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(notes);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    onReorder(items);
  };

  if (notes.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-2">Nessuna nota.</p>;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={droppableId}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 print:grid-cols-3"
            style={{ minHeight: notes.length > 0 ? `${Math.ceil(notes.length / 3) * 80}px` : undefined }}
          >
            {notes.map((n, idx) => (
              <Draggable key={n.id} draggableId={n.id} index={idx}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={snapshot.isDragging ? "opacity-80 shadow-lg z-50" : ""}
                    style={{
                      ...provided.draggableProps.style,
                      ...(snapshot.isDragging ? {} : { transform: "none" }),
                    }}
                  >
                    <PostItNote
                      id={n.id}
                      testo={n.testo}
                      colore={n.colore}
                      timestamp={n.timestamp}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
