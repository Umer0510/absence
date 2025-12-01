// Main Application Controller
class StudentRegistrationApp {
    constructor() {
        this.initializeElements();
        this.initializeState();
        this.initializeEventListeners();
        this.loadInitialData();
    }

    initializeElements() {
        // Form Elements
        this.form = document.getElementById('registrationForm');
        this.serialNoInput = document.getElementById('serialNo');
        this.dateInput = document.getElementById('date');
        this.candidateNameInput = document.getElementById('candidateName');
        this.contactNoInput = document.getElementById('contactNo');
        this.batchIdInput = document.getElementById('batchId');
        this.trainerInput = document.getElementById('trainer');
        
        // Camera Elements
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.photoOutput = document.getElementById('photoOutput');
        this.cameraPreview = document.getElementById('cameraPreview');
        this.capturedPhoto = document.getElementById('capturedPhoto');
        this.startCameraBtn = document.getElementById('startCamera');
        this.captureBtn = document.getElementById('captureBtn');
        this.stopCameraBtn = document.getElementById('stopCamera');
        this.fileInput = document.getElementById('fileInput');
        
        // Status Elements
        this.formProgress = document.getElementById('formProgress');
        this.progressText = document.getElementById('progressText');
        this.photoStatusText = document.getElementById('photoStatusText');
        this.photoStatus = document.getElementById('photoStatus');
        
        // Table Elements
        this.tableBody = document.getElementById('tableBody');
        this.tableLoader = document.getElementById('tableLoader');
        this.noData = document.getElementById('noData');
        
        // Filter Elements
        this.filterFromDate = document.getElementById('filterFromDate');
        this.filterToDate = document.getElementById('filterToDate');
        this.filterTrainer = document.getElementById('filterTrainer');
        this.filterBatch = document.getElementById('filterBatch');
        
        // Analytics Elements
        this.totalStudentsEl = document.getElementById('totalStudents');
        this.totalTrainersEl = document.getElementById('totalTrainers');
        this.totalBatchesEl = document.getElementById('totalBatches');
        this.todayRegistrationsEl = document.getElementById('todayRegistrations');
        
        // Modals
        this.successModal = new bootstrap.Modal(document.getElementById('successModal'));
        this.errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
        this.photoModal = new bootstrap.Modal(document.getElementById('photoModal'));
        
        // Charts
        this.batchChart = null;
        this.monthlyChart = null;
    }

    initializeState() {
        this.stream = null;
        this.photoData = null;
        this.isCameraActive = false;
        this.allRecords = [];
        this.filteredRecords = [];
        this.uniqueTrainers = new Set();
        this.uniqueBatches = new Set();
    }

    initializeEventListeners() {
        // Form Input Validation
        this.serialNoInput.addEventListener('input', (e) => this.validateSerialNo(e));
        this.contactNoInput.addEventListener('input', (e) => this.validateContactNo(e));
        this.contactNoInput.addEventListener('blur', () => this.validateContactNo());
        
        // Form Field Updates
        const formInputs = ['serialNo', 'date', 'candidateName', 'contactNo', 'batchId', 'trainer'];
        formInputs.forEach(field => {
            document.getElementById(field).addEventListener('input', () => this.updateFormCompletion());
        });

        // Form Submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Camera Events
        this.video.addEventListener('loadeddata', () => {
            this.startCameraBtn.style.display = 'none';
            this.captureBtn.style.display = 'block';
            this.stopCameraBtn.style.display = 'block';
        });

        // Filter Events
        this.filterFromDate.addEventListener('change', () => this.applyFilters());
        this.filterToDate.addEventListener('change', () => this.applyFilters());
        this.filterTrainer.addEventListener('change', () => this.applyFilters());
        this.filterBatch.addEventListener('change', () => this.applyFilters());

        // Tab Change Events
        document.getElementById('records-tab').addEventListener('click', () => this.loadRecords());
        document.getElementById('analytics-tab').addEventListener('click', () => this.updateAnalytics());
    }

    loadInitialData() {
        // Set today's date
        const today = new Date().toISOString().split('T')[0];
        this.dateInput.value = today;
        
        // Set default filter dates (current month)
        const firstDay = new Date();
        firstDay.setDate(1);
        this.filterFromDate.value = firstDay.toISOString().split('T')[0];
        this.filterToDate.value = today;
        
        // Load records from localStorage
        this.loadFromLocalStorage();
        
        // Initialize dropdowns
        this.updateFilterDropdowns();
        
        // Update form completion
        this.updateFormCompletion();
    }

