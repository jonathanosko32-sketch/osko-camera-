(() => {
  const $ = selector => document.querySelector(selector);
  const voiceBtn = $('#voiceCommandBtn');
  const voiceStatus = $('#voiceStatus');
  const noteInput = $('#noteInput');
  const saveNoteBtn = $('#saveNoteBtn');
  const readNotesBtn = $('#readNotesBtn');
  const clearNotesBtn = $('#clearNotesBtn');
  const noteList = $('#noteList');
  const websiteCopyBtn = $('#websiteCopyBtn');
  const shareLastBtn = $('#shareLastBtn');
  const stickerText = $('#stickerText');
  const stickerSize = $('#stickerSize');
  const stickerX = $('#stickerX');
  const stickerY = $('#stickerY');
  const applyStickerBtn = $('#applyStickerBtn');
  const quickStatus = $('#quickStatus');
  const emojiButtons = [...document.querySelectorAll('[data-emoji]')];

  let recognition = null;
  let listening = false;
  let notes = loadNotes();

  function setQuickStatus(message) {
    if (quickStatus) quickStatus.textContent = message;
    if (typeof setStatus === 'function') setStatus(message);
  }

  function loadNotes() {
    try { return JSON.parse(localStorage.getItem('osko-camera-notes') || '[]'); }
    catch { return []; }
  }

  function saveNotes() {
    localStorage.setItem('osko-camera-notes', JSON.stringify(notes));
    renderNotes();
  }

  function renderNotes() {
    if (!noteList) return;
    noteList.innerHTML = '';
    if (!notes.length) {
      noteList.innerHTML = '<p class="command-help">No saved notes yet.</p>';
      return;
    }
    notes.slice(0, 20).forEach((note, index) => {
      const card = document.createElement('article');
      card.className = 'note-card';
      const small = document.createElement('small');
      small.textContent = new Date(note.time).toLocaleString();
      const text = document.createElement('div');
      text.textContent = note.text;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Delete';
      remove.addEventListener('click', () => {
        notes.splice(index, 1);
        saveNotes();
      });
      card.append(small, text, remove);
      noteList.appendChild(card);
    });
  }

  function addNote(text) {
    const clean = String(text || '').trim();
    if (!clean) return false;
    notes.unshift({ text: clean, time: Date.now() });
    notes = notes.slice(0, 100);
    saveNotes();
    if (noteInput) noteInput.value = '';
    setQuickStatus('Note saved');
    return true;
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    speechSynthesis.speak(utterance);
  }

  function latestPhoto() {
    return typeof captures !== 'undefined' ? captures.find(item => item.type === 'photo') : null;
  }

  async function shareLastCapture() {
    const item = typeof captures !== 'undefined' ? captures[0] : null;
    if (!item) return setQuickStatus('Take a picture first');
    const file = new File([item.blob], item.filename, { type: item.blob.type || 'image/jpeg' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'OSKO Camera' });
        setQuickStatus('Share menu opened');
      } else {
        setQuickStatus('Save the picture, then attach it in email');
      }
    } catch (error) {
      if (error.name !== 'AbortError') setQuickStatus('Could not open sharing');
    }
  }

  async function makeWebsiteCopy() {
    const item = latestPhoto();
    if (!item) return setQuickStatus('Take a picture first');
    try {
      const bitmap = await createImageBitmap(item.blob);
      const maxSide = 1600;
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const out = document.createElement('canvas');
      out.width = width;
      out.height = height;
      out.getContext('2d').drawImage(bitmap, 0, 0, width, height);
      out.toBlob(blob => {
        if (!blob) return setQuickStatus('Website copy failed');
        addCapture(blob, 'photo', 'jpg', 'website');
        setQuickStatus('Website-size copy saved');
      }, 'image/jpeg', 0.84);
    } catch (error) {
      console.error(error);
      setQuickStatus('Website copy failed');
    }
  }

  async function applySticker() {
    const item = latestPhoto();
    const textValue = String(stickerText?.value || '').trim();
    if (!item) return setQuickStatus('Take a picture first');
    if (!textValue) return setQuickStatus('Choose an emoji or type text');
    try {
      const bitmap = await createImageBitmap(item.blob);
      const out = document.createElement('canvas');
      out.width = bitmap.width;
      out.height = bitmap.height;
      const ctx = out.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      const size = Math.max(28, Math.round((Number(stickerSize?.value || 16) / 100) * out.width));
      const x = (Number(stickerX?.value || 50) / 100) * out.width;
      const y = (Number(stickerY?.value || 50) / 100) * out.height;
      ctx.font = `700 ${size}px system-ui, Apple Color Emoji, Segoe UI Emoji`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = Math.max(3, size * 0.06);
      ctx.strokeStyle = 'rgba(0,0,0,.65)';
      ctx.strokeText(textValue, x, y);
      ctx.fillStyle = '#fff';
      ctx.fillText(textValue, x, y);
      out.toBlob(blob => {
        if (!blob) return setQuickStatus('Sticker copy failed');
        addCapture(blob, 'photo', 'jpg', 'sticker');
        setQuickStatus('Sticker copy saved; original kept');
      }, 'image/jpeg', 0.96);
    } catch (error) {
      console.error(error);
      setQuickStatus('Sticker copy failed');
    }
  }

  function executeVoiceCommand(spoken) {
    const text = String(spoken || '').trim();
    const command = text.toLowerCase();
    if (!text) return;
    if (voiceStatus) voiceStatus.textContent = `Heard: ${text}`;

    if (/^(take|snap|capture).*(photo|picture)|^(photo|picture)$/.test(command)) {
      takePhoto();
      speak('Taking picture');
      return;
    }
    if (/start.*camera|open.*camera/.test(command)) {
      if (!stream) startCamera();
      speak('Opening camera');
      return;
    }
    if (/stop.*camera|close.*camera/.test(command)) {
      if (stream) stopCamera();
      speak('Camera stopped');
      return;
    }
    if (/flashlight on|flash on|torch on/.test(command)) {
      setRearFlash(true);
      speak('Turning rear light on');
      return;
    }
    if (/flashlight off|flash off|torch off/.test(command)) {
      setRearFlash(false);
      speak('Turning rear light off');
      return;
    }
    if (/share.*(last|picture|photo)|send.*(last|picture|photo)/.test(command)) {
      shareLastCapture();
      return;
    }
    if (/website.*copy|make.*website/.test(command)) {
      makeWebsiteCopy();
      return;
    }
    if (/read.*notes/.test(command)) {
      const spokenNotes = notes.slice(0, 5).map((note, i) => `Note ${i + 1}. ${note.text}`).join('. ');
      speak(spokenNotes || 'You have no saved notes');
      return;
    }
    const noteMatch = text.match(/(?:write|save|make|take) (?:a )?note(?: down)?[,:]?\s*(.*)/i);
    if (noteMatch) {
      if (noteMatch[1]) {
        addNote(noteMatch[1]);
        speak('Note saved');
      } else {
        if (noteInput) noteInput.focus();
        speak('Tell me the note after saying write a note');
      }
      return;
    }
    addNote(text);
    speak('I saved that as a note');
  }

  function setupRecognition() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      if (voiceBtn) voiceBtn.disabled = true;
      if (voiceStatus) voiceStatus.textContent = 'Voice commands need Chrome speech support.';
      return;
    }
    recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => {
      listening = true;
      voiceBtn?.classList.add('active');
      if (voiceBtn) voiceBtn.textContent = 'Listening…';
      if (voiceStatus) voiceStatus.textContent = 'Say a command or dictate a note.';
    };
    recognition.onresult = event => executeVoiceCommand(event.results[0][0].transcript);
    recognition.onerror = event => {
      if (event.error !== 'no-speech') setQuickStatus(`Voice error: ${event.error}`);
    };
    recognition.onend = () => {
      listening = false;
      voiceBtn?.classList.remove('active');
      if (voiceBtn) voiceBtn.textContent = 'Talk to Skie';
    };
  }

  voiceBtn?.addEventListener('click', () => {
    if (!recognition) return;
    if (listening) recognition.stop(); else recognition.start();
  });
  saveNoteBtn?.addEventListener('click', () => addNote(noteInput?.value));
  readNotesBtn?.addEventListener('click', () => {
    const spokenNotes = notes.slice(0, 5).map((note, i) => `Note ${i + 1}. ${note.text}`).join('. ');
    speak(spokenNotes || 'You have no saved notes');
  });
  clearNotesBtn?.addEventListener('click', () => {
    if (!confirm('Clear all OSKO Camera notes?')) return;
    notes = [];
    saveNotes();
    setQuickStatus('Notes cleared');
  });
  websiteCopyBtn?.addEventListener('click', makeWebsiteCopy);
  shareLastBtn?.addEventListener('click', shareLastCapture);
  applyStickerBtn?.addEventListener('click', applySticker);
  emojiButtons.forEach(button => button.addEventListener('click', () => {
    if (stickerText) stickerText.value += button.dataset.emoji;
  }));

  setupRecognition();
  renderNotes();
})();