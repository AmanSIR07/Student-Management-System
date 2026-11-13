const STORAGE_KEY = "sms_students_data";

// State
let students = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let editingRollNo = null;

// DOM Elements
const studentForm = document.getElementById("studentForm");
const formTitle = document.getElementById("formTitle");
const rollNoInput = document.getElementById("rollNo");
const fullNameInput = document.getElementById("fullName");
const branchInput = document.getElementById("branch");
const semesterInput = document.getElementById("semester");
const cgpaInput = document.getElementById("cgpa");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const errorMsg = document.getElementById("errorMsg");

const tableBody = document.getElementById("studentTableBody");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const branchFilter = document.getElementById("branchFilter");
const exportBtn = document.getElementById("exportBtn");
const totalCountEl = document.getElementById("totalCount");
const avgCgpaEl = document.getElementById("avgCgpa");

// Save to LocalStorage
function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

// Render Table & Dashboard Stats
function renderTable() {
    const query = searchInput.value.trim().toLowerCase();
    const selectedBranch = branchFilter.value;

    const filteredStudents = students.filter(student => {
        const matchesSearch =
            student.rollNo.toLowerCase().includes(query) ||
            student.name.toLowerCase().includes(query);
        const matchesBranch =
            selectedBranch === "ALL" || student.branch === selectedBranch;
        return matchesSearch && matchesBranch;
    });

    tableBody.innerHTML = "";

    if (filteredStudents.length === 0) {
        emptyState.classList.remove("hidden");
    } else {
        emptyState.classList.add("hidden");
        filteredStudents.forEach(student => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><strong>${escapeHTML(student.rollNo)}</strong></td>
                <td>${escapeHTML(student.name)}</td>
                <td><span class="badge">${escapeHTML(student.branch)}</span></td>
                <td>${student.semester}</td>
                <td>${Number(student.cgpa).toFixed(2)}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="startEdit('${escapeHTML(student.rollNo)}')">Edit</button>
                    <button class="action-btn delete-btn" onclick="deleteStudent('${escapeHTML(student.rollNo)}')">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    updateStats();
}

// Update Header Statistics
function updateStats() {
    totalCountEl.textContent = students.length;
    if (students.length === 0) {
        avgCgpaEl.textContent = "0.00";
        return;
    }
    const totalCgpa = students.reduce((sum, s) => sum + Number(s.cgpa), 0);
    avgCgpaEl.textContent = (totalCgpa / students.length).toFixed(2);
}

// Handle Add / Update Form Submission
studentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    errorMsg.textContent = "";

    const rollNo = rollNoInput.value.trim().toUpperCase();
    const name = fullNameInput.value.trim();
    const branch = branchInput.value;
    const semester = parseInt(semesterInput.value, 10);
    const cgpa = parseFloat(cgpaInput.value);

    // Validation
    if (!rollNo || !name || !branch) {
        errorMsg.textContent = "Please fill out all required fields.";
        return;
    }

    if (editingRollNo) {
        // Update existing record
        const index = students.findIndex(s => s.rollNo === editingRollNo);
        if (index !== -1) {
            students[index] = { rollNo: editingRollNo, name, branch, semester, cgpa };
        }
        resetForm();
    } else {
        // Check duplicate Roll Number
        if (students.some(s => s.rollNo === rollNo)) {
            errorMsg.textContent = `Roll Number "${rollNo}" already exists.`;
            return;
        }
        students.push({ rollNo, name, branch, semester, cgpa });
        studentForm.reset();
    }

    saveToStorage();
    renderTable();
});

// Populate Form for Editing
window.startEdit = function(rollNo) {
    const student = students.find(s => s.rollNo === rollNo);
    if (!student) return;

    editingRollNo = rollNo;
    formTitle.textContent = "Edit Student Record";
    rollNoInput.value = student.rollNo;
    rollNoInput.disabled = true; // Lock primary key during edit
    fullNameInput.value = student.name;
    branchInput.value = student.branch;
    semesterInput.value = student.semester;
    cgpaInput.value = student.cgpa;

    submitBtn.textContent = "Update Student";
    cancelBtn.classList.remove("hidden");
    errorMsg.textContent = "";
};

// Delete Student Record
window.deleteStudent = function(rollNo) {
    if (!confirm(`Delete record for Roll Number ${rollNo}?`)) return;
    students = students.filter(s => s.rollNo !== rollNo);
    if (editingRollNo === rollNo) resetForm();
    saveToStorage();
    renderTable();
};

// Reset Form State
function resetForm() {
    editingRollNo = null;
    studentForm.reset();
    rollNoInput.disabled = false;
    formTitle.textContent = "Add New Student";
    submitBtn.textContent = "Add Student";
    cancelBtn.classList.add("hidden");
    errorMsg.textContent = "";
}

cancelBtn.addEventListener("click", resetForm);

// Live Search & Branch Filter
searchInput.addEventListener("input", renderTable);
branchFilter.addEventListener("change", renderTable);

// Export Records to CSV
exportBtn.addEventListener("click", () => {
    if (students.length === 0) {
        alert("No student records to export.");
        return;
    }

    const headers = ["Roll No", "Full Name", "Branch", "Semester", "CGPA"];
    const rows = students.map(s => [
        `"${s.rollNo}"`,
        `"${s.name.replace(/"/g, '""')}"`,
        `"${s.branch}"`,
        s.semester,
        Number(s.cgpa).toFixed(2)
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "students_records.csv";
    link.click();
    URL.revokeObjectURL(url);
});

// Prevent XSS when rendering user input
function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

// Initial Render
renderTable();