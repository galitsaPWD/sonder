// --- Notes: draggable, colorful, deletable, persistent, animated ---
const NOTE_COLORS = [
  '#FDFFB6', '#CAFFBF', '#9BF6FF', '#A0C4FF', '#BDB2FF', '#FFC6FF'
];

const NOTE_FONTS = [
  { name: 'Default', value: 'Inter, sans-serif' },
  { name: 'Handwriting', value: 'Kalam, cursive' },
  { name: 'Typewriter', value: 'Courier Prime, monospace' },
  { name: 'Elegant', value: 'Playfair Display, serif' },
  { name: 'Modern', value: 'Poppins, sans-serif' },
  { name: 'Fun', value: 'Comic Neue, cursive' },
  { name: 'Clean', value: 'Roboto, sans-serif' },
  { name: 'Retro', value: 'Press Start 2P, cursive' }
];

let notesData = JSON.parse(localStorage.getItem('notesData') || '[]');
const noteBoard = document.getElementById('note-board');
const addNoteBtn = document.getElementById('add-note-btn');
const newNoteText = document.getElementById('new-note-text');
let saveTimeout; // Declare saveTimeout at the top level

function saveNotesData() {
  localStorage.setItem('notesData', JSON.stringify(notesData));
}

// Auto-save notes periodically
setInterval(() => {
  saveNotesData();
}, 30000); // Save every 30 seconds

// Save notes when window is about to close
window.addEventListener('beforeunload', () => {
  saveNotesData();
});

// Save notes when page becomes hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    saveNotesData();
  }
});

function renderNotes() {
  noteBoard.innerHTML = '';
  notesData.forEach((data, index) => {
    const note = document.createElement('div');
    note.className = 'note';
    note.style.backgroundColor = data.color;
    note.style.position = 'absolute';
    note.style.left = data.x;
    note.style.top = data.y;
    note.style.setProperty('--rotation', `${Math.random() * 4 - 2}deg`);
    note.dataset.index = index;
    
    // Create a separate text container for editing
    const textContainer = document.createElement('div');
    textContainer.className = 'note-text';
    textContainer.contentEditable = 'true';  // Make it always editable
    textContainer.textContent = data.text;
    
    // Apply font if it exists
    if (data.font) {
      textContainer.style.fontFamily = data.font;
    }
    
    // Header with editable title and controls
    const header = document.createElement('div');
    header.className = 'note-header';

    // Editable title
    const titleContainer = document.createElement('div');
    titleContainer.className = 'note-title';
    titleContainer.contentEditable = 'true';
    titleContainer.textContent = data.title || '';
    titleContainer.spellcheck = false;
    titleContainer.addEventListener('input', () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        const newTitle = titleContainer.textContent.trim();
        if (notesData[index].title !== newTitle) {
          notesData[index].title = newTitle;
          saveNotesData();
        }
      }, 500);
    });

    // Controls
    const controls = document.createElement('div');
    controls.className = 'note-controls';
    
    // Font button
    const fontBtn = document.createElement('button');
    fontBtn.className = 'note-font';
    fontBtn.innerHTML = 'Aa';
    fontBtn.title = 'Change font';
    fontBtn.onclick = (e) => {
      e.stopPropagation();
      toggleFontPalette(note, index);
    };
    
    // Color button
    const colorBtn = document.createElement('button');
    colorBtn.className = 'note-color';
    colorBtn.innerHTML = '🎨';
    colorBtn.title = 'Change color';
    colorBtn.onclick = (e) => {
      e.stopPropagation();
      toggleColorPalette(note, index);
    };
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '✖';
    deleteBtn.className = 'note-delete';
    deleteBtn.title = 'Delete note';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      const existingPalette = document.querySelector('.color-palette');
      if (existingPalette) existingPalette.remove();
      const existingFontPalette = document.querySelector('.font-palette');
      if (existingFontPalette) existingFontPalette.remove();
      notesData.splice(index, 1);
      saveNotesData();
      renderNotes();
    };
    
    controls.appendChild(fontBtn);
    controls.appendChild(colorBtn);
    controls.appendChild(deleteBtn);

    header.appendChild(titleContainer);
    header.appendChild(controls);
    note.appendChild(header);
    note.appendChild(textContainer);
    noteBoard.appendChild(note);
    makeDraggable(note, index, textContainer);

    // Update textContainer event to save to notesData[index].text
    textContainer.addEventListener('input', () => {
      if (note.classList.contains('dragging')) return;
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        const newText = textContainer.textContent.trim();
        if (notesData[index].text !== newText) {
          notesData[index].text = newText;
          saveNotesData();
        }
      }, 500);
    });
  });
}

