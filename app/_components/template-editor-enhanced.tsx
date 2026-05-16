"use client";

import { Check, Palette, X, ChevronDown, ChevronUp, RefreshCw, Copy, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import type { TemplateConfig } from "../template-engine";

type TemplateEditorEnhancedProps = {
  template: TemplateConfig;
  open: boolean;
  onClose: () => void;
  onSave: (updated: TemplateConfig) => void;
  onDelete?: () => void;
  onClone?: (template: TemplateConfig) => void;
};

// 样式属性分类
type StyleCategory = {
  id: string;
  name: string;
  icon?: string;
  properties: string[];
  description?: string;
};

const STYLE_CATEGORIES: StyleCategory[] = [
  {
    id: "typography",
    name: "文字排版",
    properties: [
      "font-family", "font-size", "font-weight", "font-style", "line-height",
      "letter-spacing", "text-align", "text-decoration", "text-transform"
    ],
    description: "字体、大小、粗细、行高等"
  },
  {
    id: "color",
    name: "颜色",
    properties: [
      "color", "background-color", "background", "border-color", "outline-color"
    ],
    description: "文字、背景、边框颜色"
  },
  {
    id: "spacing",
    name: "间距",
    properties: [
      "margin", "margin-top", "margin-right", "margin-bottom", "margin-left",
      "padding", "padding-top", "padding-right", "padding-bottom", "padding-left"
    ],
    description: "外边距和内边距"
  },
  {
    id: "border",
    name: "边框",
    properties: [
      "border", "border-width", "border-style", "border-color", "border-radius",
      "border-top", "border-right", "border-bottom", "border-left", "outline"
    ],
    description: "边框样式、圆角等"
  },
  {
    id: "layout",
    name: "布局",
    properties: [
      "display", "position", "top", "right", "bottom", "left",
      "width", "height", "max-width", "max-height", "min-width", "min-height",
      "flex", "flex-direction", "flex-wrap", "justify-content", "align-items",
      "grid", "grid-template-columns", "grid-template-rows", "gap"
    ],
    description: "显示方式、定位、尺寸等"
  },
  {
    id: "effects",
    name: "效果",
    properties: [
      "box-shadow", "text-shadow", "opacity", "filter", "backdrop-filter",
      "transform", "transition", "animation", "cursor", "z-index"
    ],
    description: "阴影、透明度、动画等"
  },
  {
    id: "misc",
    name: "其他",
    properties: [
      "overflow", "overflow-x", "overflow-y", "white-space", "word-break",
      "word-wrap", "list-style", "list-style-type", "list-style-position",
      "table-layout", "border-collapse", "vertical-align", "object-fit"
    ],
    description: "溢出、换行、列表等"
  }
];

// 解析样式字符串为对象
function parseStyleString(styleStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!styleStr) return result;

  styleStr.split(";").forEach((decl) => {
    const trimmed = decl.trim();
    if (!trimmed) return;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) return;
    const prop = trimmed.slice(0, colonIdx).trim().toLowerCase();
    const val = trimmed.slice(colonIdx + 1).trim();
    if (prop && val) {
      result[prop] = val;
    }
  });

  return result;
}

// 构建样式字符串
function buildStyleString(styleObj: Record<string, string>): string {
  return Object.entries(styleObj)
    .filter(([_, value]) => value && value.trim())
    .map(([prop, value]) => `${prop}: ${value}`)
    .join("; ");
}

// 获取模板的所有样式部分
function getTemplateStyleSections(template: TemplateConfig): Array<{
  id: string;
  name: string;
  styleStr: string;
  styleObj: Record<string, string>;
}> {
  return [
    { id: "h1", name: "一级标题", styleStr: template.h1Style || "", styleObj: parseStyleString(template.h1Style || "") },
    { id: "h2", name: "二级标题", styleStr: template.h2Style || "", styleObj: parseStyleString(template.h2Style || "") },
    { id: "h3", name: "三级标题", styleStr: template.h3Style || "", styleObj: parseStyleString(template.h3Style || "") },
    { id: "p", name: "正文段落", styleStr: template.pStyle || "", styleObj: parseStyleString(template.pStyle || "") },
    { id: "blockquote", name: "引用", styleStr: template.blockquoteStyle || "", styleObj: parseStyleString(template.blockquoteStyle || "") },
    { id: "list", name: "列表", styleStr: template.listStyle || "", styleObj: parseStyleString(template.listStyle || "") },
    { id: "listItem", name: "列表项", styleStr: template.listItemStyle || "", styleObj: parseStyleString(template.listItemStyle || "") },
    { id: "strong", name: "加粗", styleStr: template.strongStyle || "", styleObj: parseStyleString(template.strongStyle || "") },
    { id: "em", name: "斜体", styleStr: template.emStyle || "", styleObj: parseStyleString(template.emStyle || "") },
    { id: "code", name: "代码", styleStr: template.codeBlockStyle || "", styleObj: parseStyleString(template.codeBlockStyle || "") },
    { id: "container", name: "容器", styleStr: template.containerStyle || "", styleObj: parseStyleString(template.containerStyle || "") },
    { id: "base", name: "基础样式", styleStr: template.baseStyle ? buildStyleString({ "color": template.baseStyle.color, "font-family": template.baseStyle.fontFamily }) : "", styleObj: { "color": template.baseStyle.color, "font-family": template.baseStyle.fontFamily } },
  ];
}

