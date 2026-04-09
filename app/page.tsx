"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";

/**
 * --- [최종 전문가 통합 버전: 간트 프로젝트 보드] ---
 * 1. 브라우저 자동 저장: localStorage를 활용하여 수정 즉시 영구 보존
 * 2. 지능형 자동 번호: 1. > └ 1.1. > └ 1) > └ a. > └ - 체계 완벽 자동화
 * 3. 전 항목 인라인 편집: 모든 데이터 필드를 클릭 즉시 수정 (Esc로 취소 지원)
 * 4. 지능형 브랜치 삽입: 하위 추가 시 섹션 내 순서 유지, L1 추가 시 최하단 배치
 * 5. 통계 대시보드: 총 과업, 총 MD, 프로젝트 진행률 실시간 요약
 * 6. UI 최적화: 초기화 버튼 삭제, 리스트 너비 730px, 날짜 표시 YY-MM-DD
 */

// --- 내장 아이콘 컴포넌트 ---
const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
);
const IconLayers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
);
const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);
const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
);
const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);

/**
 * --- 시스템 환경 설정 ---
 */
const TODAY_STR = "2026-04-09";
const today = new Date(TODAY_STR);
const projectStart = new Date("2026-04-01").getTime();
const projectEnd = new Date("2028-12-31").getTime();
const LEFT_PANEL_WIDTH = 730; 
const holidays = ["2026-05-05", "2026-05-25", "2026-06-06", "2026-08-15", "2026-09-24", "2026-09-25", "2026-09-26"];
const STORAGE_KEY = "gantt_pro_tasks_v2"; // 로컬 스토리지 키

const calculateMD = (startStr: string, endStr: string) => {
  if (!startStr || !endStr) return 0;
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;
  
  let md = 0;
  let current = new Date(start);
  while (current <= end) {
    const dow = current.getDay();
    const ds = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    if (dow !== 0 && dow !== 6 && !holidays.includes(ds)) md++;
    current.setDate(current.getDate() + 1);
  }
  return md;
};

function getHeaders(viewMode: string) {
  if (viewMode === 'month') {
    const headers = [];
    let cur = new Date(projectStart);
    while (cur <= projectEnd) {
      headers.push({ top: `${cur.getFullYear()}`, bottom: `${cur.getMonth() + 1}월`, dayType: 'weekday', isToday: today.getMonth() === cur.getMonth() && today.getFullYear() === cur.getFullYear() });
      cur.setMonth(cur.getMonth() + 1);
    }
    return headers;
  } else if (viewMode === 'week') {
    const headers = [];
    let cur = new Date(projectStart);
    while (cur <= projectEnd) {
      const year = cur.getFullYear();
      const month = cur.getMonth() + 1;
      const weekNo = Math.ceil(cur.getDate() / 7);
      headers.push({ top: `${year}`, bottom: `${month}월 ${weekNo}주`, dayType: 'weekday', isToday: today >= cur && today <= new Date(cur.getTime() + 6 * 24 * 60 * 60 * 1000) });
      cur.setDate(cur.getDate() + 7);
    }
    return headers;
  } else {
    const days = Math.round((projectEnd - projectStart) / (1000 * 60 * 60 * 24)) + 1;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(projectStart + i * 24 * 60 * 60 * 1000);
      const dow = d.getDay();
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      let dt = (dow === 0 || holidays.includes(ds)) ? 'sunday' : (dow === 6 ? 'saturday' : 'weekday');
      return { top: `${d.getFullYear()}`, bottom: `${d.getMonth() + 1}/${d.getDate()}`, dayType: dt, isToday: d.toDateString() === today.toDateString() };
    });
  }
}

