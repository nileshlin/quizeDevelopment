"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const bootstrap = __importStar(require("bootstrap"));
// TIME CHANGES
document.addEventListener("DOMContentLoaded", function () {
    // Function to format the date
    function formatDate(date) {
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const day = date.getDate();
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        return monthNames[monthIndex] + ' ' + day + ', ' + year;
    }
    function formatTime(date) {
        let hours = date.getHours();
        let minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = checkTime(minutes);
        return hours + ':' + minutes + ' ' + ampm;
    }
    function checkTime(i) {
        if (i < 10) {
            i = "0" + i;
        }
        return i;
    }
    function updateDateTime() {
        const now = new Date();
        // Update the content of the elements with class 'currentDate'
        const dateElements = document.querySelectorAll('.currentDate');
        dateElements.forEach(element => {
            element.textContent = formatDate(now); // Assuming you have a formatDate function similar to formatTime
        });
        // Update the content of the elements with class 'currentTime'
        const timeElements = document.querySelectorAll('.currentTime');
        timeElements.forEach(element => {
            element.textContent = formatTime(now);
        });
        setTimeout(updateDateTime, 1000);
    }
    // Call the function to start the update loop
    updateDateTime();
});
// END TIME CHANGES
document.addEventListener('DOMContentLoaded', function () {
    const currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    const calendarDates = document.getElementById('calendar-dates');
    const currentMonthElement = document.getElementById('current-month');
    // Sample JSON structure for events
    const events = {
        '2023-10-03': 'Teachserv Meeting',
        '2023-10-06': 'Meeting with Ryan',
        '2023-10-15': 'Meeting with Ryan',
        '2023-10-26': 'Meeting with Ryan',
        '2023-10-27': 'Meetings with team leads',
        // Add more events as needed
    };
    function generateCalendar() {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        currentMonthElement.textContent =
            firstDay.toLocaleString('default', { month: 'long' }) + ' ' + currentYear;
        calendarDates.innerHTML = '';
        // Add padding for days before the first day of the month
        for (let i = 0; i < firstDay.getDay(); i++) {
            const paddingElement = document.createElement('div');
            paddingElement.classList.add('calendar-day', 'inactive');
            calendarDates.appendChild(paddingElement);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const dateElement = document.createElement('div');
            dateElement.classList.add('calendar-day');
            dateElement.textContent = day.toString();
            // Check if there's an event for this day
            const eventDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (events[eventDate]) {
                const eventElement = document.createElement('div');
                eventElement.classList.add('calendar-event');
                dateElement.appendChild(eventElement);
                // Add an event listener to show the modal on click
                dateElement.addEventListener('click', () => showEventModal(events[eventDate]));
            }
            calendarDates.appendChild(dateElement);
        }
    }
    function showPreviousMonth() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        generateCalendar();
    }
    function showNextMonth() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        generateCalendar();
    }
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    prevMonthButton.addEventListener('click', showPreviousMonth);
    nextMonthButton.addEventListener('click', showNextMonth);
    generateCalendar();
    // if click #close-quiz button, then hide #myDIV
    // const closeQuiz = document.getElementById('close-quiz');
    // const quiz = document.getElementById('myDIV'); 
    // closeQuiz.addEventListener('click', function () {
    //   quiz.style.display = 'none';
    // }
    // );
    const modalElement = document.getElementById('eventModal');
    const modalContentElement = document.getElementById('eventModalContent');
    function showEventModal(content) {
        if (!modalElement || !modalContentElement) {
            console.error("Modal elements not found");
            return;
        }
        const modal = new bootstrap.Modal(modalElement);
        modalContentElement.textContent = content;
        modal.show();
    }
    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.calendar-day .calendar-event').forEach(eventDay => {
            var _a;
            (_a = eventDay.parentElement) === null || _a === void 0 ? void 0 : _a.addEventListener('click', function () {
                const content = "Your event details here"; // Replace with actual event details
                showEventModal(content);
            });
        });
    });
    const transcriptContainer = document.getElementById("transcript-container");
    // Load highlighted text from localStorage on page load
    const savedHighlight = localStorage.getItem("highlighted_text");
    if (!transcriptContainer) {
        console.error("Unable to find transcript-container.");
    }
    else {
        if (savedHighlight) {
            transcriptContainer.style.backgroundColor = savedHighlight;
        }
        transcriptContainer.addEventListener("mousedown", () => {
            // Apply the highlight color
            transcriptContainer.style.backgroundColor = '#ffff00';
            // Save the highlighted text to localStorage
            localStorage.setItem("highlighted_text", '#ffff00');
        });
    }
});
// ********** VUE CODE **********
// ******************************
// ******************************
//# sourceMappingURL=dbfunctions.js.map