    // =============== FORM VALIDATION ===============

    validateSerialNo(e) {
        const serialNo = e.target.value.trim();
        const errorEl = document.getElementById('serialError');
        
        if (!serialNo) {
            errorEl.classList.add('d-none');
            return;
        }

        // Check for duplicates
        const isDuplicate = this.allRecords.some(record => 
            record.serialNo.toLowerCase() === serialNo.toLowerCase()
        );

        if (isDuplicate) {
            errorEl.classList.remove('d-none');
            this.serialNoInput.classList.add('is-invalid');
            this.serialNoInput.classList.remove('is-valid');
        } else {
            errorEl.classList.add('d-none');
            this.serialNoInput.classList.remove('is-invalid');
            this.serialNoInput.classList.add('is-valid');
        }
        
        this.updateFormCompletion();
    }

    validateContactNo(e) {
        let value = e ? e.target.value : this.contactNoInput.value;
        
        // Remove non-numeric characters
        value = value.replace(/[^0-9]/g, '');
        
        // Limit to 10 digits
        if (value.length > 10) {
            value = value.substring(0, 10);
        }
        
        this.contactNoInput.value = value;
        
        const errorEl = document.getElementById('contactError');
        
        if (value.length === 10) {
            errorEl.classList.add('d-none');
            this.contactNoInput.classList.remove('is-invalid');
            this.contactNoInput.classList.add('is-valid');
            return true;
        } else if (value.length > 0) {
            errorEl.classList.remove('d-none');
            errorEl.textContent = 'Contact number must be exactly 10 digits';
            this.contactNoInput.classList.add('is-invalid');
            this.contactNoInput.classList.remove('is-valid');
            return false;
        } else {
            errorEl.classList.add('d-none');
            this.contactNoInput.classList.remove('is-invalid');
            this.contactNoInput.classList.remove('is-valid');
            return false;
        }
    }

    updateFormCompletion() {
        const fields = [
            this.serialNoInput,
            this.dateInput,
            this.candidateNameInput,
            this.contactNoInput,
            this.batchIdInput,
            this.trainerInput
        ];
        
        let completed = 0;
        fields.forEach(field => {
            if (field.value.trim()) completed++;
        });
        
        // Add photo if captured
        if (this.photoData) completed++;
        
        const percentage = Math.round((completed / (fields.length + 1)) * 100);
        
        this.formProgress.style.width = `${percentage}%`;
        this.formProgress.setAttribute('aria-valuenow', percentage);
        this.formProgress.textContent = `${percentage}%`;
        this.progressText.textContent = `Form completion: ${percentage}%`;
        
        // Update photo status text
        this.photoStatusText.textContent = this.photoData ? 
            'Photo: Captured ✓' : 'Photo: Not captured';
        
        // Update progress bar color
        if (percentage < 30) {
            this.formProgress.className = 'progress-bar progress-bar-striped progress-bar-animated bg-danger';
        } else if (percentage < 70) {
            this.formProgress.className = 'progress-bar progress-bar-striped progress-bar-animated bg-warning';
        } else if (percentage < 100) {
            this.formProgress.className = 'progress-bar progress-bar-striped progress-bar-animated bg-info';
        } else {
            this.formProgress.className = 'progress-bar progress-bar-striped progress-bar-animated bg-success';
        }
    }

    validateForm() {
        // Serial Number
        const serialNo = this.serialNoInput.value.trim();
        if (!serialNo) {
            this.showError('Please enter Serial Number');
            return false;
        }
        
        // Check for duplicate serial number
        const isDuplicate = this.allRecords.some(record => 
            record.serialNo.toLowerCase() === serialNo.toLowerCase()
        );
        
        if (isDuplicate) {
            this.showError('Serial Number already exists. Please use a different one.');
            return false;
        }
        
        // Date
        const date = this.dateInput.value;
        if (!date) {
            this.showError('Please select a date');
            return false;
        }
        
        // Name
        const name = this.candidateNameInput.value.trim();
        if (!name || name.length < 2) {
            this.showError('Please enter a valid name (minimum 2 characters)');
            return false;
        }
        
        // Contact Number
        if (!this.validateContactNo()) {
            this.showError('Please enter a valid 10-digit contact number');
            return false;
        }
        
        // Batch ID
        const batchId = this.batchIdInput.value.trim();
        if (!batchId) {
            this.showError('Please enter Batch ID');
            return false;
        }
        
        // Trainer
        const trainer = this.trainerInput.value.trim();
        if (!trainer) {
            this.showError('Please enter Trainer name');
            return false;
        }
        
        return true;
    }

