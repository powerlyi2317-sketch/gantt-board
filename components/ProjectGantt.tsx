"use client";

import React from "react";
import { Gantt, Task, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";

// 154kV 태양광 발전소 구축 프로젝트 공정표 데이터
const initialTasks: Task[] = [
  {
    id: "site",
    name: "부지 선정 및 인허가",
    type: "task",
    start: new Date(2026, 3, 1),
    end: new Date(2026, 3, 30),
    progress: 100,
    dependencies: [],
    styles: {
      progressColor: "#4f46e5",
      progressSelectedColor: "#4338ca",
      backgroundColor: "#c7d2fe",
      backgroundSelectedColor: "#a5b4fc",
    },
  },
  {
    id: "design-order",
    name: "설계 및 기자재 발주 (GIS, GIB 등 주요 설비 포함)",
    type: "task",
    start: new Date(2026, 4, 1),
    end: new Date(2026, 4, 31),
    progress: 72,
    dependencies: ["site"],
    styles: {
      progressColor: "#0d9488",
      progressSelectedColor: "#0f766e",
      backgroundColor: "#99f6e4",
      backgroundSelectedColor: "#5eead4",
    },
  },
  {
    id: "civil",
    name: "토목 및 구조물 공사",
    type: "task",
    start: new Date(2026, 5, 1),
    end: new Date(2026, 5, 30),
    progress: 48,
    dependencies: ["design-order"],
    styles: {
      progressColor: "#2563eb",
      progressSelectedColor: "#1d4ed8",
      backgroundColor: "#bfdbfe",
      backgroundSelectedColor: "#93c5fd",
    },
  },
  {
    id: "electrical",
    name: "전기 공사 (계통 연계)",
    type: "task",
    start: new Date(2026, 6, 1),
    end: new Date(2026, 6, 31),
    progress: 28,
    dependencies: ["civil"],
    styles: {
      progressColor: "#d97706",
      progressSelectedColor: "#b45309",
      backgroundColor: "#fde68a",
      backgroundSelectedColor: "#fcd34d",
    },
  },
  {
    id: "commissioning",
    name: "사용전 검사 및 상업 운전",
    type: "task",
    start: new Date(2026, 7, 1),
    end: new Date(2026, 7, 31),
    progress: 8,
    dependencies: ["electrical"],
    styles: {
      progressColor: "#7c3aed",
      progressSelectedColor: "#6d28d9",
      backgroundColor: "#ddd6fe",
      backgroundSelectedColor: "#c4b5fd",
    },
  }
];

export function ProjectGantt() {
  return (
    <div className="gantt-chart-root h-full w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
      <Gantt
        tasks={initialTasks}
        viewMode={ViewMode.Month}
        viewDate={new Date(2026, 5, 15)}
        locale="ko"
        listCellWidth="350px" 
        columnWidth={100}     
        rowHeight={75}        
        ganttHeight={650}     
        barCornerRadius={10}  
        barFill={85}          
        fontFamily="inherit"
        fontSize="15px"       
        todayColor="rgba(99, 102, 241, 0.1)"
        arrowColor="#94a3b8"
      />
    </div>
  );
}