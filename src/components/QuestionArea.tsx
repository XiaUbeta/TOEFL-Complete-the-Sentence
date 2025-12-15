import React, { useRef, useState } from 'react';
import type { Segment } from '../services/ai';

interface QuestionAreaProps {
  topic: string;
  segments: Segment[];
  userAnswers: Record<number, string>;
  handleInputChange: (index: number, value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

interface MaskedInputProps {
  value: string;
  length: number;
  onChange: (val: string) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  // Changed from RefObject to a callback ref or RefObject union
  inputRef: React.Ref<HTMLInputElement>;
}

const MaskedInput: React.FC<MaskedInputProps> = ({ value, length, onChange, onNavigate, inputRef }) => {
  const [cursorPos, setCursorPos] = useState<number | null>(null);

  // Sync cursor position from input selection
  const handleSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    setCursorPos(input.selectionStart);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const { selectionStart, selectionEnd } = input;
    
    if (e.key === 'ArrowRight') {
      if (selectionStart === length) {
        e.preventDefault();
        onNavigate('next');
      }
    } else if (e.key === 'ArrowLeft') {
      if (selectionStart === 0 && selectionEnd === 0) {
        e.preventDefault();
        onNavigate('prev');
      }
    }
  };

  return (
    <div className="relative inline-block mx-0.5 align-baseline">
      {/* Visual Layer */}
      <div className={`flex bg-gray-200 rounded px-1 py-0.5 cursor-text ${cursorPos !== null ? 'ring-2 ring-teal-500 ring-opacity-50' : ''}`}>
        {Array.from({ length }).map((_, i) => {
          // Determine if we should show a cursor at this position
          // Cursor should be shown before character i if cursorPos === i
          const showCursor = cursorPos === i;
          // Special case: cursor at the very end (length)
          const isLast = i === length - 1;
          const showCursorAfter = cursorPos === length && isLast;

          return (
            <span 
              key={i} 
              className="relative w-4 text-center font-mono text-lg leading-tight text-gray-800 border-b-2 border-transparent"
            >
               {/* Pre-character cursor */}
               {showCursor && (
                <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-black animate-pulse -ml-[1px] h-5 my-auto" />
              )}
              
              {value[i] || '_'}

              {/* Post-character cursor (only for the last element) */}
              {showCursorAfter && (
                <span className="absolute right-0 top-0 bottom-0 w-0.5 bg-black animate-pulse -mr-[1px] h-5 my-auto" />
              )}
            </span>
          );
        })}
      </div>

      {/* Hidden Interactive Layer */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          if (val.length <= length) {
            onChange(val);
          }
        }}
        onSelect={handleSelect}
        onKeyDown={handleKeyDown}
        onFocus={(e) => setCursorPos(e.target.selectionStart)}
        onBlur={() => setCursorPos(null)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-text"
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
};

export const QuestionArea: React.FC<QuestionAreaProps> = ({ 
  topic, 
  segments, 
  userAnswers, 
  handleInputChange,
  onSubmit,
  isSubmitting
}) => {
  // Store refs to inputs to enable navigation
  const inputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  const handleNavigate = (currentIndex: number, direction: 'prev' | 'next') => {
    // Find all blank indices
    const blankIndices = segments
      .map((seg, idx) => seg.type === 'blank' ? idx : -1)
      .filter(idx => idx !== -1);
    
    const currentPos = blankIndices.indexOf(currentIndex);
    if (currentPos === -1) return;

    let targetIndex = -1;
    if (direction === 'prev' && currentPos > 0) {
      targetIndex = blankIndices[currentPos - 1];
    } else if (direction === 'next' && currentPos < blankIndices.length - 1) {
      targetIndex = blankIndices[currentPos + 1];
    }

    if (targetIndex !== -1) {
      const targetInput = inputRefs.current.get(targetIndex);
      if (targetInput) {
        targetInput.focus();
        // Optional: Select text or place cursor based on direction
        // For simplicity, just focus which usually puts cursor at end or all selected depending on browser
      }
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md mb-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Complete the Words</h2>
        <span className="text-sm font-medium text-teal-600 bg-teal-50 px-3 py-1 rounded-full">Topic: {topic}</span>
      </div>
      
      <div className="text-lg leading-loose text-gray-800 mb-8 font-serif">
        {segments.map((segment, index) => {
          if (segment.type === 'text') {
            return <span key={index}>{segment.content}</span>;
          } else {
            const missingLength = segment.missing?.length || 0;
            return (
              <span key={index} className="inline-flex items-baseline mx-1">
                <span className="mr-0.5 font-medium">{segment.prefix}</span>
                <MaskedInput 
                  inputRef={(el) => {
                    if (el) inputRefs.current.set(index, el);
                    else inputRefs.current.delete(index);
                  }}
                  value={userAnswers[index] || ''}
                  length={missingLength}
                  onChange={(val) => handleInputChange(index, val)}
                  onNavigate={(dir) => handleNavigate(index, dir)}
                />
              </span>
            );
          }
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className={`px-6 py-2 rounded text-white font-medium transition-colors ${
            isSubmitting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-teal-600 hover:bg-teal-700'
          }`}
        >
          {isSubmitting ? 'Checking...' : 'Check Answer'}
        </button>
      </div>
    </div>
  );
};
