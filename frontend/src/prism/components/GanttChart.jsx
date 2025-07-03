// components/GanttChart.jsx
import React, { useEffect, useRef } from "react";
import Gantt from "frappe-gantt"; // or from CDN if needed
import '../styles/components/GanttChart.css';

const GanttChart = ({ rawTasks }) => {
    const ganttRef = useRef();

    const today = new Date().toISOString().slice(0, 10);

    const formatDate = (dateString) => {
        const [year, month, day] = dateString.split('-').map(Number);
        const localDate = new Date(year, month - 1, day); // JS months are 0-indexed
        return localDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusInfo = (customClass) => {
        switch (customClass) {
            case "actual-completed":
                return { text: "Completed", badgeClass: "status-completed" };
            case "planned-not-started":
                return { text: "Not Started", badgeClass: "status-not-started" };
            case "actual-in-progress":
                return { text: "In Progress", badgeClass: "status-in-progress" };
            case "actual":
                return { text: "In Progress", badgeClass: "status-in-progress" };
            case "planned":
                return { text: "Planned", badgeClass: "status-planned" };
            default:
                return { text: "Unknown", badgeClass: "" };
        }
    };

    useEffect(() => {
        if (!ganttRef.current) return;

        ganttRef.current.innerHTML = "";

        const tasks = rawTasks.map((t) => ({
            id: t.id,
            name: t.name,
            start: t.start,
            end: t.end || today,
            progress: t.progress || 0,
            dependencies: t.dependencies || "",
            custom_class: t.custom_class,
        }));

        new Gantt(ganttRef.current, tasks, {
            view_mode: "Day",
            date_format: "YYYY-MM-DD",
            popup_on: "hover",
            container_height: 500,
            infinite_padding: false,
            readonly_progress: true,
            bar_height: 33,
            readonly_dates: true,
            bar_corner_radius: 5,

            popup: function (popup_data) {
                const task = popup_data.task;
                const statusInfo = getStatusInfo(task.custom_class);
                const { text, badgeClass } = statusInfo;

                const showEnd = text !== "In Progress";
                const showStatus = text !== "Unknown";
                const endText = showEnd ? formatDate(task.end) : "N/A";

                return `
          <div class="popup-title">${task.name}</div>
          <div class="popup-details">
              <div>Start: ${formatDate(task.start)}</div>
              <div>End: ${endText}</div>
              ${showStatus && text !== 'Planned'
                        ? `<div style="margin-top: 7px;">
                        Status:
                        <span class="status-badge ${badgeClass}">${text}</span>
                    </div>`
                        : ``
                    }
          </div>`;
            },
        });
    }, [rawTasks]);

    return <div ref={ganttRef} id="gantt" />;
};

export default GanttChart;