// 常见的CSS值建议
const CSS_VALUE_SUGGESTIONS: Record<string, string[]> = {
  "font-family": [
    "system-ui, -apple-system, sans-serif",
    "Arial, Helvetica, sans-serif",
    "Georgia, serif",
    "Monaco, Consolas, monospace",
    "'Microsoft YaHei', sans-serif"
  ],
  "font-size": ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"],
  "font-weight": ["normal", "bold", "100", "200", "300", "400", "500", "600", "700", "800", "900"],
  "color": ["#333333", "#666666", "#999999", "#000000", "#ffffff", "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57"],
  "background-color": ["#ffffff", "#f8f9fa", "#f1f2f6", "#e9ecef", "#dee2e6", "#adb5bd", "#6c757d"],
  "text-align": ["left", "center", "right", "justify"],
  "line-height": ["1", "1.2", "1.4", "1.5", "1.6", "1.8", "2"],
  "border-style": ["none", "solid", "dashed", "dotted", "double"],
  "display": ["block", "inline", "inline-block", "flex", "grid", "none"],
  "position": ["static", "relative", "absolute", "fixed", "sticky"],
};

export function TemplateEditorEnhanced({
  template,
  open,
  onClose,
  onSave,
  onDelete,
  onClone,
}: TemplateEditorEnhancedProps) {
  const [name, setName] = useState(template.name);
  const [desc, setDesc] = useState(template.desc);
  const [themeColor, setThemeColor] = useState(template.themeColor);
  const [bgColor, setBgColor] = useState(template.backgroundColor);
  const [activeSection, setActiveSection] = useState<string>("h1");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [styleHistory, setStyleHistory] = useState<Array<{section: string, old: string, new: string}>>([]);

  // 自动展开所有分类，让用户立即看到全部提取的属性
  useEffect(() => {
    if (open) {
      const allExpanded: Record<string, boolean> = {};
      STYLE_CATEGORIES.forEach(cat => { allExpanded[cat.id] = true; });
      setExpandedCategories(allExpanded);
    }
  }, [open, template.id]);

  if (!open) return null;

  const styleSections = getTemplateStyleSections(template);
  const activeSectionData = styleSections.find(s => s.id === activeSection) || styleSections[0];
  const activeStyleObj = activeSectionData.styleObj;

  const handleStyleChange = (property: string, value: string) => {
    const newStyleObj = { ...activeStyleObj };
    if (value.trim() === "") {
      delete newStyleObj[property];
    } else {
      newStyleObj[property] = value;
    }

    // 记录历史
    setStyleHistory(prev => [...prev.slice(-9), {
      section: activeSection,
      old: buildStyleString(activeStyleObj),
      new: buildStyleString(newStyleObj)
    }]);

    // 更新模板（保留左侧面板的本地状态变更，如 name/desc/themeColor/bgColor）
    const updatedTemplate = { ...template, name, desc, themeColor, backgroundColor: bgColor };
    const newStyleStr = buildStyleString(newStyleObj);
    
    switch (activeSection) {
      case "h1": updatedTemplate.h1Style = newStyleStr; break;
      case "h2": updatedTemplate.h2Style = newStyleStr; break;
      case "h3": updatedTemplate.h3Style = newStyleStr; break;
      case "p": updatedTemplate.pStyle = newStyleStr; break;
      case "blockquote": updatedTemplate.blockquoteStyle = newStyleStr; break;
      case "list": updatedTemplate.listStyle = newStyleStr; break;
      case "listItem": updatedTemplate.listItemStyle = newStyleStr; break;
      case "strong": updatedTemplate.strongStyle = newStyleStr; break;
      case "em": updatedTemplate.emStyle = newStyleStr; break;
      case "code": updatedTemplate.codeBlockStyle = newStyleStr; break;
      case "container": updatedTemplate.containerStyle = newStyleStr; break;
      case "base": updatedTemplate.baseStyle = {
        color: newStyleObj.color || template.baseStyle.color,
        fontFamily: newStyleObj["font-family"] || template.baseStyle.fontFamily,
      }; break;
    }

    onSave(updatedTemplate);
  };

  const handleResetStyle = () => {
    if (confirm(`确定要重置 ${activeSectionData.name} 的所有样式吗？`)) {
      const updatedTemplate = { ...template };
      
      switch (activeSection) {
        case "h1": updatedTemplate.h1Style = ""; break;
        case "h2": updatedTemplate.h2Style = ""; break;
        case "h3": updatedTemplate.h3Style = ""; break;
        case "p": updatedTemplate.pStyle = ""; break;
        case "blockquote": updatedTemplate.blockquoteStyle = ""; break;
        case "list": updatedTemplate.listStyle = ""; break;
        case "listItem": updatedTemplate.listItemStyle = ""; break;
        case "strong": updatedTemplate.strongStyle = ""; break;
        case "em": updatedTemplate.emStyle = ""; break;
        case "code": updatedTemplate.codeBlockStyle = ""; break;
        case "container": updatedTemplate.containerStyle = ""; break;
        case "base": updatedTemplate.baseStyle = {
          color: "#374151",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }; break;
      }

      onSave(updatedTemplate);
    }
  };

  const handleCopyStyle = (sourceSection: string) => {
    const sourceData = styleSections.find(s => s.id === sourceSection);
    if (!sourceData) return;

    const updatedTemplate = { ...template };
    const newStyleStr = sourceData.styleStr;
    
    switch (activeSection) {
      case "h1": updatedTemplate.h1Style = newStyleStr; break;
      case "h2": updatedTemplate.h2Style = newStyleStr; break;
      case "h3": updatedTemplate.h3Style = newStyleStr; break;
      case "p": updatedTemplate.pStyle = newStyleStr; break;
      case "blockquote": updatedTemplate.blockquoteStyle = newStyleStr; break;
      case "list": updatedTemplate.listStyle = newStyleStr; break;
      case "listItem": updatedTemplate.listItemStyle = newStyleStr; break;
      case "strong": updatedTemplate.strongStyle = newStyleStr; break;
      case "em": updatedTemplate.emStyle = newStyleStr; break;
      case "code": updatedTemplate.codeBlockStyle = newStyleStr; break;
      case "container": updatedTemplate.containerStyle = newStyleStr; break;
      case "base": updatedTemplate.baseStyle = {
        color: sourceData.styleObj.color || template.baseStyle.color,
        fontFamily: sourceData.styleObj["font-family"] || template.baseStyle.fontFamily,
      }; break;
    }

    onSave(updatedTemplate);
  };

  const handleSave = () => {
    const updated = {
      ...template,
      name,
      desc,
      themeColor,
      backgroundColor: bgColor,
    };
    onSave(updated);
    onClose();
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="neo-strip px-5 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-base font-semibold text-(--neo-ink) flex items-center gap-2 uppercase">
            <Palette className="w-4 h-4" />
            高级模板编辑器
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="neo-button neo-button-ghost p-1.5"
              title="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧：样式部分导航 */}
          <div className="w-48 border-r border-(--neo-line) bg-(--neo-surface) overflow-y-auto p-4 space-y-2">
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-(--neo-ink) uppercase tracking-wider">基本信息</h3>
              <div className="space-y-2 p-2 border border-(--neo-line) rounded">
                <div className="space-y-1">
                  <label className="text-xs text-(--neo-ink)/60">名称</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-8 px-2 border border-(--neo-line) bg-transparent text-xs font-bold text-(--neo-ink) focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-(--neo-ink)/60">描述</label>
                  <input
                    type="text"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full h-8 px-2 border border-(--neo-line) bg-transparent text-xs text-(--neo-ink) focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-(--neo-ink)/60">主题色</label>
                    <input
                      type="color"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="w-full h-8 p-0 border border-(--neo-line) cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-(--neo-ink)/60">背景色</label>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-full h-8 p-0 border border-(--neo-line) cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-(--neo-ink) uppercase tracking-wider">样式部分</h3>
              <div className="space-y-1">
                {styleSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 text-xs rounded transition-colors ${
                      activeSection === section.id
                        ? "bg-(--neo-blue) text-white"
                        : "hover:bg-(--neo-line) text-(--neo-ink)"
                    }`}
                  >
                    <div className="font-medium">{section.name}</div>
                    <div className="text-(--neo-ink)/60 truncate text-[10px]">
                      {Object.keys(section.styleObj).length} 个属性
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-(--neo-ink) uppercase tracking-wider">操作</h3>
              <div className="space-y-1">
                <button
                  onClick={handleResetStyle}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-(--neo-red) hover:bg-(--neo-red)/10 rounded"
                >
                  <RefreshCw className="w-3 h-3" />
                  重置当前样式
                </button>
                {onClone && (
                  <button
                    onClick={() => onClone(template)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-(--neo-blue) hover:bg-(--neo-blue)/10 rounded"
                  >
                    <Copy className="w-3 h-3" />
                    克隆模板
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={onDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-(--neo-red) hover:bg-(--neo-red)/10 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                    删除模板
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 中间：样式属性编辑 */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-(--neo-ink)">
                  {activeSectionData.name} 样式
                </h3>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-(--neo-ink)/60">
                    {Object.keys(activeStyleObj).length} 个属性
                  </div>
                  <div className="text-xs text-(--neo-green) bg-(--neo-green)/10 px-2 py-1 rounded">
                    实时预览
                  </div>
                </div>
              </div>

              {/* 样式复制快捷菜单 */}
              <div className="flex flex-wrap gap-1 mb-4">
                <span className="text-xs text-(--neo-ink)/60 mr-2">快速复制：</span>
                {styleSections
                  .filter(s => s.id !== activeSection)
                  .map(source => (
                    <button
                      key={source.id}
                      onClick={() => handleCopyStyle(source.id)}
                      className="text-xs px-2 py-1 bg-(--neo-line) hover:bg-(--neo-line)/80 text-(--neo-ink) rounded"
                    >
                      从 {source.name}
                    </button>
                  ))}
              </div>

              {/* 样式预览 */}
              <div className="mb-4 p-3 border border-(--neo-line) rounded bg-(--neo-surface)">
                <div className="text-xs text-(--neo-ink)/60 mb-1">样式预览：</div>
                <div
                  className="p-3 rounded border border-(--neo-line) bg-white"
                  style={activeSectionData.styleObj}
                >
                  {activeSection === "h1" && "一级标题预览"}
                  {activeSection === "h2" && "二级标题预览"}
                  {activeSection === "h3" && "三级标题预览"}
                  {activeSection === "p" && "这是一段正文预览，展示当前设置的文字样式效果。"}
                  {activeSection === "blockquote" && "这是一段引用内容的预览"}
                  {activeSection === "list" && (
                    <ul style={{ margin: 0, padding: "0 0 0 20px" }}>
                      <li>列表项1</li>
                      <li>列表项2</li>
                    </ul>
                  )}
                  {activeSection === "listItem" && "列表项预览"}
                  {activeSection === "strong" && "加粗文本预览"}
                  {activeSection === "em" && "斜体文本预览"}
                  {activeSection === "code" && "代码块预览"}
                  {activeSection === "container" && "容器样式预览"}
                  {activeSection === "base" && "基础样式预览"}
                </div>
                <div className="mt-2 text-xs text-(--neo-ink)/60 font-mono break-all">
                  {activeSectionData.styleStr || "无样式"}
                </div>
              </div>

              {/* ✳️ 已提取所有属性概览 */}
              <div className="border-2 border-(--neo-green) bg-(--neo-green)/5 rounded p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-(--neo-green) uppercase tracking-wider">
                    ✓ 已提取 {Object.keys(activeStyleObj).length} 个属性
                  </span>
                  <span className="text-xs text-(--neo-ink)/60 font-mono">
                    {activeSectionData.name}
                  </span>
                </div>
                {Object.keys(activeStyleObj).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(activeStyleObj).map(([prop, val]) => (
                      <span
                        key={prop}
                        className="text-xs px-2 py-1 bg-(--neo-line) text-(--neo-ink) rounded font-mono"
                        title={`${prop}: ${val}`}
                      >
                        <span className="font-medium">{prop}</span>: {val}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-(--neo-orange) italic">
                    无提取的样式属性（将使用默认值）
                  </div>
                )}
              </div>

              {/* 属性分类编辑 */}
              <div className="space-y-4">
                {STYLE_CATEGORIES.map(category => (
                  <div key={category.id} className="border border-(--neo-line) rounded">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-(--neo-surface) hover:bg-(--neo-surface)/80"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-(--neo-ink)">{category.name}</span>
                        <span className="text-xs text-(--neo-ink)/60">{category.description}</span>
                      </div>
                      {expandedCategories[category.id] ? (
                        <ChevronUp className="w-3 h-3 text-(--neo-ink)/60" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-(--neo-ink)/60" />
                      )}
                    </button>
                    
                    {expandedCategories[category.id] && (
                      <div className="p-3 space-y-3">
                        {category.properties.map(property => {
                          const currentValue = activeStyleObj[property] || "";
                          const suggestions = CSS_VALUE_SUGGESTIONS[property] || [];
                          
                          return (
                            <div key={property} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-(--neo-ink) flex-1">
                                  <span className="font-mono">{property}</span>
                                </label>
                                {currentValue && (
                                  <button
                                    onClick={() => handleStyleChange(property, "")}
                                    className="text-xs text-(--neo-red) hover:text-(--neo-red)/80"
                                  >
                                    清除
                                  </button>
                                )}
                              </div>
                              
                              <input
                                type="text"
                                value={currentValue}
                                onChange={(e) => handleStyleChange(property, e.target.value)}
                                placeholder="输入CSS值..."
                                className="w-full h-8 px-2 border border-(--neo-line) bg-transparent text-xs text-(--neo-ink) focus:outline-none focus:border-(--neo-blue)"
                              />
                              
                              {suggestions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {suggestions.map(suggestion => (
                                    <button
                                      key={suggestion}
                                      onClick={() => handleStyleChange(property, suggestion)}
                                      className="text-xs px-2 py-1 bg-(--neo-line) hover:bg-(--neo-line)/80 text-(--neo-ink) rounded"
                                    >
                                      {suggestion}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {/* 自定义属性 */}
                <div className="border border-(--neo-line) rounded">
                  <div className="px-3 py-2 bg-(--neo-surface)">
                    <span className="text-xs font-semibold text-(--neo-ink)">自定义属性</span>
                  </div>
                  <div className="p-3">
                    <div className="space-y-2">
                      {Object.entries(activeStyleObj)
                        .filter(([prop]) => !STYLE_CATEGORIES.some(cat => cat.properties.includes(prop)))
                        .map(([property, value]) => (
                          <div key={property} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={property}
                              readOnly
                              className="w-32 h-8 px-2 border border-(--neo-line) bg-(--neo-surface) text-xs font-mono text-(--neo-ink)/60"
                            />
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => handleStyleChange(property, e.target.value)}
                              className="flex-1 h-8 px-2 border border-(--neo-line) bg-transparent text-xs text-(--neo-ink)"
                            />
                            <button
                              onClick={() => handleStyleChange(property, "")}
                              className="h-8 px-2 text-xs text-(--neo-red) hover:bg-(--neo-red)/10"
                            >
                              删除
                            </button>
                          </div>
                        ))}
                    </div>
                    
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          const newProp = prompt("请输入新的CSS属性名（如: custom-prop）:");
                          if (newProp && newProp.trim()) {
                            handleStyleChange(newProp.trim(), "值");
                          }
                        }}
                        className="text-xs px-3 py-2 border border-(--neo-line) hover:bg-(--neo-line) text-(--neo-ink) rounded"
                      >
                        + 添加自定义属性
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：样式历史 */}
          <div className="w-64 border-l border-(--neo-line) bg-(--neo-surface) overflow-y-auto p-4">
            <h3 className="text-xs font-semibold text-(--neo-ink) uppercase tracking-wider mb-3">样式历史</h3>
            <div className="space-y-2">
              {styleHistory.length === 0 ? (
                <div className="text-xs text-(--neo-ink)/60 italic">暂无修改历史</div>
              ) : (
                styleHistory.slice().reverse().map((item, index) => {
                  const section = styleSections.find(s => s.id === item.section);
                  return (
                    <div key={index} className="p-2 border border-(--neo-line) rounded">
                      <div className="text-xs font-medium text-(--neo-ink)">
                        {section?.name || item.section}
                      </div>
                      <div className="text-xs text-(--neo-green) mt-1">修改前 → 修改后</div>
                      <div className="text-xs text-(--neo-ink)/60 font-mono truncate" title={item.old}>
                        {item.old || "无样式"}
                      </div>
                      <div className="text-xs text-(--neo-ink)/60 font-mono truncate" title={item.new}>
                        {item.new || "无样式"}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="neo-strip px-5 py-4 flex items-center justify-between shrink-0">
          <div className="text-xs text-(--neo-ink)/60">
            正在编辑: {activeSectionData.name} · 共 {Object.keys(activeStyleObj).length} 个属性
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="neo-button neo-button-ghost h-9 px-4 text-xs"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="neo-button h-9 px-4 text-xs flex items-center gap-2"
            >
              <Check className="w-3 h-3" />
              保存模板
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}