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
  const prompt = `You are an expert test creator for the **TOEFL Essentials "Complete the Words"** section. Your task is to generate a realistic practice exercise that mimics the specific difficulty and logic of real exam questions.

Please follow these strict generation rules:

### 1. Text Generation
* **Topic**: General Academic (e.g., Cosmology, Biology, History, Environmental Science) or Campus Life.
* **Length**: 50-80 words.
* **Difficulty**: Equivalent to the **first paragraph of a TOEFL Reading passage** or CET-4/High School level academic text. The sentence structure should be natural American English.

### 2. Blank Selection Logic (Crucial)
You must select **6-10 words** to partially blank out. You MUST vary the types of blanks to include the following three categories, just like the real exam:
* **Category A: Functional Words (Grammar/Collocations)**: Select short prepositions, articles, or conjunctions (e.g., *the, of, from, to, in*). These test language sense and fixed collocations (e.g., "range *from*... *to*...").
* **Category B: Morphology & Word Forms**: Select words that require grammatical inflection based on context.
    * *Examples*: Superlatives (*small**est***), Participles (*encompass**ing***, *locat**ed***), Adverbs (*extreme**ly***), Plurals.
* **Category C: Academic Vocabulary**: Select nouns or verbs common in academic settings, focusing on roots and spelling.
    * *Examples*: *hypo**thesis***, *field*, *struc**ture***.

### 3. Masking/Display Rules
For the selected words, provide a 'prefix' (visible part) and a 'missing' (typed part).
* **For Short Words (2-3 letters)**: Keep only the **1st letter** (e.g., "of" -> prefix: "o", missing: "f"; "the" -> prefix: "t", missing: "he").
* **For Medium/Long Words**: Keep the first **3-5 letters** (enough to identify the root but hiding the suffix or spelling difficulty).
    * *Example*: "hypothesis" -> prefix: "hypo", missing: "thesis".
    * *Example*: "smallest" -> prefix: "smal", missing: "lest".

### 4. Output Format
Output **strictly in JSON format** with no markdown code blocks or extra text.
Structure:
{
  "topic": "Topic Name",
  "segments": [
    { "type": "text", "content": "Modern cosmology is a " },
    { "type": "blank", "full_word": "field", "prefix": "fi", "missing": "eld" },
    { "type": "text", "content": " that ranges " },
    { "type": "blank", "full_word": "from", "prefix": "fr", "missing": "om" },
    { "type": "text", "content": " the study of the..." }
  ]
}
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
