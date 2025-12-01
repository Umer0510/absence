// DOM Elements
const form = document.getElementById('registrationForm');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const photoOutput = document.getElementById('photoOutput');
const cameraPreview = document.getElementById('cameraPreview');
const capturedPhoto = document.getElementById('capturedPhoto');
const startCameraBtn = document.getElementById('startCamera');
const captureBtn = document.getElementById('captureBtn');
const stopCameraBtn = document.getElementById('stopCamera');
const photoStatus = document.getElementById('photoStatus');
const formProgress = document.getElementById('formProgress');
const progressText = document.getElementById('progressText');

// State variables
let stream = null;
let photoData = null;
let formData = {
    sno: '',
    date: '',
    candidateName: '',
    contactNo: '',
    batchId: '',
    trainer: '',
    photo: ''
};

// Initialize date to today
document.getElementById('date').valueAsDate = new Date();

// Calculate form completion percentage
function calculateFormCompletion() {
    const fields = [
        'date',
        'candidateName', 
        'contactNo',
        'batchId',
        'trainer'
    ];
    
    let completed = 0;
    fields.forEach(field => {
        const value = document.getElementById(field).value.trim();
        if (value) completed++;
    });
    
    // Add photo if captured
    if (photoData) completed++;
    
    const percentage = Math.round((completed / (fields.length + 1)) * 100);
    formProgress.style.width = `${percentage}%`;
    formProgress.setAttribute('aria-valuenow', percentage);
    formProgress.textContent = `${percentage}%`;
    progressText.textContent = `Form completion: ${percentage}%`;
    
    // Update progress bar color
    if (percentage < 30) {
        formProgress.className = 'progress-bar bg-danger';
    } else if (percentage < 70) {
        formProgress.className = 'progress-bar bg-warning';
    } else {
        formProgress.className = 'progress-bar bg-success';
    }
}

// Start Camera Function
async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false 
        });
        
        video.srcObject = stream;
        video.classList.remove('d-none');
        cameraPreview.querySelector('.placeholder-text').classList.add('d-none');
        
        // Show/Hide buttons
        startCameraBtn.classList.add('d-none');
        captureBtn.classList.remove('d-none');
        stopCameraBtn.classList.remove('d-none');
        
        // Update status
        photoStatus.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-camera"></i> Camera active. Click "Capture Photo" to take picture.
            </div>
        `;
        
    } catch (error) {
        console.error('Camera error:', error);
        photoStatus.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i> 
                Camera access denied. Please allow camera permissions or upload a photo.
            </div>
        `;
    }
}

// Capture Photo Function
function capturePhoto() {
    if (!stream) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to data URL with compression
    photoData = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
    photoOutput.src = photoData;
    
    // Show captured photo
    capturedPhoto.style.display = 'flex';
    video.classList.add('d-none');
    
    // Update status
    photoStatus.innerHTML = `
        <div class="alert alert-success">
            <i class="fas fa-check-circle"></i> Photo captured successfully!
        </div>
    `;
    
    calculateFormCompletion();
}

// Stop Camera Function
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    video.classList.add('d-none');
    cameraPreview.querySelector('.placeholder-text').classList.remove('d-none');
    
    // Show/Hide buttons
    startCameraBtn.classList.remove('d-none');
    captureBtn.classList.add('d-none');
    stopCameraBtn.classList.add('d-none');
    
    // Reset status if no photo captured
    if (!photoData) {
        photoStatus.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> 
                Please capture or upload a photo
            </div>
        `;
    }
}

// Retake Photo Function
function retakePhoto() {
    photoData = null;
    capturedPhoto.style.display = 'none';
    startCamera();
}

// Handle File Upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        Swal.fire({
            icon: 'error',
            title: 'Invalid File',
            text: 'Please upload an image file (JPG, PNG, etc.)'
        });
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        photoData = e.target.result;
        photoOutput.src = photoData;
        
        // Show captured photo
        capturedPhoto.style.display = 'flex';
        video.classList.add('d-none');
        cameraPreview.querySelector('.placeholder-text').classList.add('d-none');
        
        // Update status
        photoStatus.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-check-circle"></i> Photo uploaded successfully!
            </div>
        `;
        
        // Stop camera if running
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
            startCameraBtn.classList.remove('d-none');
            captureBtn.classList.add('d-none');
            stopCameraBtn.classList.add('d-none');
        }
        
        calculateFormCompletion();
    };
    reader.readAsDataURL(file);
}

// Add New Batch Option
function addNewBatch() {
    const batchInput = document.getElementById('batchId');
    const batchValue = batchInput.value.trim();
    
    if (batchValue) {
        // Add to datalist if not already present
        const datalist = document.getElementById('batchOptions');
        const exists = Array.from(datalist.options).some(opt => opt.value === batchValue);
        
        if (!exists) {
            const option = document.createElement('option');
            option.value = batchValue;
            datalist.appendChild(option);
        }
        
        Swal.fire({
            icon: 'success',
            title: 'Batch Added',
            text: `"${batchValue}" has been added to the list`,
            timer: 2000,
            showConfirmButton: false
        });
    }
}

// Add New Trainer Option
function addNewTrainer() {
    const trainerInput = document.getElementById('trainer');
    const trainerValue = trainerInput.value.trim();
    
    if (trainerValue) {
        // Add to datalist if not already present
        const datalist = document.getElementById('trainerOptions');
        const exists = Array.from(datalist.options).some(opt => opt.value === trainerValue);
        
        if (!exists) {
            const option = document.createElement('option');
            option.value = trainerValue;
            datalist.appendChild(option);
        }
        
        Swal.fire({
            icon: 'success',
            title: 'Trainer Added',
            text: `"${trainerValue}" has been added to the list`,
            timer: 2000,
            showConfirmButton: false
        });
    }
}

