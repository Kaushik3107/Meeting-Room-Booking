document.addEventListener('DOMContentLoaded', function() {
    loadMeetingsFromLocalStorage();
    loadRoomCapacitiesFromLocalStorage();
});

document.getElementById('book-meeting').addEventListener('click', function() {
    const room = document.getElementById('room').value;
    const date = document.getElementById('date').value;
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
    const totalTime = calculateTotalTime(startTime, endTime);

    if (validateForm(room, date, startTime, endTime)) {
        if (checkConflicts(room, date, startTime, endTime)) {
            // Update room capacity
            updateRoomCapacity(room);

            // Add meeting to the list and local storage
            addMeetingToList(room, date, startTime, endTime, totalTime);

            // Clear form fields and feedback
            document.getElementById('meeting-form').reset();
            document.getElementById('total-time').value = '';
            displayFeedback('Meeting successfully booked!', 'green');

        } else {
            displayFeedback('There is a conflict with an existing meeting.', 'red');
        }
    } else {
        displayFeedback('Please fill in all fields.', 'red');
    }
});

document.getElementById('end-time').addEventListener('change', function() {
    const startTime = document.getElementById('start-time').value;
    const endTime = this.value;
    if (startTime && endTime) {
        const totalTime = calculateTotalTime(startTime, endTime);
        document.getElementById('total-time').value = totalTime;
    }
});

function validateForm(room, date, startTime, endTime) {
    return room && date && startTime && endTime;
}

function calculateTotalTime(start, end) {
    const startTime = new Date(`1970-01-01T${start}Z`);
    const endTime = new Date(`1970-01-01T${end}Z`);
    const diffMs = endTime - startTime;
    const diffMins = diffMs / 60000;

    return `${Math.floor(diffMins / 60)} hour(s) ${diffMins % 60} minute(s)`;
}

function updateRoomCapacity(room) {
    const capacitySpan = document.getElementById(`${room}-capacity`);
    let capacity = parseInt(capacitySpan.textContent);
    if (capacity > 0) {
        capacitySpan.textContent = capacity - 1;
        saveRoomCapacitiesToLocalStorage();
    } else {
        alert('No more capacity for this room.');
    }
}

function addMeetingToList(room, date, startTime, endTime, totalTime) {
    const meeting = {
        room,
        date,
        startTime,
        endTime,
        totalTime
    };

    const meetings = getMeetingsFromLocalStorage();
    meetings.push(meeting);
    localStorage.setItem('meetings', JSON.stringify(meetings));

    const meetingList = document.getElementById('meetings-list');
    const listItem = document.createElement('li');
    listItem.textContent = `${room.replace('-', ' ')} - ${date} - ${startTime} to ${endTime} (${totalTime})`;
    meetingList.appendChild(listItem);
}

function loadMeetingsFromLocalStorage() {
    const meetings = getMeetingsFromLocalStorage();
    const meetingList = document.getElementById('meetings-list');
    meetings.forEach(meeting => {
        const listItem = document.createElement('li');
        listItem.textContent = `${meeting.room.replace('-', ' ')} - ${meeting.date} - ${meeting.startTime} to ${meeting.endTime} (${meeting.totalTime})`;
        meetingList.appendChild(listItem);
    });
}

function getMeetingsFromLocalStorage() {
    return JSON.parse(localStorage.getItem('meetings')) || [];
}

function checkConflicts(room, date, startTime, endTime) {
    const meetings = getMeetingsFromLocalStorage();
    for (const meeting of meetings) {
        if (meeting.room === room && meeting.date === date && meeting.startTime < endTime && meeting.endTime > startTime) {
            return false;
        }
    }
    return true;
}

function displayFeedback(message, color) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.style.color = color;
    feedback.style.display = 'block';
    
    setTimeout(() => {
        feedback.style.display = 'none';
    }, 3000);
}

function saveRoomCapacitiesToLocalStorage() {
    const capacities = {
        'conference-room': document.getElementById('conference-room-capacity').textContent,
        'board-room': document.getElementById('board-room-capacity').textContent,
        'free-room': document.getElementById('free-room-capacity').textContent
    };
    localStorage.setItem('roomCapacities', JSON.stringify(capacities));
}

function loadRoomCapacitiesFromLocalStorage() {
    const capacities = JSON.parse(localStorage.getItem('roomCapacities')) || {
        'conference-room': '10',
        'board-room': '10',
        'free-room': '10'
    };

    document.getElementById('conference-room-capacity').textContent = capacities['conference-room'];
    document.getElementById('board-room-capacity').textContent = capacities['board-room'];
    document.getElementById('free-room-capacity').textContent = capacities['free-room'];
}
