import React, { useState, useCallback } from 'react';
import { NovelTheme, CharacterArchetype, PlotTrope, AuthorStyle, NovelLength } from './types';
import { 
  generateNovelOutline, 
  generateChapterContent, 
  generateMoreChapterTitles,
  regenerateChapterOutline,
  generateSynopsis,
  generateGoldenFinger,
  generateCoreSetting,
  generateOpeningTrilogyOutline,
  generateStoryHook,
  generateCharacterProfilesAndMap,
  generateFullWorldview,
  suggestChapterBeat,
} from './services/geminiService';
import { SpinnerIcon } from './components/icons/SpinnerIcon';
import { RefreshIcon } from './components/icons/RefreshIcon';
import { TrashIcon } from './components/icons/TrashIcon';
import { PlusIcon } from './components/icons/PlusIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';


type ActiveContent = 'chapter' | 'synopsis' | 'storyHook' | 'goldenFinger' | 'coreSetting' | 'characterProfiles' | 'fullSetting';

const App: React.FC = () => {
  // Core Settings
  const [title, setTitle] = useState('');
  const [theme, setTheme] = useState<NovelTheme>(NovelTheme.Fantasy);
  const [customTheme, setCustomTheme] = useState('');
  const [character, setCharacter] = useState<CharacterArchetype>(CharacterArchetype.Genius);
  const [customCharacter, setCustomCharacter] = useState('');
  const [plot, setPlot] = useState<PlotTrope>(PlotTrope.System);
  const [customPlot, setCustomPlot] = useState('');
  const [authorStyle, setAuthorStyle] = useState<AuthorStyle>(AuthorStyle.Default);
  const [customAuthorStyle, setCustomAuthorStyle] = useState('');
  const [novelLength, setNovelLength] = useState<NovelLength>(NovelLength.Long);
  
  // Worldview & Setting
  const [worldBackground, setWorldBackground] = useState('');
  const [powerSystem, setPowerSystem] = useState('');
  const [uniqueSetting, setUniqueSetting] = useState('');

  // Outline & Chapter Generation
  const [outline, setOutline] = useState<{ title: string; beat: string }[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<{ index: number; title: string; beat: string } | null>(null);
  const [numChapters, setNumChapters] = useState(15);
  
  // Content States
  const [chapterContent, setChapterContent] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [storyHook, setStoryHook] = useState('');
  const [goldenFinger, setGoldenFinger] = useState('');
  const [coreSetting, setCoreSetting] = useState('');
  const [characterProfiles, setCharacterProfiles] = useState('');
  const [fullSetting, setFullSetting] = useState('');
  const [activeContent, setActiveContent] = useState<ActiveContent>('chapter');

  // Loading & Error States
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isGeneratingOpening, setIsGeneratingOpening] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [isGeneratingChapter, setIsGeneratingChapter] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState<number | null>(null);
  const [isEnhancingBeat, setIsEnhancingBeat] = useState<number | null>(null);
  const [isGeneratingAux, setIsGeneratingAux] = useState<Partial<Record<ActiveContent | 'opening', boolean>>>({});
  const [error, setError] = useState<string | null>(null);

  const getFullContext = useCallback(() => {
    const finalTheme = theme === NovelTheme.Custom ? customTheme : theme;
    const finalPlot = plot === PlotTrope.Custom ? customPlot : plot;
    const finalCharacter = character === CharacterArchetype.Custom ? customCharacter : character;

    const contextParts = [
      `小说标题 (Title): ${title || '未命名'}`,
      `小说篇幅 (Length): ${novelLength}`,
      `主题 (Theme): ${finalTheme}`,
      `角色 (Character): ${finalCharacter || '未提供'}`,
      `情节 (Plot): ${finalPlot}`,
      `--- 世界观与设定 (Worldview & Setting) ---`,
      `世界背景 (World Background): ${worldBackground || '未提供 (Not provided)'}`,
      `力量/规则体系 (Power System): ${powerSystem || '未提供 (Not provided)'}`,
      `独特设定亮点 (Unique Setting Points): ${uniqueSetting || '未提供 (Not provided)'}`,
    ];
    return contextParts.join('\n');
  }, [title, theme, customTheme, character, customCharacter, plot, customPlot, novelLength, worldBackground, powerSystem, uniqueSetting]);

  const handleAuxGeneration = useCallback(async (type: Exclude<ActiveContent, 'chapter'>) => {
    if (!title.trim()) {
      setError('请输入小说标题 | Please enter a novel title.');
      return;
    }
    setIsGeneratingAux(prev => ({ ...prev, [type]: true }));
    setError(null);
    try {
      const context = getFullContext();
      let result = '';
      if (type === 'synopsis') result = await generateSynopsis(context);
      else if (type === 'storyHook') result = await generateStoryHook(context);
      else if (type === 'goldenFinger') result = await generateGoldenFinger(context);
      else if (type === 'coreSetting') result = await generateCoreSetting(context);
      else if (type === 'characterProfiles') result = await generateCharacterProfilesAndMap(context);
      else if (type === 'fullSetting') result = await generateFullWorldview(context, synopsis);
      
      
      const setters: Record<typeof type, React.Dispatch<React.SetStateAction<string>>> = {
        synopsis: setSynopsis,
        storyHook: setStoryHook,
        goldenFinger: setGoldenFinger,
        coreSetting: setCoreSetting,
        characterProfiles: setCharacterProfiles,
        fullSetting: setFullSetting,
      };
      setters[type](result);
      setActiveContent(type);

    } catch (err) {
      setError(`生成失败，请重试。| Failed to generate. Please try again.`);
      console.error(err);
    } finally {
      setIsGeneratingAux(prev => ({ ...prev, [type]: false }));
    }
  }, [title, getFullContext, synopsis]);

  const handleGenerateOpening = useCallback(async () => {
    if (!title.trim()) {
      setError('请输入小说标题 | Please enter a novel title.');
      return;
    }
    setIsGeneratingOpening(true);
    setError(null);
    setOutline([]);
    try {
      const context = getFullContext();
      const generatedOutline = await generateOpeningTrilogyOutline(context);
      setOutline(generatedOutline); 
    } catch (err) {
      setError('生成开篇大纲失败，请重试。| Failed to generate opening outline. Please try again.');
      console.error(err);
    } finally {
      setIsGeneratingOpening(false);
    }
  }, [title, getFullContext]);

  const handleGenerateOutline = useCallback(async () => {
    if (!title.trim()) {
      setError('请输入小说标题 | Please enter a novel title.');
      return;
    }
    setIsGeneratingOutline(true);
    setError(null);
    setOutline([]);
    setSelectedChapter(null);
    setChapterContent('');
    try {
      const context = getFullContext();
      const generatedOutline = await generateNovelOutline(context, numChapters);
      setOutline(generatedOutline);
    } catch (err) {
      setError('生成大纲失败，请重试。| Failed to generate outline. Please try again.');
      console.error(err);
    } finally {
      setIsGeneratingOutline(false);
    }
  }, [title, numChapters, getFullContext]);
  
  const handleGenerateMoreChapters = useCallback(async () => {
    if (!title.trim() || outline.length === 0) return;
    setIsGeneratingMore(true);
    setError(null);
    try {
      const context = getFullContext();
      const moreChapters = await generateMoreChapterTitles(context, numChapters, outline);
      setOutline(prevOutline => [...prevOutline, ...moreChapters]);
    } catch (err) {
      setError('生成后续章节失败，请重试。| Failed to generate more chapters. Please try again.');
      console.error(err);
    } finally {
      setIsGeneratingMore(false);
    }
  }, [title, numChapters, outline, getFullContext]);

  const handleGenerateChapter = useCallback(async (prompt: string, beat: string) => {
    if (!title.trim()) {
      setError('请输入小说标题。| Please enter a novel title.');
      return;
    }

    setIsGeneratingChapter(true);
    setChapterContent('');
    setError(null);
    setActiveContent('chapter');
    
    const chapterIndex = outline.findIndex(item => item.title === prompt);
    setSelectedChapter({ index: chapterIndex, title: prompt, beat });

    try {
       const fullContext = `
        ${getFullContext()}
        --- 已生成设定 (Generated Assets) ---
        一句话梗概 (Synopsis): ${synopsis || '未生成'}
        金手指 (Golden Finger): ${goldenFinger || '未生成'}
        人物设定 (Character Profiles): ${characterProfiles || '未生成'}
        完整世界观 (Full Worldview): ${fullSetting || '未生成'}
        --- 完整大纲 (Full Outline) ---
        ${outline.map((o, i) => `Chapter ${i + 1}: ${o.title} (Beat: ${o.beat})`).join('\n')}
      `;
      const finalAuthorStyle = authorStyle === AuthorStyle.Custom ? customAuthorStyle : authorStyle;
      const content = await generateChapterContent(fullContext, prompt, beat, finalAuthorStyle as AuthorStyle);
      setChapterContent(content);
    } catch (err) {
      setError('生成章节内容失败，请重试。| Failed to generate chapter content. Please try again.');
      console.error(err);
    } finally {
      setIsGeneratingChapter(false);
    }
  }, [title, outline, authorStyle, customAuthorStyle, getFullContext, synopsis, goldenFinger, coreSetting, characterProfiles, fullSetting]);
  
  const handleOutlineChange = (index: number, field: 'title' | 'beat', value: string) => {
    setOutline(prev => {
        const newOutline = [...prev];
        newOutline[index] = { ...newOutline[index], [field]: value };
        return newOutline;
    });
  };

  const handleAddChapter = () => {
      setOutline(prev => [...prev, { title: `新章节 ${prev.length + 1}`, beat: '新的节拍' }]);
  };

  const handleDeleteChapter = (index: number) => {
      setOutline(prev => prev.filter((_, i) => i !== index));
  };

  const handleRegenerateChapter = async (index: number) => {
    if (!title.trim()) {
        setError('请输入小说标题 | Please enter a novel title.');
        return;
    }
    setIsRegenerating(index);
    setError(null);
    try {
        const context = getFullContext();
        const newChapter = await regenerateChapterOutline(context, outline, index);
        setOutline(prev => prev.map((item, i) => (i === index ? newChapter : item)));
    } catch (err) {
        setError(`重新生成章节失败，请重试。| Failed to regenerate chapter. Please try again.`);
        console.error(err);
    } finally {
        setIsRegenerating(null);
    }
  };
  
  const handleEnhanceBeat = async (index: number) => {
     if (!title.trim()) {
        setError('请输入小说标题 | Please enter a novel title.');
        return;
    }
    setIsEnhancingBeat(index);
    setError(null);
    try {
        const context = getFullContext();
        const suggestedBeat = await suggestChapterBeat(context, outline, index);
        handleOutlineChange(index, 'beat', suggestedBeat);
    } catch (err) {
        setError(`节拍建议失败，请重试。| Failed to suggest beat. Please try again.`);
        console.error(err);
    } finally {
        setIsEnhancingBeat(null);
    }
  }


  const renderContent = () => {
    const contentMap: Record<ActiveContent, string> = {
        chapter: chapterContent,
        synopsis: synopsis,
        storyHook: storyHook,
        goldenFinger: goldenFinger,
        coreSetting: coreSetting,
        characterProfiles: characterProfiles,
        fullSetting: fullSetting,
    };
    return contentMap[activeContent] || '';
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const setters: Record<ActiveContent, React.Dispatch<React.SetStateAction<string>>> = {
        chapter: setChapterContent,
        synopsis: setSynopsis,
        storyHook: setStoryHook,
        goldenFinger: setGoldenFinger,
        coreSetting: setCoreSetting,
        characterProfiles: setCharacterProfiles,
        fullSetting: setFullSetting,
    };
    setters[activeContent]?.(value);
  };

  const renderAuxButton = (type: Exclude<ActiveContent, 'chapter'>, label: string) => (
      <button onClick={() => handleAuxGeneration(type)} disabled={isGeneratingAux[type] || !title.trim()} className="w-full text-sm flex justify-center items-center gap-2 bg-indigo-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-600 transition-colors">
          {isGeneratingAux[type] ? <><SpinnerIcon className="animate-spin h-4 w-4" /> 生成中...</> : label}
      </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col">
      <header className="text-center py-6 border-b border-gray-700">
        <h1 className="text-3xl md:text-4xl font-bold text-cyan-400">Novel Writer AI</h1>
        <p className="text-lg md:text-xl text-gray-400 mt-1">专业网文创作工作台 (Pro Web Novel Workbench)</p>
      </header>

      <main className="flex-grow flex flex-col md:flex-row w-full">
        {/* Controls Panel */}
        <aside className="w-full md:w-1/4 lg:w-1/5 bg-gray-800 p-6 flex flex-col gap-6 border-r border-gray-700 overflow-y-auto">
          {/* Step 1: Core Categories */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-cyan-300 border-b border-gray-600 pb-2">1. 核心分类</h2>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">小说标题</label>
              <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：星辰之战" className="w-full bg-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
            </div>
            {/* Theme */}
            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-gray-300 mb-1">主题 | Theme</label>
              <select id="theme" value={theme} onChange={(e) => setTheme(e.target.value as NovelTheme)} className="w-full bg-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  {Object.values(NovelTheme).map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              {theme === NovelTheme.Custom && <input type="text" value={customTheme} onChange={e => setCustomTheme(e.target.value)} placeholder="输入自定义主题" className="mt-2 w-full bg-gray-600 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"/>}
            </div>
            {/* Character */}
            <div>
              <label htmlFor="character" className="block text-sm font-medium text-gray-300 mb-1">角色 | Character</label>
              <select id="character" value={character} onChange={(e) => setCharacter(e.target.value as CharacterArchetype)} className="w-full bg-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  {Object.values(CharacterArchetype).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {character === CharacterArchetype.Custom && <input type="text" value={customCharacter} onChange={e => setCustomCharacter(e.target.value)} placeholder="输入自定义角色类型" className="mt-2 w-full bg-gray-600 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"/>}
            </div>
             {/* Plot */}
            <div>
              <label htmlFor="plot" className="block text-sm font-medium text-gray-300 mb-1">情节 | Plot</label>
              <select id="plot" value={plot} onChange={(e) => setPlot(e.target.value as PlotTrope)} className="w-full bg-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  {Object.values(PlotTrope).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              {plot === PlotTrope.Custom && <input type="text" value={customPlot} onChange={e => setCustomPlot(e.target.value)} placeholder="输入自定义情节" className="mt-2 w-full bg-gray-600 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"/>}
            </div>
            {/* Author Style */}
            <div>
              <label htmlFor="authorStyle" className="block text-sm font-medium text-gray-300 mb-1">大神风格 | Author Style</label>
              <select id="authorStyle" value={authorStyle} onChange={(e) => setAuthorStyle(e.target.value as AuthorStyle)} className="w-full bg-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  {Object.values(AuthorStyle).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {authorStyle === AuthorStyle.Custom && <input type="text" value={customAuthorStyle} onChange={e => setCustomAuthorStyle(e.target.value)} placeholder="模仿的作者/风格" className="mt-2 w-full bg-gray-600 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"/>}
            </div>
             {/* Novel Length */}
            <div>
              <label htmlFor="novelLength" className="block text-sm font-medium text-gray-300 mb-1">小说篇幅 | Novel Length</label>
              <select id="novelLength" value={novelLength} onChange={(e) => setNovelLength(e.target.value as NovelLength)} className="w-full bg-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                  {Object.values(NovelLength).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          
          {/* Step 2: Worldview & Setting */}
           <div className="space-y-3">
             <h2 className="text-lg font-semibold text-cyan-300 border-b border-gray-600 pb-2">2. 世界观与设定</h2>
             {synopsis && (
                <div className="p-2 bg-gray-700/50 rounded-md">
                  <label className="block text-xs font-medium text-gray-400 mb-1">一句话梗概</label>
                  <p className="text-sm text-gray-300">{synopsis}</p>
                </div>
              )}
             <div>
                <label htmlFor="worldBackground" className="block text-sm font-medium text-gray-300 mb-1">世界背景</label>
                <textarea id="worldBackground" value={worldBackground} onChange={(e) => setWorldBackground(e.target.value)} placeholder="现代/古代/未来？真实地球 or 架空世界？社会结构、国家势力、科技/魔法水平。" className="w-full h-24 bg-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-y"/>
             </div>
             <div>
                <label htmlFor="powerSystem" className="block text-sm font-medium text-gray-300 mb-1">力量/规则体系</label>
                <textarea id="powerSystem" value={powerSystem} onChange={(e) => setPowerSystem(e.target.value)} placeholder="修仙等级、异能分类、货币经济。必须自洽且有边界。例如：炼气→筑基→金丹…" className="w-full h-24 bg-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-y"/>
             </div>
             <div>
                <label htmlFor="uniqueSetting" className="block text-sm font-medium text-gray-300 mb-1">独特设定亮点</label>
                <textarea id="uniqueSetting" value={uniqueSetting} onChange={(e) => setUniqueSetting(e.target.value)} placeholder="你的小说有什么“别人没有”的创意？例如：情绪可兑换成战斗力" className="w-full h-24 bg-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-y"/>
             </div>
          </div>

          {/* Step 3: Pre-Production */}
          <div className="space-y-3">
             <h2 className="text-lg font-semibold text-cyan-300 border-b border-gray-600 pb-2">3. 创作准备</h2>
              {renderAuxButton('synopsis', '生成一句话梗概')}
              {renderAuxButton('storyHook', '生成故事钩子')}
              {renderAuxButton('goldenFinger', '生成金手指')}
              {renderAuxButton('coreSetting', '生成核心设定')}
              {renderAuxButton('characterProfiles', '生成人物设定')}
              {renderAuxButton('fullSetting', '生成完整世界观')}
          </div>
            
          {/* Step 4: Opening Design */}
           <div className="space-y-3">
             <h2 className="text-lg font-semibold text-cyan-300 border-b border-gray-600 pb-2">4. 开篇设计</h2>
              <button onClick={handleGenerateOpening} disabled={isGeneratingOpening || !title.trim()} className="w-full text-sm flex justify-center items-center gap-2 bg-teal-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-teal-700 disabled:bg-gray-600 transition-colors">
                {isGeneratingOpening ? <><SpinnerIcon className="animate-spin h-4 w-4" /> 生成中...</> : '生成黄金开篇大纲'}
             </button>
           </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </aside>

        {/* Outline Panel */}
        <section className="w-full md:w-1/4 lg:w-1/5 p-6 border-r border-gray-700 overflow-y-auto flex flex-col">
          <h2 className="text-xl font-semibold mb-4 text-cyan-300">大纲编辑器</h2>
          <div className="space-y-4 mb-4">
              <div>
                  <label htmlFor="numChapters" className="block text-sm font-medium text-gray-300 mb-1">生成章节数量</label>
                  <input type="number" id="numChapters" value={numChapters} onChange={(e) => setNumChapters(Math.max(1, parseInt(e.target.value, 10) || 1))} className="w-full bg-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
              </div>
              <button onClick={handleGenerateOutline} disabled={isGeneratingOutline || !title.trim()} className="w-full flex justify-center items-center gap-2 bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-600 disabled:bg-gray-600 transition-colors">
                  {isGeneratingOutline ? <><SpinnerIcon className="animate-spin h-5 w-5" /> 生成中...</> : 'AI 生成大纲'}
              </button>
          </div>
          
          <div className="flex-grow flex flex-col justify-between">
              <ul className="space-y-3">
                {outline.map((item, index) => (
                  <li key={index} className="bg-gray-700 p-3 rounded-lg space-y-2">
                    <label className="text-xs font-bold text-gray-400">第 {index + 1} 章</label>
                    <input 
                      type="text" 
                      value={item.title}
                      onChange={(e) => handleOutlineChange(index, 'title', e.target.value)}
                      placeholder="章节标题"
                      className="w-full bg-gray-600 text-gray-100 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <div className="relative">
                       <input 
                        type="text" 
                        value={item.beat}
                        onChange={(e) => handleOutlineChange(index, 'beat', e.target.value)}
                        placeholder="故事节拍"
                        className="w-full bg-gray-600 text-cyan-400 rounded p-2 pl-2 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                      <button 
                        onClick={() => handleEnhanceBeat(index)} 
                        disabled={isEnhancingBeat === index} 
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-cyan-400 hover:text-cyan-200 disabled:text-gray-500" 
                        aria-label="Enhance Beat"
                        title="AI 优化节拍建议"
                      >
                         {isEnhancingBeat === index ? <SpinnerIcon className="animate-spin h-4 w-4" /> : <SparklesIcon className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="flex justify-end items-center gap-2 pt-1">
                      <button onClick={() => handleGenerateChapter(item.title, item.beat)} className="text-xs px-3 py-1 bg-cyan-700 hover:bg-cyan-600 rounded-md transition-colors">写作</button>
                      <button onClick={() => handleRegenerateChapter(index)} disabled={isRegenerating === index} className="p-1.5 text-gray-400 hover:text-white disabled:text-gray-600" aria-label="Regenerate Chapter">
                        {isRegenerating === index ? <SpinnerIcon className="animate-spin h-4 w-4" /> : <RefreshIcon className="h-4 w-4" />}
                      </button>
                       <button onClick={() => handleDeleteChapter(index)} className="p-1.5 text-gray-400 hover:text-red-400" aria-label="Delete Chapter">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-2">
                 <button onClick={handleAddChapter} className="w-full flex justify-center items-center gap-2 bg-gray-600 text-cyan-300 font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors">
                  <PlusIcon className="h-5 w-5" /> 手动添加章节
                </button>
                <button onClick={handleGenerateMoreChapters} disabled={isGeneratingMore || isGeneratingOutline || isGeneratingOpening || outline.length === 0} className="w-full flex justify-center items-center gap-2 bg-gray-600 text-cyan-300 font-bold py-3 px-4 rounded-lg hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 transition-colors">
                  {isGeneratingMore ? <><SpinnerIcon className="animate-spin h-5 w-5" /> 生成中...</> : 'AI 生成后续'}
                </button>
              </div>
          </div>
           {outline.length === 0 && !isGeneratingOutline && !isGeneratingOpening && (
             <div className="text-gray-500 text-center mt-8">
               <p>请在上方设定章节数，点击“AI 生成大纲”开始，或“手动添加章节”自行构建。</p>
             </div>
           )}
        </section>

        {/* Content Panel */}
        <section className="w-full md:w-2/4 lg:w-3/5 p-6 flex flex-col">
            <div className="flex items-center border-b border-gray-700 mb-4 overflow-x-auto whitespace-nowrap">
                <button onClick={() => setActiveContent('chapter')} className={`px-3 py-2 text-sm font-medium transition-colors ${activeContent === 'chapter' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400 hover:text-white'}`}>章节内容</button>
                <button onClick={() => setActiveContent('synopsis')} className={`px-3 py-2 text-sm font-medium transition-colors ${activeContent === 'synopsis' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400 hover:text-white'}`}>一句话梗概</button>
                <button onClick={() => setActiveContent('storyHook')} className={`px-3 py-2 text-sm font-medium transition-colors ${activeContent === 'storyHook' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400 hover:text-white'}`}>故事钩子</button>
                <button onClick={() => setActiveContent('characterProfiles')} className={`px-3 py-2 text-sm font-medium transition-colors ${activeContent === 'characterProfiles' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400 hover:text-white'}`}>人物设定</button>
                <button onClick={() => setActiveContent('goldenFinger')} className={`px-3 py-2 text-sm font-medium transition-colors ${activeContent === 'goldenFinger' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400 hover:text-white'}`}>金手指</button>
                <button onClick={() => setActiveContent('coreSetting')} className={`px-3 py-2 text-sm font-medium transition-colors ${activeContent === 'coreSetting' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400 hover:text-white'}`}>核心设定</button>
                <button onClick={() => setActiveContent('fullSetting')} className={`px-3 py-2 text-sm font-medium transition-colors ${activeContent === 'fullSetting' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-400 hover:text-white'}`}>完整世界观</button>
            </div>
            <div className="flex-grow relative bg-gray-800 rounded-lg border border-gray-700">
                {(isGeneratingChapter && activeContent === 'chapter') && (
                <div className="absolute inset-0 flex flex-col justify-center items-center bg-gray-800 bg-opacity-80 rounded-lg z-10">
                    <SpinnerIcon className="animate-spin h-8 w-8 text-cyan-400" />
                    <p className="mt-4 text-lg">正在生成章节内容...</p>
                </div>
                )}
                <textarea
                value={renderContent()}
                onChange={handleContentChange}
                placeholder={activeContent === 'fullSetting' ? '点击“生成完整世界观”让 AI 创作，或在此处手动输入/粘贴你的设定...' : '内容将显示在这里... | Content will appear here...'}
                className="w-full h-full p-4 bg-transparent text-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-lg font-mono text-sm leading-relaxed"
                spellCheck="false"
                readOnly={isGeneratingChapter && activeContent === 'chapter'}
                />
            </div>
        </section>
      </main>
    </div>
  );
};

export default App;
