document.addEventListener('DOMContentLoaded', function() {
    loadMeetingsFromLocalStorage();
    loadRoomCapacitiesFromLocalStorage();
});

document.getElementById('book-meeting').addEventListener('click', bookMeetingHandler);

document.getElementById('end-time').addEventListener('change', function() {
    const startTime = document.getElementById('start-time').value;
    const endTime = this.value;
    if (startTime && endTime) {
        const totalTime = calculateTotalTime(startTime, endTime);
        document.getElementById('total-time').value = totalTime;
    }
});

let isEditing = false;
let editingMeeting = null;

function bookMeetingHandler() {
    const room = document.getElementById('room').value;
    const date = document.getElementById('date').value;
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
    const totalTime = calculateTotalTime(startTime, endTime);

    if (validateForm(room, date, startTime, endTime)) {
        if (checkConflicts(room, date, startTime, endTime) || (isEditing && editingMeeting.room === room && editingMeeting.date === date && editingMeeting.startTime === startTime && editingMeeting.endTime === endTime)) {
            if (isEditing) {
                updateMeeting(editingMeeting, room, date, startTime, endTime, totalTime);
            } else {
                // Update room capacity
                updateRoomCapacity(room);

                // Add meeting to the list and local storage
                addMeetingToList(room, date, startTime, endTime, totalTime);
            }

            // Clear form fields and feedback
            document.getElementById('meeting-form').reset();
            document.getElementById('total-time').value = '';
            displayFeedback(isEditing ? 'Meeting successfully updated!' : 'Meeting successfully booked!', 'green');

            // Reset editing variables
            isEditing = false;
            editingMeeting = null;

            // Revert button text
            document.getElementById('book-meeting').textContent = 'Book Meeting';
        } else {
            displayFeedback('There is a conflict with an existing meeting.', 'red');
        }
    } else {
        displayFeedback('Please fill in all fields.', 'red');
    }
}

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

function updateRoomCapacity(room, increase = false) {
    const capacitySpan = document.getElementById(`${room}-capacity`);
    let capacity = parseInt(capacitySpan.textContent);
    if (increase) {
        capacitySpan.textContent = capacity + 1;
    } else if (capacity > 0) {
        capacitySpan.textContent = capacity - 1;
    } else {
        alert('No more capacity for this room.');
    }
    saveRoomCapacitiesToLocalStorage();
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
    listItem.innerHTML = `
        ${room.replace('-', ' ')} - ${date} - ${startTime} to ${endTime} (${totalTime})
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
    `;
    meetingList.appendChild(listItem);

    // Add event listeners to the new buttons
    listItem.querySelector('.edit-btn').addEventListener('click', function() {
        editMeeting(meeting, listItem);
    });
    listItem.querySelector('.delete-btn').addEventListener('click', function() {
        deleteMeeting(meeting, listItem);
    });
}

function loadMeetingsFromLocalStorage() {
    const meetings = getMeetingsFromLocalStorage();
    const meetingList = document.getElementById('meetings-list');
    meetings.forEach(meeting => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            ${meeting.room.replace('-', ' ')} - ${meeting.date} - ${meeting.startTime} to ${meeting.endTime} (${meeting.totalTime})
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        `;
        meetingList.appendChild(listItem);

        listItem.querySelector('.edit-btn').addEventListener('click', function() {
            editMeeting(meeting, listItem);
        });
        listItem.querySelector('.delete-btn').addEventListener('click', function() {
            deleteMeeting(meeting, listItem);
        });
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

function editMeeting(meeting, listItem) {
    document.getElementById('room').value = meeting.room;
    document.getElementById('date').value = meeting.date;
    document.getElementById('start-time').value = meeting.startTime;
    document.getElementById('end-time').value = meeting.endTime;
    document.getElementById('total-time').value = meeting.totalTime;

    // Remove the meeting from the list and local storage
    deleteMeeting(meeting, listItem, false);

    // Change the book meeting button text to "Save Changes"
    document.getElementById('book-meeting').textContent = 'Save Changes';

    // Set editing variables
    isEditing = true;
    editingMeeting = meeting;
}

function deleteMeeting(meeting, listItem, updateCapacity = true) {
    let meetings = getMeetingsFromLocalStorage();
    meetings = meetings.filter(m => !(m.room === meeting.room && m.date === meeting.date && m.startTime === meeting.startTime && m.endTime === meeting.endTime));
    localStorage.setItem('meetings', JSON.stringify(meetings));

    // Remove the meeting from the list
    listItem.remove();

    // Update room capacity
    if (updateCapacity) {
        updateRoomCapacity(meeting.room, true);
    }
}

function updateMeeting(oldMeeting, room, date, startTime, endTime, totalTime) {
    let meetings = getMeetingsFromLocalStorage();
    meetings = meetings.filter(m => !(m.room === oldMeeting.room && m.date === oldMeeting.date && m.startTime === oldMeeting.startTime && m.endTime === oldMeeting.endTime));
    meetings.push({
        room,
        date,
        startTime,
        endTime,
        totalTime
    });
    localStorage.setItem('meetings', JSON.stringify(meetings));

    // Update room capacities if room is changed
    if (oldMeeting.room !== room) {
        updateRoomCapacity(oldMeeting.room, true);
        updateRoomCapacity(room);
    }

    // Update the list item
    const meetingList = document.getElementById('meetings-list');
    meetingList.innerHTML = '';
    loadMeetingsFromLocalStorage();
}
