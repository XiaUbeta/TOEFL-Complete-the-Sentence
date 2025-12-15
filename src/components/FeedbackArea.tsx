import React from 'react';
import type { FeedbackData } from '../services/ai';
import { CheckCircle, XCircle, BookOpen } from 'lucide-react';

interface FeedbackAreaProps {
  feedback: FeedbackData;
}

export const FeedbackArea: React.FC<FeedbackAreaProps> = ({ feedback }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <div className={`text-4xl font-bold ${feedback.score >= 80 ? 'text-green-600' : 'text-amber-600'}`}>
          {feedback.score}
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">Your Score</h3>
          <p className="text-gray-500 text-sm">See detailed analysis below</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <XCircle size={18} className="text-red-500" /> Corrections
          </h4>
          <ul className="space-y-3">
            {feedback.corrections.map((item, idx) => (
              <li key={idx} className={`p-3 rounded border ${item.correct ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                <div className="flex justify-between items-start">
                  <span className="font-medium text-gray-800">{item.word}</span>
                  {item.correct ? (
                    <CheckCircle size={16} className="text-green-500 mt-1" />
                  ) : (
                    <XCircle size={16} className="text-red-500 mt-1" />
                  )}
                </div>
                {!item.correct && (
                   <div className="text-sm mt-1">
                       <p className="text-red-700"><span className="font-semibold">You wrote:</span> {item.user_input}</p>
                       <p className="text-gray-600 mt-1">{item.explanation}</p>
                   </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <BookOpen size={18} className="text-blue-500" /> Vocabulary
          </h4>
           <ul className="space-y-2">
            {feedback.vocabulary_expansion.map((item, idx) => (
              <li key={idx} className="p-3 bg-blue-50 rounded border border-blue-100">
                <span className="font-bold text-blue-900">{item.word}</span>
                <span className="mx-2 text-gray-400">-</span>
                <span className="text-gray-700">{item.meaning}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
