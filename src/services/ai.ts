import axios from 'axios';

const API_URL = 'https://api.siliconflow.cn/v1/chat/completions';

export interface Segment {
  type: 'text' | 'blank';
  content?: string; // for text
  full_word?: string; // for blank
  prefix?: string; // for blank
  missing?: string; // for blank
}

export interface QuestionData {
  topic: string;
  segments: Segment[];
}

export interface FeedbackData {
  score: number;
  corrections: {
    word: string;
    user_input: string;
    correct: boolean;
    explanation: string;
  }[];
  vocabulary_expansion: {
    word: string;
    meaning: string;
  }[];
}

export const generateQuestion = async (apiKey: string, model: string, seed: number = 0): Promise<QuestionData> => {
  const prompt = `You are a professional TOEFL Essentials exam question creator. Your task is to generate a "Complete the Words" practice exercise.

  Please follow these rules:
  1. **Content**: Generate a short academic or daily life paragraph (50-80 words) (e.g., Campus Life, Biology, History, Astronomy). Language style must be American English.
  2. **Blank Logic**:
      * Do NOT blank out short words like prepositions or articles (a, the, in, on).
      * Focus on nouns, verbs, adjectives, and adverbs.
      * Create blanks for about 6-10 words in the paragraph.
  3. **Display Rules**:
      * For blanked words, keep the first 2-4 letters (enough to hint at the meaning).
      * The missing part corresponds to the suffix.
  4. **Output Format**: STRICT JSON ONLY. No markdown blocks.
  Structure:
  {
    "topic": "Topic Name",
    "segments": [
      { "type": "text", "content": "We know from " },
      { "type": "blank", "full_word": "drawings", "prefix": "draw", "missing": "ings" },
      { "type": "text", "content": " that have been..." }
    ]
  }
  Ensure the segments can be concatenated to form the complete paragraph.
  `;

  try {
    const requestPayload: any = {
      model: model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.9,
    };

    if (seed > 0) {
      requestPayload.seed = seed;
    }

    const response = await axios.post(
      API_URL,
      requestPayload,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const content = response.data.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error("Error generating question:", error);
    throw error;
  }
};

export const gradeAnswers = async (apiKey: string, model: string, questionData: QuestionData, userAnswers: Record<number, string>, seed: number = 0): Promise<FeedbackData> => {
    // Construct the user's attempt for the grader
    const attempt = questionData.segments.map((seg, index) => {
        if (seg.type === 'text') return seg.content;
        const userSuffix = userAnswers[index] || "";
        return `[${seg.prefix}${userSuffix}]`;
    }).join("");

    const correct = questionData.segments.map(seg => {
        if (seg.type === 'text') return seg.content;
        return seg.full_word;
    }).join("");

    const prompt = `You are a patient TOEFL English tutor. Your task is to grade the user's "Complete the Words" exercise.

    User's Attempt (bracketed words are their inputs): ${attempt}
    Correct Text: ${correct}

    Compare the user's spelling with the correct answers.
    1. **Judge**: Check spelling strictly.
    2. **Analyze**: If wrong, explain why (spelling, tense, form, etc.).
    3. **Expand**: Provide Chinese definitions for key vocabulary in the text.

    Output Format: STRICT JSON ONLY.
    {
      "score": 0-100,
      "corrections": [
        { "word": "drawings", "user_input": "drawins", "correct": false, "explanation": "Missing 'g'" }
        // Only include words that were blanks in the original question
      ],
      "vocabulary_expansion": [
        { "word": "drawings", "meaning": "图画" }
      ]
    }`;

    try {
        const requestPayload: any = {
          model: model,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.9,
        };

        if (seed > 0) {
          requestPayload.seed = seed;
        }

        const response = await axios.post(
          API_URL,
          requestPayload,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );
        const content = response.data.choices[0].message.content;
        return JSON.parse(content);
      } catch (error) {
        console.error("Error grading answers:", error);
        throw error;
      }
}
