'use client';

interface MoodPickerProps {
  currentMood: string | null;
  onSelect: (mood: string) => void;
  onClose: () => void;
}

const moods = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😡', label: 'Angry' },
  { emoji: '😴', label: 'Tired' },
];

export default function MoodPicker({ currentMood, onSelect, onClose }: MoodPickerProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, textAlign: 'center', marginBottom: '8px' }}>
          How are you feeling? 💭
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '24px' }}>
          Your partner will be able to see your mood
        </p>
        <div className="mood-picker">
          {moods.map(m => (
            <button
              key={m.emoji}
              className={`mood-option ${currentMood === m.emoji ? 'selected' : ''}`}
              onClick={() => onSelect(m.emoji)}
            >
              {m.emoji}
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
