import { GoogleGenAI, Type } from "@google/genai";
import { AuthorStyle } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const outlineSchema = {
  type: Type.OBJECT,
  properties: {
    outline: {
      type: Type.ARRAY,
      description: `A list of chapter objects.`,
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "一个引人入胜的中文章节标题。"
          },
          beat: {
            type: Type.STRING,
            description: "遵循雪花写作法和三幕剧结构，对此章节的故事节拍进行简短描述（例如：“激励事件”、“第一个转折点”、“中点”、“一败涂地”）。"
          }
        },
        required: ["title", "beat"]
      }
    }
  }
};

const singleChapterSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "一个引人入胜的中文章节标题，与前后章节衔接自然。"
    },
    beat: {
      type: Type.STRING,
      description: "对此章节的故事节拍进行简短描述，确保其在整个故事结构中的作用清晰且必要。"
    }
  },
  required: ["title", "beat"]
};


async function callGemini(prompt: string, systemInstruction?: string) {
    const model = 'gemini-2.5-flash';
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction,
                temperature: 0.7,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get response from Gemini API.");
    }
}

async function callGeminiForObject<T>(prompt: string, schema: object): Promise<T> {
    const model = 'gemini-2.5-flash';
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        return JSON.parse(response.text) as T;
    } catch (error) {
        console.error("Error calling Gemini API for object:", error);
        throw new Error("Failed to generate structured data from Gemini API.");
    }
}

async function callGeminiWithSchema(prompt: string, schema: object): Promise<{ title: string; beat: string }[]> {
    const result = await callGeminiForObject<{ outline: { title: string; beat: string }[] }>(prompt, schema);
    if (result && result.outline && Array.isArray(result.outline)) {
        return result.outline;
    }
    throw new Error("Invalid outline format received from API.");
}

export async function generateNovelOutline(context: string, numChapters: number): Promise<{ title: string; beat: string }[]> {
  const prompt = `你是一位专业的网络小说编辑，精通“雪花写作法”和故事节拍表。
根据以下核心设定，为一部长篇网络小说生成前 ${numChapters} 章的大纲。
---
核心设定:
${context}
---
你的任务是创建章节标题列表。对于每一章，你必须提供一个“节拍”，描述其在故事中的结构性作用。
- 大纲必须遵循逻辑进展，建立世界，介绍主角，并启动主要冲突（激励事件）。
- 不要解决主要故事。这只是一部长篇小说的开端。
- 风格应符合流行的中国网络小说。
- 语言：请使用中文。`;
  return callGeminiWithSchema(prompt, outlineSchema);
}

export async function generateMoreChapterTitles(
  context: string,
  numChapters: number,
  existingOutline: { title: string; beat: string }[]
): Promise<{ title: string; beat: string }[]> {
  const prompt = `你是一位文学助手，正在遵循雪花写作法，为一部长篇网络小说续写大纲。
- 核心设定: "${context}"

这是目前的章节大纲及其故事节拍：
---
${existingOutline.map((t, i) => `第 ${i + 1} 章: ${t.title} (节拍: ${t.beat})`).join('\n')}
---
你的任务是生成接下来 ${numChapters} 个章节（标题和节拍），使其在逻辑上承接最后一章。
这些新章节必须引入故事的下一阶段。确保平稳过渡，并且每个新章节都有一个清晰的结构性“节拍”。
- 语言：请使用中文。`;
  return callGeminiWithSchema(prompt, outlineSchema);
}