    // =============== CAMERA FUNCTIONS ===============

    async startCamera() {
        try {
            // Stop if already active
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }
            
            // Get camera access
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false 
            });
            
            this.video.srcObject = this.stream;
            this.video.style.display = 'block';
            this.cameraPreview.querySelector('.placeholder-text').style.display = 'none';
            this.capturedPhoto.style.display = 'none';
            
            this.isCameraActive = true;
            
            this.updatePhotoStatus('Camera started. Click "Capture Photo" to take picture.', 'success');
            
        } catch (error) {
            console.error('Camera error:', error);
            this.updatePhotoStatus('Camera access denied. Please allow camera permissions or upload a photo.', 'error');
            
            // Fallback to file upload
            this.fileInput.click();
        }
    }

    capturePhoto() {
        if (!this.stream || !this.isCameraActive) return;
        
        // Set canvas dimensions
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        
        // Draw video frame to canvas
        const context = this.canvas.getContext('2d');
        context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        
        // Convert to data URL with compression
        this.photoData = this.canvas.toDataURL('image/jpeg', 0.7);
        
        // Display captured photo
        this.photoOutput.src = this.photoData;
        this.video.style.display = 'none';
        this.capturedPhoto.style.display = 'flex';
        
        // Stop camera
        this.stopCamera();
        
        this.updatePhotoStatus('Photo captured successfully!', 'success');
        this.updateFormCompletion();
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        this.video.style.display = 'none';
        this.cameraPreview.querySelector('.placeholder-text').style.display = 'block';
        this.startCameraBtn.style.display = 'block';
        this.captureBtn.style.display = 'none';
        this.stopCameraBtn.style.display = 'none';
        
        this.isCameraActive = false;
    }

    retakePhoto() {
        this.photoData = null;
        this.capturedPhoto.style.display = 'none';
        this.startCamera();
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file type
        if (!CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
            this.updatePhotoStatus('Please upload an image file (JPG, PNG, WEBP)', 'error');
            return;
        }
        
        // Validate file size
        if (file.size > CONFIG.MAX_PHOTO_SIZE) {
            this.updatePhotoStatus(`File size should be less than ${CONFIG.MAX_PHOTO_SIZE / (1024 * 1024)}MB`, 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.photoData = e.target.result;
            this.photoOutput.src = this.photoData;
            
            // Display photo
            this.capturedPhoto.style.display = 'flex';
            this.video.style.display = 'none';
            this.cameraPreview.querySelector('.placeholder-text').style.display = 'none';
            
            // Stop camera if active
            if (this.stream) {
                this.stopCamera();
            }
            
            this.updatePhotoStatus('Photo uploaded successfully!', 'success');
            this.updateFormCompletion();
        };
        reader.readAsDataURL(file);
    }

    updatePhotoStatus(message, type) {
        let icon, alertClass;
        
        switch(type) {
            case 'success':
                icon = 'check-circle';
                alertClass = 'alert-success';
                break;
            case 'error':
                icon = 'exclamation-triangle';
                alertClass = 'alert-danger';
                break;
            default:
                icon = 'info-circle';
                alertClass = 'alert-info';
        }
        
        this.photoStatus.innerHTML = `
            <div class="alert ${alertClass}">
                <i class="fas fa-${icon}"></i> ${message}
            </div>
        `;
    }

    // =============== FORM SUBMISSION ===============

    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) return;
        
        // Show loading
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitBtn.disabled = true;
        
        // Prepare data
        const formData = {
            serialNo: this.serialNoInput.value.trim(),
            date: this.dateInput.value,
            candidateName: this.candidateNameInput.value.trim(),
            contactNo: this.contactNoInput.value.trim(),
            batchId: this.batchIdInput.value.trim(),
            trainer: this.trainerInput.value.trim(),
            photo: this.photoData || '',
            timestamp: new Date().toISOString(),
            id: Date.now() // Unique ID for local storage
        };
        
        try {
            // Send to Google Sheets (if configured)
            if (CONFIG.GOOGLE_SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
                await this.sendToGoogleSheets(formData);
            }
            
            // Save to local storage
            this.saveToLocalStorage(formData);
            
            // Show success
            setTimeout(() => {
                this.showSuccessModal(formData);
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                // Reset form
                this.resetForm();
                
                // Reload data
                this.loadRecords();
                
            }, 1500);
            
        } catch (error) {
            console.error('Submission error:', error);
            this.showError('Failed to submit. Please try again.');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async sendToGoogleSheets(data) {
        try {
            const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Google Sheets submission failed:', error);
            // Continue with local storage as fallback
        }
    }

    // =============== LOCAL STORAGE ===============

    saveToLocalStorage(data) {
        this.allRecords.push(data);
        localStorage.setItem(CONFIG.LOCAL_STORAGE_KEY, JSON.stringify(this.allRecords));
        
        // Update unique sets
        this.uniqueTrainers.add(data.trainer);
        this.uniqueBatches.add(data.batchId);
        
        // Update dropdowns
        this.updateFilterDropdowns();
    }

    loadFromLocalStorage() {
        const stored = localStorage.getItem(CONFIG.LOCAL_STORAGE_KEY);
        this.allRecords = stored ? JSON.parse(stored) : [];
        this.filteredRecords = [...this.allRecords];
        
        // Build unique sets
        this.allRecords.forEach(record => {
            this.uniqueTrainers.add(record.trainer);
            this.uniqueBatches.add(record.batchId);
        });
        
        // Update dropdowns
        this.updateFilterDropdowns();
    }

    updateFilterDropdowns() {
        // Update trainer dropdown
        const trainerSelect = this.filterTrainer;
        trainerSelect.innerHTML = '<option value="">All Trainers</option>';
        this.uniqueTrainers.forEach(trainer => {
            const option = document.createElement('option');
            option.value = trainer;
            option.textContent = trainer;
            trainerSelect.appendChild(option);
        });
        
        // Update batch dropdown
        const batchSelect = this.filterBatch;
        batchSelect.innerHTML = '<option value="">All Batches</option>';
        this.uniqueBatches.forEach(batch => {
            const option = document.createElement('option');
            option.value = batch;
            option.textContent = batch;
            batchSelect.appendChild(option);
        });
    }

    // =============== DATA TABLE FUNCTIONS ===============

    loadRecords() {
        this.tableLoader.style.display = 'block';
        this.noData.classList.add('d-none');
        
        setTimeout(() => {
            this.applyFilters();
            this.tableLoader.style.display = 'none';
        }, 500);
    }

    applyFilters() {
        const fromDate = this.filterFromDate.value;
        const toDate = this.filterToDate.value;
        const trainer = this.filterTrainer.value;
        const batch = this.filterBatch.value;
        
        this.filteredRecords = this.allRecords.filter(record => {
            let match = true;
            
            // Filter by date range
            if (fromDate) {
                const recordDate = new Date(record.date).setHours(0, 0, 0, 0);
                const filterFrom = new Date(fromDate).setHours(0, 0, 0, 0);
                match = match && (recordDate >= filterFrom);
            }
            
            if (toDate) {
                const recordDate = new Date(record.date).setHours(23, 59, 59, 999);
                const filterTo = new Date(toDate).setHours(23, 59, 59, 999);
                match = match && (recordDate <= filterTo);
            }
            
            // Filter by trainer
            if (trainer) {
                match = match && (record.trainer === trainer);
            }
            
            // Filter by batch
            if (batch) {
                match = match && (record.batchId === batch);
            }
            
            return match;
        });
        
        this.populateTable();
    }

    populateTable() {
        this.tableBody.innerHTML = '';
        
        if (this.filteredRecords.length === 0) {
            this.noData.classList.remove('d-none');
            return;
        }
        
        this.noData.classList.add('d-none');
        
        this.filteredRecords.forEach((record, index) => {
            const row = document.createElement('tr');
            
            // Format date
            const dateObj = new Date(record.date);
            const formattedDate = dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            // Photo cell
            let photoCell = '<td><i class="fas fa-times text-danger"></i></td>';
            if (record.photo) {
                photoCell = `
                    <td>
                        <img src="${record.photo}" 
                             alt="Student Photo" 
                             class="photo-thumbnail"
                             onclick="app.viewPhoto('${record.photo}')"
                             style="cursor: pointer;">
                    </td>
                `;
            }
            
            row.innerHTML = `
                <td><strong class="text-primary">${record.serialNo}</strong></td>
                <td>${formattedDate}</td>
                <td>${record.candidateName}</td>
                <td>${record.contactNo}</td>
                <td><span class="badge bg-primary">${record.batchId}</span></td>
                <td>${record.trainer}</td>
                ${photoCell}
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="app.editRecord(${record.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="app.deleteRecord(${record.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            this.tableBody.appendChild(row);
        });
    }

    clearFilters() {
        const today = new Date().toISOString().split('T')[0];
        const firstDay = new Date();
        firstDay.setDate(1);
        
        this.filterFromDate.value = firstDay.toISOString().split('T')[0];
        this.filterToDate.value = today;
        this.filterTrainer.value = '';
        this.filterBatch.value = '';
        
        this.applyFilters();
        this.showToast('Filters cleared', 'info');
    }

    // =============== EXPORT & PRINT ===============

    exportToExcel() {
        if (this.filteredRecords.length === 0) {
            this.showError('No data to export');
            return;
        }
        
        // Prepare data for export
        const exportData = this.filteredRecords.map(record => ({
            'Serial No': record.serialNo,
            'Date': new Date(record.date).toLocaleDateString('en-US'),
            'Name': record.candidateName,
            'Contact': record.contactNo,
            'Batch ID': record.batchId,
            'Trainer': record.trainer,
            'Photo Available': record.photo ? 'Yes' : 'No',
            'Registration Time': new Date(record.timestamp).toLocaleString()
        }));
        
        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Student Data');
        
        // Generate file name
        const timestamp = new Date().toISOString().slice(0, 10);
        const fileName = `Student_Registrations_${timestamp}.xlsx`;
        
        // Save file
        XLSX.writeFile(wb, fileName);
        
        this.showToast('Data exported successfully!', 'success');
    }

    printFilteredData() {
        if (this.filteredRecords.length === 0) {
            this.showError('No data to print');
            return;
        }
        
        const printSection = document.getElementById('printSection');
        
        // Create print content
        let printContent = `
            <div style="padding: 40px; font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #2c3e50; padding-bottom: 20px;">
                    <h1 style="color: #2c3e50; margin-bottom: 10px;">
                        <i class="fas fa-user-graduate"></i> Student Registration Data
                    </h1>
                    <p style="color: #666; font-size: 14px;">
                        Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
                    </p>
                </div>
                
                <div style="margin-bottom: 30px; background: #f8f9fa; padding: 20px; border-radius: 10px;">
                    <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 18px;">Filter Summary</h3>
                    <p style="color: #666; margin: 5px 0;">
                        <strong>Date Range:</strong> ${this.filterFromDate.value} to ${this.filterToDate.value}
                    </p>
                    <p style="color: #666; margin: 5px 0;">
                        <strong>Trainer:</strong> ${this.filterTrainer.value || 'All Trainers'}
                    </p>
                    <p style="color: #666; margin: 5px 0;">
                        <strong>Batch:</strong> ${this.filterBatch.value || 'All Batches'}
                    </p>
                    <p style="color: #666; margin: 5px 0;">
                        <strong>Total Records:</strong> ${this.filteredRecords.length}
                    </p>
                </div>
                
                <table border="1" cellpadding="10" cellspacing="0" 
                       style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
                    <thead>
                        <tr style="background-color: #2c3e50; color: white;">
                            <th style="border: 1px solid #ddd; padding: 12px;">S.No</th>
                            <th style="border: 1px solid #ddd; padding: 12px;">Date</th>
                            <th style="border: 1px solid #ddd; padding: 12px;">Name</th>
                            <th style="border: 1px solid #ddd; padding: 12px;">Contact</th>
                            <th style="border: 1px solid #ddd; padding: 12px;">Batch ID</th>
                            <th style="border: 1px solid #ddd; padding: 12px;">Trainer</th>
                            <th style="border: 1px solid #ddd; padding: 12px;">Photo</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        this.filteredRecords.forEach((record, index) => {
            const formattedDate = new Date(record.date).toLocaleDateString('en-US');
            
            printContent += `
                <tr style="${index % 2 === 0 ? 'background-color: #f8f9fa;' : ''}">
                    <td style="border: 1px solid #ddd; padding: 10px;">${record.serialNo}</td>
                    <td style="border: 1px solid #ddd; padding: 10px;">${formattedDate}</td>
                    <td style="border: 1px solid #ddd; padding: 10px;">${record.candidateName}</td>
                    <td style="border: 1px solid #ddd; padding: 10px;">${record.contactNo}</td>
                    <td style="border: 1px solid #ddd; padding: 10px;">${record.batchId}</td>
                    <td style="border: 1px solid #ddd; padding: 10px;">${record.trainer}</td>
                    <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">
                        ${record.photo ? '✓' : '✗'}
                    </td>
                </tr>
            `;
        });
        
        printContent += `
                    </tbody>
                </table>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                    <p style="color: #666; font-size: 12px;">
                        © ${new Date().getFullYear()} Student Registration Management System
                    </p>
                </div>
            </div>
        `;
        
        printSection.innerHTML = printContent;
        
        // Trigger print
        window.print();
    }

    printRegistration() {
        const serialNo = document.getElementById('modalSerial').textContent;
        const name = document.getElementById('modalName').textContent;
        const date = document.getElementById('modalDate').textContent;
        const batch = document.getElementById('modalBatch').textContent;
        const trainer = document.getElementById('modalTrainer').textContent;
        
        const printSection = document.getElementById('printSection');
        
        const printContent = `
            <div style="padding: 50px; font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 40px;">
                    <h1 style="color: #2c3e50; border-bottom: 4px solid #3498db; padding-bottom: 15px; display: inline-block;">
                        <i class="fas fa-user-graduate"></i> Registration Confirmation
                    </h1>
                </div>
                
                <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); 
                           padding: 40px; border-radius: 15px; margin-bottom: 30px; 
                           border: 2px solid #3498db; position: relative;">
                    <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); 
                               background: #3498db; color: white; padding: 10px 30px; 
                               border-radius: 25px; font-weight: bold;">
                        OFFICIAL REGISTRATION
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 20px;">
                        <div>
                            <h3 style="color: #2c3e50; margin-bottom: 20px; font-size: 18px;">
                                <i class="fas fa-id-card"></i> Registration Details
                            </h3>
                            <div style="margin-bottom: 15px;">
                                <div style="color: #666; font-size: 14px; margin-bottom: 5px;">Registration ID</div>
                                <div style="color: #2c3e50; font-size: 20px; font-weight: bold;">${serialNo}</div>
                            </div>
                            <div style="margin-bottom: 15px;">
                                <div style="color: #666; font-size: 14px; margin-bottom: 5px;">Registration Date</div>
                                <div style="color: #2c3e50; font-size: 16px;">${date}</div>
                            </div>
                        </div>
                        
                        <div>
                            <h3 style="color: #2c3e50; margin-bottom: 20px; font-size: 18px;">
                                <i class="fas fa-user"></i> Student Details
                            </h3>
                            <div style="margin-bottom: 15px;">
                                <div style="color: #666; font-size: 14px; margin-bottom: 5px;">Student Name</div>
                                <div style="color: #2c3e50; font-size: 20px; font-weight: bold;">${name}</div>
                            </div>
                            <div style="margin-bottom: 15px;">
                                <div style="color: #666; font-size: 14px; margin-bottom: 5px;">Batch ID</div>
                                <div style="color: #2c3e50; font-size: 16px; font-weight: bold;">${batch}</div>
                            </div>
                            <div style="margin-bottom: 15px;">
                                <div style="color: #666; font-size: 14px; margin-bottom: 5px;">Assigned Trainer</div>
                                <div style="color: #2c3e50; font-size: 16px;">${trainer}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 40px; padding: 25px; background: #f8f9fa; border-radius: 10px; 
                           border-left: 5px solid #3498db;">
                    <h4 style="color: #2c3e50; margin-bottom: 15px;">
                        <i class="fas fa-info-circle"></i> Important Information
                    </h4>
                    <ul style="color: #666; line-height: 1.8; margin: 0; padding-left: 20px;">
                        <li>This document serves as official confirmation of registration</li>
                        <li>Please keep this document for your records</li>
                        <li>Present this document for any verification purposes</li>
                        <li>For any queries, contact the administration office</li>
                    </ul>
                </div>
                
                <div style="text-align: center; color: #666; margin-top: 50px; padding-top: 30px; 
                           border-top: 1px solid #ddd;">
                    <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                    <p style="font-size: 12px;">© ${new Date().getFullYear()} Student Registration Management System</p>
                </div>
            </div>
        `;
        
        printSection.innerHTML = printContent;
        
        window.print();
    }

    // =============== ANALYTICS FUNCTIONS ===============

    updateAnalytics() {
        this.updateStats();
        this.updateCharts();
    }

    updateStats() {
        const today = new Date().toISOString().split('T')[0];
        
        // Total Students
        this.totalStudentsEl.textContent = this.allRecords.length;
        
        // Total Trainers
        this.totalTrainersEl.textContent = this.uniqueTrainers.size;
        
        // Total Batches
        this.totalBatchesEl.textContent = this.uniqueBatches.size;
        
        // Today's Registrations
        const todayCount = this.allRecords.filter(record => 
            record.date === today
        ).length;
        this.todayRegistrationsEl.textContent = todayCount;
    }

    updateCharts() {
        this.updateBatchChart();
        this.updateMonthlyChart();
    }

    updateBatchChart() {
        const ctx = document.getElementById('batchChart').getContext('2d');
        
        // Count records per batch
        const batchCounts = {};
        this.allRecords.forEach(record => {
            batchCounts[record.batchId] = (batchCounts[record.batchId] || 0) + 1;
        });
        
        const labels = Object.keys(batchCounts);
        const data = Object.values(batchCounts);
        
        // Colors for chart
        const backgroundColors = [
            'rgba(52, 152, 219, 0.7)',
            'rgba(46, 204, 113, 0.7)',
            'rgba(155, 89, 182, 0.7)',
            'rgba(241, 196, 15, 0.7)',
            'rgba(230, 126, 34, 0.7)',
            'rgba(231, 76, 60, 0.7)',
        ];
        
        const borderColors = backgroundColors.map(color => color.replace('0.7', '1'));
        
        if (this.batchChart) {
            this.batchChart.destroy();
        }
        
        this.batchChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    title: {
                        display: true,
                        text: 'Distribution of Students by Batch'
                    }
                }
            }
        });
    }

    updateMonthlyChart() {
        const ctx = document.getElementById('monthlyChart').getContext('2d');
        
        // Count records per month
        const monthlyCounts = {};
        this.allRecords.forEach(record => {
            const date = new Date(record.date);
            const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            monthlyCounts[monthYear] = (monthlyCounts[monthYear] || 0) + 1;
        });
        
        // Sort by date
        const sortedEntries = Object.entries(monthlyCounts).sort();
        const labels = sortedEntries.map(([month]) => {
            const [year, monthNum] = month.split('-');
            return `${new Date(year, monthNum - 1).toLocaleString('default', { month: 'short' })} ${year}`;
        });
        const data = sortedEntries.map(([, count]) => count);
        
        if (this.monthlyChart) {
            this.monthlyChart.destroy();
        }
        
        this.monthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Registrations',
                    data: data,
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Monthly Registration Trend'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    // =============== UTILITY FUNCTIONS ===============

    addNewBatch() {
        const batchValue = this.batchIdInput.value.trim();
        
        if (!batchValue) {
            this.showError('Please enter a batch ID');
            return;
        }
        
        // Add to datalist if not exists
        const datalist = document.getElementById('batchOptions');
        const exists = Array.from(datalist.options).some(opt => opt.value === batchValue);
        
        if (!exists) {
            const option = document.createElement('option');
            option.value = batchValue;
            datalist.appendChild(option);
        }
        
        this.uniqueBatches.add(batchValue);
        this.updateFilterDropdowns();
        
        this.showToast('Batch added successfully!', 'success');
    }

    addNewTrainer() {
        const trainerValue = this.trainerInput.value.trim();
        
        if (!trainerValue) {
            this.showError('Please enter a trainer name');
            return;
        }
        
        // Add to datalist if not exists
        const datalist = document.getElementById('trainerOptions');
        const exists = Array.from(datalist.options).some(opt => opt.value === trainerValue);
        
        if (!exists) {
            const option = document.createElement('option');
            option.value = trainerValue;
            datalist.appendChild(option);
        }
        
        this.uniqueTrainers.add(trainerValue);
        this.updateFilterDropdowns();
        
        this.showToast('Trainer added successfully!', 'success');
    }

    editRecord(id) {
        const record = this.allRecords.find(r => r.id === id);
        
        if (!record) {
            this.showError('Record not found');
            return;
        }
        
        // Fill form with record data
        this.serialNoInput.value = record.serialNo;
        this.dateInput.value = record.date;
        this.candidateNameInput.value = record.candidateName;
        this.contactNoInput.value = record.contactNo;
        this.batchIdInput.value = record.batchId;
        this.trainerInput.value = record.trainer;
        
        if (record.photo) {
            this.photoData = record.photo;
            this.photoOutput.src = record.photo;
            this.capturedPhoto.style.display = 'flex';
            this.updatePhotoStatus('Photo loaded from record', 'success');
        }
        
        // Update form status
        this.updateFormCompletion();
        
        // Switch to registration tab
        document.getElementById('registration-tab').click();
        
        // Scroll to form
        this.serialNoInput.scrollIntoView({ behavior: 'smooth' });
        
        this.showToast('Record loaded for editing', 'info');
    }

    deleteRecord(id) {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                this.allRecords = this.allRecords.filter(r => r.id !== id);
                localStorage.setItem(CONFIG.LOCAL_STORAGE_KEY, JSON.stringify(this.allRecords));
                
                this.loadRecords();
                this.updateAnalytics();
                
                this.showToast('Record deleted successfully!', 'success');
            }
        });
    }

    viewPhoto(photoData) {
        document.getElementById('modalPhoto').src = photoData;
        this.photoModal.show();
    }

    resetForm() {
        Swal.fire({
            title: 'Reset Form?',
            text: "All entered data will be lost",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, reset it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                this.form.reset();
                this.dateInput.value = new Date().toISOString().split('T')[0];
                
                // Reset photo
                this.photoData = null;
                this.capturedPhoto.style.display = 'none';
                this.video.style.display = 'none';
                this.cameraPreview.querySelector('.placeholder-text').style.display = 'block';
                this.startCameraBtn.style.display = 'block';
                this.captureBtn.style.display = 'none';
                this.stopCameraBtn.style.display = 'none';
                
                // Stop camera if active
                if (this.stream) {
                    this.stream.getTracks().forEach(track => track.stop());
                    this.stream = null;
                }
                
                this.updatePhotoStatus('Please capture or upload a photo', 'info');
                this.updateFormCompletion();
                
                // Reset validation styles
                document.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
                    el.classList.remove('is-valid', 'is-invalid');
                });
                
                this.showToast('Form reset successfully', 'success');
            }
        });
    }

    showSuccessModal(data) {
        document.getElementById('modalSerial').textContent = data.serialNo;
        document.getElementById('modalName').textContent = data.candidateName;
        document.getElementById('modalBatch').textContent = data.batchId;
        document.getElementById('modalTrainer').textContent = data.trainer;
        
        const dateObj = new Date(data.date);
        document.getElementById('modalDate').textContent = dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        this.successModal.show();
    }

    showError(message) {
        document.getElementById('errorTitle').textContent = 'Error Occurred';
        document.getElementById('errorMessage').textContent = message;
        this.errorModal.show();
    }

    showToast(message, type = 'success') {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });

        Toast.fire({
            icon: type,
            title: message
        });
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new StudentRegistrationApp();
});

// Global functions for HTML onclick attributes
function startCamera() { app.startCamera(); }
function capturePhoto() { app.capturePhoto(); }
function stopCamera() { app.stopCamera(); }
function retakePhoto() { app.retakePhoto(); }
function handleFileUpload(event) { app.handleFileUpload(event); }
function addNewBatch() { app.addNewBatch(); }
function addNewTrainer() { app.addNewTrainer(); }
function resetForm() { app.resetForm(); }
function applyFilters() { app.applyFilters(); }
function exportToExcel() { app.exportToExcel(); }
function printFilteredData() { app.printFilteredData(); }
function clearFilters() { app.clearFilters(); }
function printRegistration() { app.printRegistration(); }