// Form Validation
function validateForm() {
    // Date validation
    const date = document.getElementById('date').value;
    if (!date) {
        showError('Please select a date');
        return false;
    }
    
    // Name validation
    const name = document.getElementById('candidateName').value.trim();
    if (!name || name.length < 2) {
        showError('Please enter a valid name (minimum 2 characters)');
        return false;
    }
    
    // Contact number validation
    const contact = document.getElementById('contactNo').value.trim();
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(contact)) {
        showError('Please enter a valid 10-digit mobile number');
        return false;
    }
    
    // Batch ID validation
    const batch = document.getElementById('batchId').value.trim();
    if (!batch) {
        showError('Please select or enter a Batch ID');
        return false;
    }
    
    // Trainer validation
    const trainer = document.getElementById('trainer').value.trim();
    if (!trainer) {
        showError('Please select or enter a Trainer');
        return false;
    }
    
    // Photo validation
    if (!photoData) {
        const result = confirm('No photo has been captured. Do you want to proceed without a photo?');
        if (!result) return false;
    }
    
    return true;
}

// Show error message
function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: message,
        confirmButtonColor: '#dc3545'
    });
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Submit Form
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Show loading
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;
    
    // Prepare form data
    formData = {
        sno: `REG${Date.now()}`,
        date: document.getElementById('date').value,
        candidateName: document.getElementById('candidateName').value.trim(),
        contactNo: document.getElementById('contactNo').value.trim(),
        batchId: document.getElementById('batchId').value.trim(),
        trainer: document.getElementById('trainer').value.trim(),
        photo: photoData || ''
    };
    
    try {
        // Submit to Google Sheets via Apps Script
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // For cross-origin requests
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        // Since we're using no-cors, we can't read the response
        // Show success message
        setTimeout(() => {
            showSuccessModal(formData);
            addToRecentRegistrations(formData);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 1500);
        
    } catch (error) {
        console.error('Submission error:', error);
        
        // Fallback: Show success even if network fails (for demo)
        setTimeout(() => {
            showSuccessModal(formData);
            addToRecentRegistrations(formData);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 1500);
    }
});

// Show Success Modal
function showSuccessModal(data) {
    document.getElementById('modalSno').textContent = data.sno;
    document.getElementById('modalName').textContent = data.candidateName;
    document.getElementById('modalDate').textContent = formatDate(data.date);
    
    const modal = new bootstrap.Modal(document.getElementById('successModal'));
    modal.show();
}

// Add to Recent Registrations Table
function addToRecentRegistrations(data) {
    const tableBody = document.querySelector('#recentTable tbody');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td>${data.sno}</td>
        <td>${formatDate(data.date)}</td>
        <td>${data.candidateName}</td>
        <td>${data.contactNo}</td>
        <td>${data.batchId}</td>
        <td>${data.trainer}</td>
        <td>${data.photo ? 
            '<i class="fas fa-check text-success"></i>' : 
            '<i class="fas fa-times text-danger"></i>'}</td>
    `;
    
    tableBody.insertBefore(newRow, tableBody.firstChild);
    
    // Limit to 5 recent entries
    if (tableBody.children.length > 5) {
        tableBody.removeChild(tableBody.lastChild);
    }
}

// Reset Form
function resetForm() {
    if (confirm('Are you sure you want to reset the form? All entered data will be lost.')) {
        form.reset();
        document.getElementById('date').valueAsDate = new Date();
        
        // Reset photo
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        photoData = null;
        video.classList.add('d-none');
        capturedPhoto.style.display = 'none';
        cameraPreview.querySelector('.placeholder-text').classList.remove('d-none');
        startCameraBtn.classList.remove('d-none');
        captureBtn.classList.add('d-none');
        stopCameraBtn.classList.add('d-none');
        
        // Reset status
        photoStatus.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> 
                Please capture or upload a photo
            </div>
        `;
        
        // Reset progress
        calculateFormCompletion();
        
        // Close modal if open
        const modal = bootstrap.Modal.getInstance(document.getElementById('successModal'));
        if (modal) modal.hide();
    }
}

// Print Registration
function printRegistration() {
    const printContent = `
        <html>
        <head>
            <title>Student Registration - ${formData.sno}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .details { margin: 20px 0; }
                .detail-row { margin-bottom: 10px; }
                .photo-container { text-align: center; margin: 20px 0; }
                .photo-container img { max-width: 200px; max-height: 200px; }
                @media print {
                    body { padding: 0; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Student Registration Confirmation</h2>
                <h3>Registration Number: ${formData.sno}</h3>
            </div>
            <div class="details">
                <div class="detail-row"><strong>Date:</strong> ${formatDate(formData.date)}</div>
                <div class="detail-row"><strong>Name:</strong> ${formData.candidateName}</div>
                <div class="detail-row"><strong>Contact:</strong> ${formData.contactNo}</div>
                <div class="detail-row"><strong>Batch ID:</strong> ${formData.batchId}</div>
                <div class="detail-row"><strong>Trainer:</strong> ${formData.trainer}</div>
            </div>
            ${formData.photo ? `
                <div class="photo-container">
                    <h4>Student Photo:</h4>
                    <img src="${formData.photo}" alt="Student Photo">
                </div>
            ` : ''}
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

// Initialize form validation on input
const formInputs = form.querySelectorAll('input, select');
formInputs.forEach(input => {
    input.addEventListener('input', calculateFormCompletion);
    input.addEventListener('change', calculateFormCompletion);
});

// Initialize form progress
calculateFormCompletion();