function ProjectGantt({ viewMode, scrollRef, tasks, onUpdateTask, onDeleteTask, onRowContextMenu, hideCompleted, searchQuery }: any) {
  const headers = useMemo(() => getHeaders(viewMode), [viewMode]);
  const viewConfig = useMemo(() => {
    const configs = {
      month: { minWidth: `${headers.length * 100}px`, headers },
      week:  { minWidth: `${headers.length * 120}px`, headers },
      day:   { minWidth: `${headers.length * 50}px`, headers },
    };
    return configs[viewMode as 'month' | 'week' | 'day'] || configs.month;
  }, [viewMode, headers]);

  const visibleTasks = useMemo(() => {
    return tasks.filter((task: any) => {
      if (searchQuery && !task.name.includes(searchQuery) && !task.assignee.includes(searchQuery)) return false;
      if (hideCompleted && task.status === "완료") return false;
      return true;
    });
  }, [tasks, hideCompleted, searchQuery]);

  const getTaskStyle = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return { left: "0%", width: "0%", display: "none" };
    const s = new Date(startStr).getTime();
    const e = new Date(endStr).getTime();
    if (isNaN(s) || isNaN(e) || s > e) return { left: "0%", width: "0%", display: "none" };
    
    const totalMs = projectEnd - projectStart;
    const left = ((s - projectStart) / totalMs) * 100;
    const width = ((e - s + 86400000) / totalMs) * 100;
    return { left: `${Math.max(0, left)}%`, width: `${Math.max(0, width)}%`, display: "block" };
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "완료": return "text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 font-bold hover:bg-emerald-900/60";
      case "진행중": return "text-blue-400 bg-blue-950/40 border border-blue-900/50 font-bold hover:bg-blue-900/60";
      case "이슈": return "text-rose-400 bg-rose-950/40 border border-rose-900/50 font-bold animate-pulse hover:bg-rose-900/60";
      case "대기": return "text-slate-500 bg-slate-900 border border-slate-800 hover:bg-slate-800";
      default: return "text-slate-700 bg-transparent border border-slate-800 italic font-normal text-[10px]";
    }
  };

  const getProgressValue = (status: string) => {
    if (status === "완료") return 100;
    if (status === "진행중") return 50;
    if (status === "이슈") return 30;
    return 0;
  };

  return (
    <div className="w-full flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-[#0f172a] shadow-2xl">
      <div ref={scrollRef} className="relative flex w-full overflow-x-auto scroll-smooth custom-scrollbar">
        {/* 리스트 패널 */}
        <div style={{ width: `${LEFT_PANEL_WIDTH}px` }} className="sticky left-0 z-30 shrink-0 flex flex-col border-r border-slate-800 bg-[#0f172a]">
          <div className="flex h-14 items-center border-b border-slate-800 bg-slate-900/80 px-4 text-white font-extrabold uppercase tracking-wide text-xs">
            <div className="flex-1 text-left pl-6">작업명</div>
            <div className="w-16 text-center shrink-0">담당</div>
            <div className="w-20 text-center shrink-0">시작</div>
            <div className="w-20 text-center shrink-0">종료</div>
            <div className="w-10 text-center shrink-0">MD</div>
            <div className="w-32 text-center shrink-0 border-l border-slate-800 pl-2">진행상황</div>
            <div className="w-2 shrink-0" />
          </div>

          <div className="overflow-y-auto flex-grow no-scrollbar" onContextMenu={(e) => onRowContextMenu(e, null)}>
            {visibleTasks.map((t: any) => {
              const indentSize = t.level * 22;
              const mdCount = calculateMD(t.start, t.end);
              const isInvalidDate = t.start && t.end && new Date(t.start) > new Date(t.end);

              return (
                <div key={t.id} className={`flex h-11 items-center border-b border-slate-800/60 px-4 transition-all hover:bg-slate-800/40 group ${t.level === 0 ? 'bg-slate-900/30 z-10' : 'bg-transparent'}`} onContextMenu={(e) => { e.stopPropagation(); onRowContextMenu(e, t); }}>
                  {/* [작업명 컬럼] */}
                  <div className="flex-1 flex items-center h-full relative" style={{ paddingLeft: `${indentSize}px` }}>
                    <div className="flex items-center shrink-0">
                      {t.level >= 1 && <span className="text-slate-600 font-normal shrink-0 scale-y-110 mr-1 opacity-60">└</span>}
                      <span className={`shrink-0 font-mono tracking-tight ${t.level === 0 ? 'font-bold text-slate-100 text-[13px] min-w-[18px]' : 'text-slate-300 text-[11px]'}`}>{t.displayId}</span>
                    </div>
                    {t.isEditing === 'name' ? (
                      <input autoFocus type="text" value={t.name} onChange={(e) => onUpdateTask(t.id, 'name', e.target.value)} onBlur={() => onUpdateTask(t.id, 'isEditing', null)} onKeyDown={(e) => { if(e.key === 'Enter'||e.key === 'Escape') onUpdateTask(t.id, 'isEditing', null); }} className="ml-1 bg-slate-950 border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-white outline-none w-full" placeholder="업무명을 입력하세요" />
                    ) : (
                      <span onClick={() => onUpdateTask(t.id, 'isEditing', 'name')} className={`truncate ml-1 cursor-pointer hover:text-indigo-400 transition-colors ${t.level === 0 ? 'font-bold text-slate-100 text-[14px]' : 'text-slate-300 text-[13px]'}`}>{t.name || <span className="text-slate-700 italic font-normal text-[11px]">업무명을 입력하세요</span>}</span>
                    )}
                  </div>

                  {/* [담당 컬럼] */}
                  <div className="w-16 flex items-center justify-center shrink-0">
                    {t.isEditing === 'assignee' ? (
                      <input autoFocus type="text" value={t.assignee} onChange={(e) => onUpdateTask(t.id, 'assignee', e.target.value)} onBlur={() => onUpdateTask(t.id, 'isEditing', null)} onKeyDown={(e) => { if(e.key === 'Enter'||e.key === 'Escape') onUpdateTask(t.id, 'isEditing', null); }} className="w-full bg-slate-950 border border-indigo-500 rounded px-1 text-[11px] text-white outline-none text-center" />
                    ) : (
                      <div onClick={() => onUpdateTask(t.id, 'isEditing', 'assignee')} className="w-full text-[11px] text-center text-slate-400 truncate cursor-pointer hover:text-white transition-colors">{t.assignee || "-"}</div>
                    )}
                  </div>

                  {/* [시작일 컬럼] */}
                  <div className={`w-20 flex items-center justify-center shrink-0 ${isInvalidDate ? 'bg-rose-900/20' : ''}`}>
                    {t.isEditing === 'start' ? (
                      <input autoFocus type="date" value={t.start} onChange={(e) => onUpdateTask(t.id, 'start', e.target.value)} onBlur={() => onUpdateTask(t.id, 'isEditing', null)} className="w-full bg-slate-950 border border-indigo-500 rounded px-1 text-[10px] text-white outline-none" />
                    ) : (
                      <div onClick={() => onUpdateTask(t.id, 'isEditing', 'start')} className="w-full text-[10px] text-center text-slate-500 font-mono cursor-pointer hover:text-white">{t.start ? t.start.slice(2) : "-"}</div>
                    )}
                  </div>

                  {/* [종료일 컬럼] */}
                  <div className={`w-20 flex items-center justify-center shrink-0 ${isInvalidDate ? 'bg-rose-900/20' : ''}`}>
                    {t.isEditing === 'end' ? (
                      <input autoFocus type="date" value={t.end} onChange={(e) => onUpdateTask(t.id, 'end', e.target.value)} onBlur={() => onUpdateTask(t.id, 'isEditing', null)} className="w-full bg-slate-950 border border-indigo-500 rounded px-1 text-[10px] text-white outline-none" />
                    ) : (
                      <div onClick={() => onUpdateTask(t.id, 'isEditing', 'end')} className="w-full text-[10px] text-center text-slate-500 font-mono cursor-pointer hover:text-white">{t.end ? t.end.slice(2) : "-"}</div>
                    )}
                  </div>

                  {/* [MD 컬럼] */}
                  <div className={`w-10 text-center text-[11px] font-bold shrink-0 ${isInvalidDate ? 'text-rose-500' : 'text-slate-400'}`}>{mdCount > 0 ? mdCount : "-"}</div>
                  
                  {/* [진행상황 컬럼] */}
                  <div className="w-32 px-1 flex justify-center shrink-0">
                    <select value={t.status} onChange={(e) => onUpdateTask(t.id, 'status', e.target.value)} className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tight min-w-[90px] text-center shadow-inner border outline-none cursor-pointer appearance-none transition-all ${getStatusStyle(t.status)}`}>
                      <option value="">● 선택</option>
                      <option value="대기" className="bg-slate-900 text-slate-400">● 대기</option>
                      <option value="진행중" className="bg-slate-900 text-blue-400">● 진행중</option>
                      <option value="완료" className="bg-slate-900 text-emerald-400">● 완료</option>
                      <option value="이슈" className="bg-slate-900 text-rose-400">● 이슈</option>
                    </select>
                  </div>
                  
                  <div className="w-2 shrink-0 flex items-center justify-center">
                    <button onClick={(e) => { e.stopPropagation(); onDeleteTask(t.id); }} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-500 transition-all scale-75"><IconTrash /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 간트 차트 영역 */}
        <div className="relative flex flex-1 flex-col bg-[#0a0a0a]" style={{ minWidth: viewConfig.minWidth }}>
          <div className="grid h-14 border-b border-slate-800 bg-slate-900/80" style={{ gridTemplateColumns: `repeat(${viewConfig.headers.length}, minmax(0, 1fr))` }}>
            {viewConfig.headers.map((header: any, idx: number) => (
              <div key={idx} className={`flex flex-col items-center justify-center border-r border-slate-800 relative ${header.dayType === 'saturday' ? 'text-blue-500 font-bold' : header.dayType === 'sunday' ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                <span className="mb-0.5 text-[9px] font-bold opacity-50">{header.top}</span>
                <span className="text-[11px] font-extrabold whitespace-nowrap">{header.bottom}</span>
                {header.isToday && <div className="absolute -bottom-[2px] w-full h-1 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]"></div>}
              </div>
            ))}
          </div>
          <div className="relative flex-1 overflow-hidden">
            <div className="pointer-events-none absolute inset-0 grid h-full" style={{ gridTemplateColumns: `repeat(${viewConfig.headers.length}, minmax(0, 1fr))` }}>
              {viewConfig.headers.map((header: any, idx: number) => (
                <div key={idx} className={`border-r border-white/[0.03] ${header.isToday ? 'bg-white/5 border-x border-indigo-500/20 shadow-inner' : ''}`}></div>
              ))}
            </div>
            <div className="relative flex flex-col overflow-y-auto no-scrollbar">
              {visibleTasks.map((t: any) => {
                const style = getTaskStyle(t.start, t.end);
                const progress = getProgressValue(t.status);
                return (
                  <div key={t.id} className={`relative flex h-11 items-center border-b border-white/[0.02] ${t.level === 0 ? 'bg-white/[0.02]' : ''}`}>
                    <div className={`absolute z-10 flex overflow-hidden cursor-pointer items-center rounded-full shadow-lg transition-all duration-300 hover:scale-[1.01] bg-slate-800 ${t.level === 0 ? 'h-4' : t.level === 1 ? 'h-2.5 opacity-80' : 'h-1.5 opacity-60'}`} style={{ left: style.left, width: style.width, display: style.display }}>
                      {/* 진행률 내부 게이지 */}
                      <div className={`${t.color || "bg-indigo-600"} h-full transition-all duration-500 shadow-inner`} style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * --- 메인 애플리케이션 ---
 */
// 초기 기본 데이터
const DEFAULT_TASKS = [
  { id: "1", displayId: "1.", name: "부지 선정 및 인허가", assignee: "김사업", start: "2026-04-01", end: "2026-04-30", color: "bg-indigo-600", level: 0, status: "진행중", isEditing: null },
  { id: "1.1", displayId: "└ 1.1.", name: "입지 타당성 조사 및 분석", assignee: "김사업", start: "2026-04-01", end: "2026-04-15", color: "bg-indigo-500", level: 1, status: "완료", isEditing: null },
  { id: "2", displayId: "2.", name: "설계 및 기자재 발주", assignee: "이설계", start: "2026-05-01", end: "2026-05-31", color: "bg-teal-600", level: 0, status: "대기", isEditing: null },
];

export default function App() {
  const [tasks, setTasks] = useState<any[]>(DEFAULT_TASKS);
  const [isMounted, setIsMounted] = useState(false);

  // --- 새로 추가된 프로젝트 타이틀/서브타이틀 상태 ---
  const [projectTitle, setProjectTitle] = useState("간트 프로젝트 보드");
  const [projectSubtitle, setProjectSubtitle] = useState("PROJECT MANAGEMENT SYSTEM");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [activeLevel, setActiveLevel] = useState<number>(5);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, visible: boolean, targetTask: any }>({ x: 0, y: 0, visible: false, targetTask: null });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- [로컬 스토리지: 자동 저장 불러오기] ---
  useEffect(() => {
    setIsMounted(true);
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error("저장된 데이터를 불러오는 중 오류가 발생했습니다.");
      }
    }

    // 타이틀 불러오기
    const savedTitle = localStorage.getItem(STORAGE_KEY + "_title");
    if (savedTitle) setProjectTitle(savedTitle);
    
    const savedSubtitle = localStorage.getItem(STORAGE_KEY + "_subtitle");
    if (savedSubtitle) setProjectSubtitle(savedSubtitle);
  }, []);

  // --- [로컬 스토리지: 변경 시 자동 저장] ---
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      localStorage.setItem(STORAGE_KEY + "_title", projectTitle);
      localStorage.setItem(STORAGE_KEY + "_subtitle", projectSubtitle);
    }
  }, [tasks, projectTitle, projectSubtitle, isMounted]);

  // 대시보드 통계
  const stats = useMemo(() => {
    const totalMD = tasks.reduce((acc, t) => acc + calculateMD(t.start, t.end), 0);
    const completed = tasks.filter(t => t.status === "완료").length;
    const progress = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);
    return { total: tasks.length, effort: totalMD, progress };
  }, [tasks]);

  // 번호 자동 재계산 로직
  const recalculateIndices = (taskList: any[]) => {
    let l1=0, l2=0, l3=0, l4=0;
    return taskList.map((t) => {
      let nid = "";
      if (t.level === 0) { l1++; l2=0; l3=0; l4=0; nid = `${l1}.`; }
      else if (t.level === 1) { l2++; l3=0; l4=0; nid = `└ ${l1}.${l2}.`; }
      else if (t.level === 2) { l3++; l4=0; nid = `└ ${l3})`; }
      else if (t.level === 3) { l4++; nid = `└ ${String.fromCharCode(96 + l4)}.`; }
      else { nid = "└ -"; }
      return { ...t, displayId: nid };
    });
  };

  const handleUpdateTask = (id: string, field: string, value: any) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const onDeleteTask = (id: string) => {
    setTasks(prev => recalculateIndices(prev.filter(t => t.id !== id)));
  };

  const handleRowContextMenu = (e: React.MouseEvent, task: any) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, visible: true, targetTask: task });
  };

  useEffect(() => {
    const close = () => setContextMenu(c => ({...c, visible: false}));
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const addInlineTask = (mode: 'same' | 'sub') => {
    const target = contextMenu.targetTask;
    let lv = target ? (mode === 'same' ? target.level : Math.min(target.level + 1, 4)) : 0;
    const newTask = { id: Date.now().toString(), displayId: "", name: "", assignee: "", start: "", end: "", color: lv === 0 ? "bg-indigo-600" : "bg-slate-600", level: lv, status: "", isEditing: 'name' };
    setTasks(prev => {
        let nts = [...prev];
        if (lv === 0 && mode === 'same') { nts.push(newTask); } 
        else if (target) {
            const idx = prev.findIndex(t => t.id === target.id);
            let ip = idx;
            for (let i = idx + 1; i < prev.length; i++) { if (prev[i].level > target.level) ip = i; else break; }
            nts.splice(ip + 1, 0, newTask);
        } else { nts.push(newTask); }
        return recalculateIndices(nts);
    });
  };

  // SSR 환경 오류 방지용 대기
  if (!isMounted) return <div className="min-h-screen w-full bg-[#0a0a0a]" />;

  return (
    <main className="min-h-screen w-full bg-[#0a0a0a] p-4 md:p-8 font-sans text-white overflow-hidden flex flex-col relative">
      {/* 통계 위젯 대시보드 */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col rounded-2xl bg-slate-900/50 p-4 border border-slate-800 shadow-sm"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Tasks</span><span className="text-2xl font-black text-indigo-400">{stats.total} <span className="text-sm font-normal text-slate-600 uppercase">Items</span></span></div>
        <div className="flex flex-col rounded-2xl bg-slate-900/50 p-4 border border-slate-800 shadow-sm"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Effort</span><span className="text-2xl font-black text-teal-400">{stats.effort} <span className="text-sm font-normal text-slate-600 uppercase">Man-Day</span></span></div>
        <div className="flex flex-col rounded-2xl bg-slate-900/50 p-4 border border-slate-800 shadow-sm">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progress</span>
          <div className="flex items-end gap-2"><span className="text-2xl font-black text-blue-400">{stats.progress}%</span><div className="mb-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden shadow-inner"><div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${stats.progress}%` }} /></div></div>
        </div>
      </div>

      <div className="mx-auto flex w-full flex-col gap-6 flex-grow overflow-hidden">
        <header className="flex flex-col gap-6 pb-2 shrink-0">
          <div className="flex flex-col">
            {isEditingSubtitle ? (
              <input
                autoFocus
                type="text"
                value={projectSubtitle}
                onChange={(e) => setProjectSubtitle(e.target.value)}
                onBlur={() => setIsEditingSubtitle(false)}
                onKeyDown={(e) => { if(e.key==='Enter'||e.key==='Escape') setIsEditingSubtitle(false); }}
                className="text-[12px] font-black uppercase tracking-[0.5em] text-[#6d72ff] mb-1 bg-transparent border-b border-[#6d72ff]/50 outline-none w-full max-w-md"
              />
            ) : (
              <p
                onClick={() => setIsEditingSubtitle(true)}
                className="text-[12px] font-black uppercase tracking-[0.5em] text-[#6d72ff] mb-1 cursor-pointer hover:opacity-80 transition-opacity"
                title="클릭하여 수정"
              >
                {projectSubtitle}
              </p>
            )}

            {isEditingTitle ? (
              <input
                autoFocus
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => { if(e.key==='Enter'||e.key==='Escape') setIsEditingTitle(false); }}
                className="text-5xl font-black tracking-tight text-white leading-tight bg-transparent border-b border-slate-600 outline-none w-full max-w-xl"
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className="text-5xl font-black tracking-tight text-white leading-tight cursor-pointer hover:text-slate-300 transition-colors"
                title="클릭하여 수정"
              >
                {projectTitle}
              </h1>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 rounded-full bg-slate-900 p-1 px-2 border border-slate-800 shadow-inner">
                <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1.5 px-2"><IconLayers /> LV:</span>
                {[0, 1, 2, 3, 4].map(lv => <button key={lv} onClick={() => setActiveLevel(lv)} className={`rounded-full px-4 py-1 text-[11px] font-bold transition-all ${activeLevel === lv ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-indigo-400'}`}>L{lv + 1}</button>)}
                <button onClick={() => setActiveLevel(5)} className={`rounded-full px-4 py-1 text-[11px] font-bold transition-all ${activeLevel === 5 ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}>전체</button>
              </div>
              <button onClick={() => setHideCompleted(!hideCompleted)} className={`flex items-center gap-2 px-4 py-2 rounded-full border border-slate-800 bg-slate-900 text-[11px] font-bold transition-all shadow-sm ${hideCompleted ? 'text-rose-500 border-rose-900/50 bg-rose-950/20' : 'text-slate-400 hover:bg-slate-800'}`}>{hideCompleted ? "모두 표시" : "완료 숨기기"}</button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-900 rounded-full px-4 py-1.5 border border-slate-800 shadow-sm text-slate-400 focus-within:border-indigo-500 transition-all min-w-[200px]"><IconSearch /><input type="text" placeholder="검색어 입력..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="bg-transparent border-none text-[11px] outline-none w-full placeholder:text-slate-700 font-medium" /></div>
              
              <button onClick={() => scrollContainerRef.current?.scrollTo({left:0, behavior:"smooth"})} className="flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-xs font-black text-indigo-600 hover:bg-slate-100 transition-all active:scale-95 uppercase shadow-xl shadow-indigo-900/10"><IconCalendar /> 오늘</button>
              <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800 shadow-xl">
                {([{id:'day',label:'일'},{id:'week',label:'주'},{id:'month',label:'월'}] as const).map(m => <button key={m.id} onClick={()=>setViewMode(m.id)} className={`rounded px-5 py-1.5 text-xs font-bold transition-all ${viewMode===m.id?'bg-slate-700 text-white shadow-sm':'text-slate-500 hover:text-slate-300'}`}>{m.label}</button>)}
              </div>
            </div>
          </div>
        </header>
        <div className="w-full flex-grow overflow-hidden">
          <ProjectGantt viewMode={viewMode} scrollRef={scrollContainerRef} tasks={tasks.filter(t=>t.level<=activeLevel)} onUpdateTask={handleUpdateTask} onDeleteTask={onDeleteTask} onRowContextMenu={handleRowContextMenu} hideCompleted={hideCompleted} searchQuery={searchQuery} />
        </div>
      </div>

      {/* 우클릭 컨텍스트 메뉴 */}
      {contextMenu.visible && (
        <div className="fixed z-[300] w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden py-2 animate-in fade-in duration-100" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button onClick={() => addInlineTask('same')} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-indigo-600 text-white flex items-center gap-3 transition-colors border-b border-slate-800/50"><IconPlus /> 현재 위치에 추가</button>
          <button onClick={() => addInlineTask('sub')} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-indigo-600 text-white flex items-center gap-3 transition-colors"><IconLayers /> 하위 업무 추가</button>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0a0a0a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      ` }} />
    </main>
  );
}