export async function regenerateChapterOutline(
  context: string,
  fullOutline: { title: string; beat: string }[],
  chapterIndex: number
): Promise<{ title: string; beat: string }> {
  const chapterToRegenerate = fullOutline[chapterIndex];
  const previousChapter = chapterIndex > 0 ? fullOutline[chapterIndex - 1] : null;
  const nextChapter = chapterIndex < fullOutline.length - 1 ? fullOutline[chapterIndex + 1] : null;

  const prompt = `你是一位专业的网络小说编辑。根据小说的核心设定和现有的大纲，重新生成指定章节的标题和故事节拍。
  
核心设定:
---
${context}
---

完整大纲:
---
${fullOutline.map((c, i) => `第 ${i + 1} 章: ${c.title} (${c.beat}) ${i === chapterIndex ? '<-- (本章需要重写)' : ''}`).join('\n')}
---

任务:
请重写 **第 ${chapterIndex + 1} 章** 的内容。
- **前一章 (第 ${chapterIndex} 章)** 是: "${previousChapter ? previousChapter.title : '无'}"
- **后一章 (第 ${chapterIndex + 2} 章)** 是: "${nextChapter ? nextChapter.title : '无'}"
- **当前章节的旧内容是**: "${chapterToRegenerate.title}" (${chapterToRegenerate.beat})

新的章节内容必须在逻辑上连接前后章节，并为故事提供一个更好、更有趣的转折或进展。
只返回重写后章节的 JSON 对象，包含 "title" 和 "beat"。
语言：请使用中文。`;

  return callGeminiForObject<{ title: string; beat: string }>(prompt, singleChapterSchema);
}

