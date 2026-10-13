// ═══════════════════════════════════════════════════════════════
// History Manager — Command-pattern undo/redo system
// Each operation stores only the delta (not full state snapshot)
// Supports Ctrl+Z / Ctrl+Y
// ═══════════════════════════════════════════════════════════════

// ─── Command Base ──────────────────────────────────────────────
class Command {
  constructor(type, data) {
    this.type = type;
    this.data = data;
    this.timestamp = Date.now();
  }
  execute() { throw new Error('Command.execute() must be overridden'); }
  undo() { throw new Error('Command.undo() must be overridden'); }
  getDescription() { return this.type; }
}

// ─── Add Element Command ───────────────────────────────────────
export class AddElementCommand extends Command {
  constructor(elementType, element, dispatch, actions) {
    super('add_element', { elementType, element });
    this.dispatch = dispatch;
    this.actions = actions;
  }
  execute() {
    this.dispatch(this.actions.addElementLocal({
      element_type: this.data.elementType,
      element: this.data.element,
    }));
  }
  undo() {
    const id = this.data.element._id || this.data.element.canvas_id || this.data.element.id;
    this.dispatch(this.actions.removeElementLocal({
      element_type: this.data.elementType,
      element_id: id,
    }));
  }
  getDescription() {
    return `Add ${this.data.elementType}`;
  }
}

// ─── Remove Element Command ────────────────────────────────────
export class RemoveElementCommand extends Command {
  constructor(elementType, element, dispatch, actions) {
    super('remove_element', { elementType, element });
    this.dispatch = dispatch;
    this.actions = actions;
  }
  execute() {
    const id = this.data.element._id || this.data.element.canvas_id || this.data.element.id;
    this.dispatch(this.actions.removeElementLocal({
      element_type: this.data.elementType,
      element_id: id,
    }));
  }
  undo() {
    this.dispatch(this.actions.addElementLocal({
      element_type: this.data.elementType,
      element: this.data.element,
    }));
  }
  getDescription() {
    return `Delete ${this.data.elementType}`;
  }
}

// ─── Update Element Command ────────────────────────────────────
export class UpdateElementCommand extends Command {
  constructor(elementType, elementId, oldValues, newValues, dispatch, actions) {
    super('update_element', { elementType, elementId, oldValues, newValues });
    this.dispatch = dispatch;
    this.actions = actions;
  }
  execute() {
    this.dispatch(this.actions.updateElementLocal({
      element_type: this.data.elementType,
      element_id: this.data.elementId,
      updates: this.data.newValues,
    }));
  }
  undo() {
    this.dispatch(this.actions.updateElementLocal({
      element_type: this.data.elementType,
      element_id: this.data.elementId,
      updates: this.data.oldValues,
    }));
  }
  getDescription() {
    const changes = Object.keys(this.data.newValues).join(', ');
    return `Modify ${this.data.elementType} (${changes})`;
  }
}

// ─── Move Element Command ──────────────────────────────────────
export class MoveElementCommand extends Command {
  constructor(elementType, elementId, oldPosition, newPosition, dispatch, actions) {
    super('move_element', { elementType, elementId, oldPosition, newPosition });
    this.dispatch = dispatch;
    this.actions = actions;
  }
  execute() {
    this.dispatch(this.actions.updateElementLocal({
      element_type: this.data.elementType,
      element_id: this.data.elementId,
      updates: { position: this.data.newPosition },
    }));
  }
  undo() {
    this.dispatch(this.actions.updateElementLocal({
      element_type: this.data.elementType,
      element_id: this.data.elementId,
      updates: { position: this.data.oldPosition },
    }));
  }
  getDescription() {
    return `Move ${this.data.elementType}`;
  }
}

// ─── Batch Command ─────────────────────────────────────────────
export class BatchCommand extends Command {
  constructor(description, commands) {
    super('batch', { description, commands });
  }
  execute() {
    this.data.commands.forEach(cmd => cmd.execute());
  }
  undo() {
    // Undo in reverse order
    [...this.data.commands].reverse().forEach(cmd => cmd.undo());
  }
  getDescription() {
    return this.data.description;
  }
}

// ═══════════════════════════════════════════════════════════════
// HISTORY MANAGER
// ═══════════════════════════════════════════════════════════════
export class HistoryManager {
  constructor(maxSize = 100) {
    this.undoStack = [];
    this.redoStack = [];
    this.maxSize = maxSize;
    this.listeners = new Set();
    this.isExecuting = false;
  }

  // Execute a command and push to undo stack
  execute(command) {
    if (this.isExecuting) return;
    this.isExecuting = true;
    try {
      command.execute();
      this.undoStack.push(command);
      if (this.undoStack.length > this.maxSize) {
        this.undoStack.shift();
      }
      this.redoStack = []; // Clear redo on new action
      this._notify();
    } finally {
      this.isExecuting = false;
    }
  }

  // Undo the last command
  undo() {
    if (this.undoStack.length === 0 || this.isExecuting) return false;
    this.isExecuting = true;
    try {
      const command = this.undoStack.pop();
      command.undo();
      this.redoStack.push(command);
      this._notify();
      return true;
    } finally {
      this.isExecuting = false;
    }
  }

  // Redo the last undone command
  redo() {
    if (this.redoStack.length === 0 || this.isExecuting) return false;
    this.isExecuting = true;
    try {
      const command = this.redoStack.pop();
      command.execute();
      this.undoStack.push(command);
      this._notify();
      return true;
    } finally {
      this.isExecuting = false;
    }
  }

  get canUndo() { return this.undoStack.length > 0; }
  get canRedo() { return this.redoStack.length > 0; }

  get undoDescription() {
    if (this.undoStack.length === 0) return null;
    return this.undoStack[this.undoStack.length - 1].getDescription();
  }

  get redoDescription() {
    if (this.redoStack.length === 0) return null;
    return this.redoStack[this.redoStack.length - 1].getDescription();
  }

  getHistory(limit = 20) {
    return this.undoStack.slice(-limit).reverse().map((cmd, i) => ({
      index: this.undoStack.length - 1 - i,
      description: cmd.getDescription(),
      timestamp: cmd.timestamp,
      type: cmd.type,
    }));
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this._notify();
  }

  // Subscribe to changes
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  _notify() {
    this.listeners.forEach(fn => {
      try { fn(this); } catch (e) { console.error('HistoryManager listener error:', e); }
    });
  }
}

// Singleton instance
let _historyManager = null;
export function getHistoryManager() {
  if (!_historyManager) {
    _historyManager = new HistoryManager();
  }
  return _historyManager;
}

export function resetHistoryManager() {
  if (_historyManager) _historyManager.clear();
  _historyManager = new HistoryManager();
  return _historyManager;
}

export default HistoryManager;