function toggleColorPalette(note, index) {
  const existingPalette = note.querySelector('.color-palette');
  if (existingPalette) {
    existingPalette.remove();
    return;
  }
  
  const anyOtherPalette = document.querySelector('.color-palette');
  if (anyOtherPalette) {
    anyOtherPalette.remove();
  }

  const palette = document.createElement('div');
  palette.className = 'color-palette';

  NOTE_COLORS.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = color;
    swatch.onclick = (e) => {
      e.stopPropagation();
      notesData[index].color = color;
      note.style.backgroundColor = color;
      saveNotesData();
      palette.remove();
    };
    palette.appendChild(swatch);
  });

  note.appendChild(palette);
  
  // Use a timeout to allow the browser to render the palette before we add the class
  setTimeout(() => palette.classList.add('visible'), 10);

  // Close when clicking outside.
  const closeListener = (event) => {
    if (!palette.contains(event.target) && !note.querySelector('.note-color').contains(event.target)) {
        palette.remove();
        document.removeEventListener('click', closeListener);
    }
  };
  
  // Use timeout to avoid the same click event that opened it from closing it.
  setTimeout(() => document.addEventListener('click', closeListener, { capture: true }), 0);
}

function toggleFontPalette(note, index) {
  const existingPalette = note.querySelector('.font-palette');
  if (existingPalette) {
    existingPalette.remove();
    return;
  }
  
  const anyOtherPalette = document.querySelector('.font-palette');
  if (anyOtherPalette) {
    anyOtherPalette.remove();
  }

  const palette = document.createElement('div');
  palette.className = 'font-palette';
  
  // Position the palette to the right of the note
  const noteRect = note.getBoundingClientRect();
  const noteHeight = noteRect.height;
  
  // Set the palette height to match the note height
  palette.style.height = `${noteHeight}px`;
  palette.style.maxHeight = `${noteHeight}px`;
  palette.style.overflowY = 'auto';

  NOTE_FONTS.forEach(font => {
    const fontOption = document.createElement('div');
    fontOption.className = 'font-option';
    fontOption.textContent = font.name;
    fontOption.style.fontFamily = font.value;
    fontOption.onclick = (e) => {
      e.stopPropagation();
      notesData[index].font = font.value;
      const textContainer = note.querySelector('.note-text');
      if (textContainer) {
        textContainer.style.fontFamily = font.value;
      }
      saveNotesData();
      palette.remove();
    };
    palette.appendChild(fontOption);
  });

  note.appendChild(palette);
  
  // Use a timeout to allow the browser to render the palette before we add the class
  setTimeout(() => palette.classList.add('visible'), 10);

  // Close when clicking outside.
  const closeListener = (event) => {
    if (!palette.contains(event.target) && !note.querySelector('.note-font').contains(event.target)) {
        palette.remove();
        document.removeEventListener('click', closeListener);
    }
  };
  
  // Use timeout to avoid the same click event that opened it from closing it.
  setTimeout(() => document.addEventListener('click', closeListener, { capture: true }), 0);
}

function addNote(text) {
  const boardRect = noteBoard.getBoundingClientRect();
  const noteX = `${Math.random() * (boardRect.width - 220)}px`;
  const noteY = `${Math.random() * (boardRect.height - 220)}px`;
  const newNote = {
    text: text,
    title: 'Title', // Initialize with default title
    color: NOTE_COLORS[0],
    x: noteX,
    y: noteY
  };
  notesData.push(newNote);
  saveNotesData();
  renderNotes();
  
  // Track note creation for stats
  if (typeof trackNoteCreation === 'function') {
    trackNoteCreation();
  }
}

addNoteBtn.addEventListener('click', () => {
  const text = newNoteText.value.trim();
  if (text) {
    addNote(text);
    newNoteText.value = '';
  }
});