export async function generateChapterContent(
  novelContext: string, 
  chapterTitle: string,
  chapterBeat: string,
  authorStyle: AuthorStyle | string
): Promise<string> {
    const model = 'gemini-2.5-pro';

    const systemInstruction = `你是一位大师级的中国网络小说家。你的任务是为一部鸿篇巨制撰写一个章节，并完美模仿一位著名作家的风格。

**核心指令:**
1.  **小说设定:**
    ${novelContext}

2.  **作者风格模仿:** 你必须采用以下作者的写作风格：**${(authorStyle as string).split(' | ')[0]}**。
    - **我吃西红柿 (I Eat Tomatoes):** 宏大的世界观，清晰的等级体系，爽快的情节推进，杀伐果断的主角。注重“爽点”。
    - **辰东 (Chen Dong):** 史诗感和广阔的尺度，大量的伏笔和悬念（挖坑），宏大而苍凉的氛围，充满力量和想象力的战斗场面。
    - **唐家三少 (Tang Jia San Shao):** 详尽而独特的设定（尤其是能力），非常强调角色的情感和关系，结构严谨且节奏稳定。
    - **耳根 (Er Gen):** 深刻且常带有哲理的意味，独特的角色癖好，幽默与悲剧的结合，复杂而令人难忘的角色名和能力。
    - **默认风格:** 一种平衡的、现代的网络小说风格，适合番茄小说等平台。
    - **自定义:** 如果是自定义风格，请尽力模仿用户在风格名称中描述的特点。

3.  **语言:** 使用中文写作。

4.  **节奏与结构:** 这只是一部长篇小说中的一个章节。你的目标是实现本章“节拍”所承诺的内容。充分发展这个特定的时刻。在本章中适度推进情节，并以一个能让读者渴望知道接下来发生什么的“钩子”结尾。不要急于推进故事。`;

    const prompt = `现在，请为标题为“${chapterTitle}”的章节撰写完整内容。
本章的结构性目的（节拍）是：“${chapterBeat}”。
章节内容应充实，至少1500汉字。
充实场景，撰写引人入胜的对话，构建世界，同时忠于所选作者的风格并实现章节的特定节拍。`;

    try {
        const response = await ai.models.generateContent({
            model, contents: prompt, config: { systemInstruction, temperature: 0.7, },
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for chapter content:", error);
        throw new Error("Failed to get chapter content from Gemini API.");
    }
}

// --- Auxiliary Generation Functions ---

export async function generateSynopsis(context: string): Promise<string> {
  const prompt = `你是一位网络小说营销专家。根据以下核心设定，严格按照“主角 + 困境 + 目标 + 核心冲突 + 独特设定”的公式，创作一个吸引人的“一句话故事梗概”。
---
核心设定:
${context}
---
要求：
1. 语言：中文。
2. 严格遵循公式，将五个要素清晰地融合在一两句话中。
3. 梗概必须简洁、有力、充满悬念。`;
  return callGemini(prompt);
}

export async function generateStoryHook(context: string): Promise<string> {
    const prompt = `你是一位顶级的网络小说开篇大师。根据以下核心设定，创作一个极具吸引力的“故事钩子”（Story Hook）。
---
核心设定:
${context}
---
要求：
1. 语言：中文。
2. 这是一个小说的最开始的一两句话或第一段。
3. 必须立即将读者带入一个充满悬念、冲突或奇特情境的场景中。
4. 目标是让读者在读完后立刻产生“接下来发生了什么？”的强烈好奇心。
5. 展示而非讲述，用行动和感官细节来吸引人。`;
    return callGemini(prompt);
}

export async function generateGoldenFinger(context: string): Promise<string> {
  const prompt = `你是一位富有创意的网络小说世界构建师。根据小说的核心设定，为主角设计一个独特的“金手指”或外挂能力。
---
核心设定:
${context}
---
请用中文描述这个金手指，包括：
1.  **名称:** 一个酷炫且令人难忘的名字（例如：“无限吞噬系统”、“因果天书”）。
2.  **核心功能:** 它最根本的作用是什么？
3.  **初始能力:** 主角在故事开始时能用它做什么？
4.  **限制/代价:** 它的弱点、使用成本或冷却时间是什么？
5.  **成长潜力:** 它在整个故事中如何升级或进化？`;
  return callGemini(prompt);
}

export async function generateCoreSetting(context: string): Promise<string> {
  const prompt = `你是一位幻想/科幻世界构建师。根据以下核心设定，为一部新的网络小说生成核心设定（世界观）。
---
核心设定:
${context}
---
请用中文充实这个世界，包括：
1.  **世界名称与概述:** 对世界的简要描述。
2.  **力量体系:** 力量的来源（例如：修仙、魔法、科技、变异），其等级划分，以及如何晋升。
3.  **主要派系:** 至少三个主要势力，他们的目标以及他们之间的关系（例如：帝国、宗门、财团、隐世家族）。
4.  **关键冲突:** 世界中紧张局势的主要来源（例如：即将到来的末日、派系间的战争、一个被封印的远古邪恶）。`;
  return callGemini(prompt);
}

export async function generateCharacterProfilesAndMap(context: string): Promise<string> {
    const prompt = `你是一位网络小说角色设计师和故事结构分析师。根据小说的核心设定，为主角、女主角和2-3个主要配角创建详细的人物档案，并生成一份主要人物关系图。请将所有内容整合到一个格式清晰的Markdown文档中。
---
核心设定:
${context}
---
**输出格式要求 (使用中文):**

### 主角设定
- **姓名:** 
- **外貌与风度:** 
- **性格:** (以核心设定中的角色原型为基础)
- **背景故事:** 
- **主要目标/动机:** 

### 女主设定
- **姓名与身份:**
- **外貌与气质:**
- **性格特点:**
- **与主角的关系:**
- **在故事中的作用:**

### 主要配角
**配角一:**
- **姓名与身份:** 
- **核心性格:** 
- **与主角的关系及功能:**

**配角二:**
- **姓名与身份:** 
- **核心性格:** 
- **与主角的关系及功能:**

### 人物关系图
- **主角 -> 女主:** 
- **主角 -> 主要反派:** (如果设定中已暗示)
- **主角 -> 配角一:** 
- **主角 -> 配角二:** 
- **女主 -> 配角一:**
`;
    return callGemini(prompt);
}

export async function generateFullWorldview(context: string, synopsis: string): Promise<string> {
    const prompt = `你是一位世界构建大师，负责为一部新的网络小说撰写一份详尽、引人入胜的“完整世界观”设定文档。
---
**核心设定:**
${context}
---
**一句话梗概:**
${synopsis || '尚未生成'}
---

**任务:**
基于以上信息，用中文创作一份完整的世界观设定。这份设定需要逻辑自洽、充满想象力，并为后续的故事情节提供坚实的基础。请包含以下部分：

### 1. 世界背景与历史
- **世界名称与时代:** (例如：苍蓝星，星际历3024年)
- **核心历史事件:** 描述1-2个塑造了当前世界格局的关键历史事件 (例如：上古神魔大战、天外文明入侵、灵气复苏的起源)。
- **地理与势力分布:** 简要描述世界的主要地理特征和各大国家、宗门、或组织的势力范围。

### 2. 力量体系详解
- **体系名称与本源:** (例如：源力修炼体系，源自星辰之力)
- **等级划分:** 清晰地列出从低到高的等级名称，并简要描述每个等级的标志性能力 (例如：炼气、筑基、金丹...)。
- **修炼/提升方式:** 如何提升等级？(例如：吸收灵气、战斗感悟、吞噬天材地宝)。
- **特殊能力/职业:** 这个世界是否有独特的职业或血脉能力？(例如：炼丹师、阵法师、龙族血脉)。

### 3. 社会文化与法则
- **社会结构:** 是帝国制、联邦制、还是宗门林立？
- **通用货币与经济:**
- **核心价值观与禁忌:** 这个世界的人们普遍信奉什么？又有什么是绝对不能触碰的底线？

### 4. 独特设定与亮点
- 详细阐述核心设定中的“独特设定亮点”，使其更具体、更有吸引力。
- 解释这个独特设定是如何影响世界和其中居民的日常生活的。

请确保所有设定都与“核心设定”和“一句话梗概”紧密相连，形成一个有机整体。`;
    return callGemini(prompt);
}


export async function suggestChapterBeat(
  context: string,
  fullOutline: { title: string; beat: string }[],
  chapterIndex: number
): Promise<string> {
    const chapterToEnhance = fullOutline[chapterIndex];
    const previousChapter = chapterIndex > 0 ? fullOutline[chapterIndex - 1] : null;

    const prompt = `你是一位专业的网络小说编辑，擅长优化故事节奏。你的任务是为一个章节提出一个更具体、更富戏剧性的“故事节拍”建议。
---
**核心设定:**
${context}
---
**到目前为止的大纲:**
${fullOutline.slice(0, chapterIndex + 1).map((c, i) => `第 ${i + 1} 章: ${c.title} (${c.beat})`).join('\n')}
---
**当前需要优化的章节:** 第 ${chapterIndex + 1} 章: "${chapterToEnhance.title}"
**当前节拍 (可能过于简单):** "${chapterToEnhance.beat}"
**前一章的节拍:** "${previousChapter ? previousChapter.beat : '这是第一章'}"

**任务:**
根据上下文，重写第 ${chapterIndex + 1} 章的“节拍”。
- **目标:** 新的节拍应该更具指导性，能清晰地告诉作者这一章需要完成什么戏剧性任务。
- **要求:**
  - 明确指出这一章的核心事件。
  - 暗示主角在这一章中的行动、选择或面临的困境。
  - 包含一个能推动情节发展的元素 (例如：引入新线索、升级冲突、揭示秘密、遭遇转折)。
  - 语言：中文。

**只返回优化后的节拍字符串，不要包含任何其他说明。**`;
    return callGemini(prompt);
}


export async function generateOpeningTrilogyOutline(context: string): Promise<{ title: string; beat: string }[]> {
    const prompt = `你是一位顶级的网络小说编辑，深谙“黄金三章”法则。根据以下核心设定，设计前三章的大纲，确保能够立刻抓住读者。
---
核心设定:
${context}
---
请为前三章生成章节标题和节拍。必须遵循以下原则：
- **第一章:** 快速引入主角、核心冲突、悬念或金手指。
- **节奏紧凑:** 避免大段背景介绍，用“行动+对话”推进。
- **钩子明确:** 在每一章结尾都留下悬念，让读者产生“接下来会怎样？”的期待。
- **展示而非讲述:** 节拍的设计要体现出用场景来表现人物性格。
- 语言：请使用中文。`;
    return callGeminiWithSchema(prompt, outlineSchema);
}