function makeDraggable(note, index, textContainer) {
  let clone = null;
  let offsetX, offsetY;
  let isDragging = false;
  let startX, startY;
  let hasMoved = false;
  let dragTimeout = null;
  let mouseDownTime = 0;
  let isControlClick = false;

  const onMouseMove = (e) => {
    // Do not start a drag if the mouse down event was on a control button
    if (isControlClick) {
      return;
    }

    if (!isDragging) {
      // Check if mouse has moved enough to start dragging
      const moveX = Math.abs(e.clientX - startX);
      const moveY = Math.abs(e.clientY - startY);
      
      if (moveX > 3 || moveY > 3) {  // Small threshold for drag start
        hasMoved = true;
        if (dragTimeout) {
          clearTimeout(dragTimeout);
          dragTimeout = null;
        }
        startDrag(e);
      }
      return;
    }

    if (!clone) return;
    
    // Use clientX/Y for viewport-relative positioning
    clone.style.left = `${e.clientX - offsetX}px`;
    clone.style.top = `${e.clientY - offsetY}px`;
  };

  const onMouseUp = (e) => {
    const mouseUpTime = Date.now();
    const isQuickClick = mouseUpTime - mouseDownTime < 200; // Consider it a click if less than 200ms

    if (dragTimeout) {
      clearTimeout(dragTimeout);
      dragTimeout = null;
    }

    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp, true);

    if (!isDragging) {
      // If it was a quick click and we haven't moved, handle it
      if (isQuickClick && !hasMoved) {
        const target = e.target;

        // Handle control clicks
        if (target.closest('.note-delete')) {
          const existingPalette = document.querySelector('.color-palette');
          if (existingPalette) existingPalette.remove();
          const deletedNote = notesData[index];
          notesData.splice(index, 1);
          saveNotesData();
          renderNotes();
          return;
        }

        if (target.closest('.note-color')) {
          toggleColorPalette(note, index);
          return;
        }

        // If not a control click, focus the text container
        textContainer.focus();
        
        // Place cursor at click position
        const selection = window.getSelection();
        if (selection) {
            let range;
            
            // Modern browsers
            if (document.caretRangeFromPoint) {
                range = document.caretRangeFromPoint(e.clientX, e.clientY);
            } else if (document.caretPositionFromPoint) {
                const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
                if (pos) {
                    range = document.createRange();
                    range.setStart(pos.offsetNode, pos.offset);
                }
            }
    
            if (range) {
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            } else {
              // Fallback for older browsers or if the click is outside text
              const fallbackRange = document.createRange();
              fallbackRange.selectNodeContents(textContainer);
              fallbackRange.collapse(false); // Fallback to end
              selection.removeAllRanges();
              selection.addRange(fallbackRange);
            }
        }
      }
      return;
    }

    if (!clone) return;

    const boardRect = noteBoard.getBoundingClientRect();
    
    // Use clientX/Y for consistent, viewport-relative calculation
    const finalLeft = e.clientX - boardRect.left - offsetX + noteBoard.scrollLeft;
    const finalTop = e.clientY - boardRect.top - offsetY + noteBoard.scrollTop;

    // Update original note's position and save
    note.style.left = `${finalLeft}px`;
    note.style.top = `${finalTop}px`;
    notesData[index].x = note.style.left;
    notesData[index].y = note.style.top;
    saveNotesData();

    // Clean up
    if (clone && clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
    clone = null;
    note.style.visibility = 'visible';

    // Reset all states
    isDragging = false;
    hasMoved = false;
    isControlClick = false;
    if (dragTimeout) {
      clearTimeout(dragTimeout);
      dragTimeout = null;
    }

    // Restore overflow after a short delay
    setTimeout(() => {
      noteBoard.style.overflow = 'auto';
    }, 0);
  };

  const cleanupDrag = () => {
    if (clone && clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
    clone = null;
    note.style.visibility = 'visible';
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp, true);
    isDragging = false;
    hasMoved = false;
    isControlClick = false;
    if (dragTimeout) {
      clearTimeout(dragTimeout);
      dragTimeout = null;
    }
    noteBoard.style.overflow = 'auto';
  };

  note.addEventListener('mousedown', (e) => {
    // If the click is on a control button, do nothing.
    // The button's own onclick handler will deal with it.
    if (e.target.closest('.note-delete') || e.target.closest('.note-color')) {
      return;
    }
    
    // Don't start dragging if it's a right click
    if (e.button !== 0) {
      return;
    }

    mouseDownTime = Date.now();
    startX = e.clientX;
    startY = e.clientY;
    hasMoved = false;

    // Set up initial position for potential drag
    const rect = note.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    // Add move and up listeners immediately
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp, true);
  });

  function startDrag(e) {
    if (isDragging) return; // Prevent multiple drag operations
    
    // If we're dragging, blur the text container to prevent the keyboard from showing
    if (document.activeElement === textContainer) {
      textContainer.blur();
    }
    
    isDragging = true;
    
    clone = note.cloneNode(true);
    clone.classList.add('dragging');
    clone.style.position = 'fixed';
    clone.style.zIndex = '9999';
    clone.style.pointerEvents = 'none';

    const rect = note.getBoundingClientRect();
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.left = `${e.clientX - offsetX}px`;
    clone.style.top = `${e.clientY - offsetY}px`;
    
    document.body.appendChild(clone);
    note.style.visibility = 'hidden';
    noteBoard.style.overflow = 'visible';
  }

  // Prevent default drag behavior
  note.ondragstart = () => false;
  
  // Cleanup on note removal
  note.addEventListener('remove', cleanupDrag);
}

renderNotes();
