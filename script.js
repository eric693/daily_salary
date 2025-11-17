// Google Apps Script Web App URL - 請替換成您部署後的 URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyz1I_c7pJDKmm0m4OKa8fVLe4xjHcMHRW3MuOBj8zWBNlvBnDnY6P4YODd7-RFs7FL/exec';

// 全域變數：儲存當前選擇的員工資料
let currentEmployeeData = null;

// 薪資計算頁面密碼
const CALCULATION_PASSWORD = '12345';

// ============================================
// 🔐 密碼驗證相關
// ============================================

function showPasswordModal() {
    document.getElementById('passwordModal').style.display = 'flex';
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordError').style.display = 'none';
    setTimeout(() => {
        document.getElementById('passwordInput').focus();
    }, 100);
}

function hidePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
}

function checkPassword() {
    const inputPassword = document.getElementById('passwordInput').value;
    
    if (inputPassword === CALCULATION_PASSWORD) {
        hidePasswordModal();
        document.getElementById('settingPage').classList.remove('active');
        document.getElementById('calculationPage').classList.add('active');
        loadEmployeeList();
        showMessage('✅ 驗證成功，已進入薪資計算頁面', 'success');
    } else {
        document.getElementById('passwordError').style.display = 'block';
        document.getElementById('passwordInput').value = '';
        document.getElementById('passwordInput').focus();
    }
}

function cancelPassword() {
    hidePasswordModal();
    showMessage('已取消進入薪資計算頁面', 'info');
}

// ============================================
// 🎬 頁面初始化
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== 頁面初始化 ===');
    console.log('📍 SCRIPT_URL:', SCRIPT_URL);
    
    // 監聽密碼輸入框的 Enter 鍵
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkPassword();
            }
        });
    }
    
    // 設定當前月份
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    document.getElementById('calcMonth').value = currentMonth;

    if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
        showMessage('⚠️ 請先在 script.js 中設定您的 Google Apps Script Web App URL', 'error');
    }
});

// ============================================
// 📄 頁面切換函數
// ============================================

function goToCalculation() {
    showPasswordModal();
}

function goToSetting() {
    document.getElementById('calculationPage').classList.remove('active');
    document.getElementById('settingPage').classList.add('active');
}

// ============================================
// 📋 載入員工列表到下拉選單
// ============================================

async function loadEmployeeList() {
    try {
        console.log('=== 載入員工列表 ===');
        
        const response = await fetch(`${SCRIPT_URL}?action=getEmployeeList`, {
            method: 'GET',
        });
        
        const data = await response.json();
        console.log('📥 員工列表:', data);
        
        if (data.status === 'success' && data.employees) {
            const select = document.getElementById('calcEmployeeId');
            select.innerHTML = '<option value="">-- 請選擇員工 --</option>';
            
            data.employees.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.employeeId;
                option.textContent = `${emp.employeeId} - ${emp.employeeName}`;
                select.appendChild(option);
            });
            
            console.log('✅ 員工列表載入完成，共 ' + data.employees.length + ' 位員工');
        } else {
            console.error('❌ 載入員工列表失敗:', data.message);
        }
    } catch (error) {
        console.error('❌ 載入員工列表失敗:', error);
        showMessage('⚠️ 無法載入員工列表，請確認網路連線', 'error');
    }
}

// ============================================
// 👤 載入員工資料（含津貼和保險明細）
// ============================================

async function loadEmployeeData() {
    const employeeId = document.getElementById('calcEmployeeId').value;
    
    console.log('=== 載入員工資料 ===');
    console.log('📦 員工ID:', employeeId);
    
    if (!employeeId) {
        document.getElementById('calcEmployeeName').value = '';
        document.getElementById('employeeInfoBox').style.display = 'none';
        document.getElementById('allowanceInfoBox').style.display = 'none';
        document.getElementById('insuranceInfoBox').style.display = 'none';
        currentEmployeeData = null;
        return;
    }
    
    try {
        showMessage('正在載入員工資料...', 'info');
        
        const url = `${SCRIPT_URL}?action=getEmployee&employeeId=${encodeURIComponent(employeeId)}`;
        console.log('📤 請求 URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
        });
        
        const data = await response.json();
        console.log('📥 收到資料:', data);
        
        if (data.status === 'success' && data.employee) {
            currentEmployeeData = data.employee;
            
            console.log('✅ 載入的員工資料:', currentEmployeeData);
            
            // 填入員工姓名
            document.getElementById('calcEmployeeName').value = data.employee.employeeName;
            
            // 顯示基本薪資資訊
            const basicInfoHtml = `
                <div style="margin-top: 10px; line-height: 1.8;">
                    <strong>基本薪資資訊：</strong><br>
                    薪資: <span style="color: #10b981; font-weight: bold;">NT$ ${Number(data.employee.dailyWage).toLocaleString()}</span> | 
                    加班時薪: <span style="color: #10b981; font-weight: bold;">NT$ ${Number(data.employee.overtimeWage).toLocaleString()}</span> / 時
                </div>
            `;
            document.getElementById('employeeInfo').innerHTML = basicInfoHtml;
            document.getElementById('employeeInfoBox').style.display = 'flex';
            
            // 顯示加項津貼明細
            const allowanceHtml = `
                <div style="margin-top: 10px; line-height: 1.8;">
                    <strong>每月固定津貼：</strong><br>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 8px;">
                        <div>伙食津貼: <span style="color: #3b82f6; font-weight: bold;">NT$ ${Number(data.employee.mealAllowance).toLocaleString()}</span> / 天</div>
                        <div>開車津貼: <span style="color: #3b82f6; font-weight: bold;">NT$ ${Number(data.employee.attendanceAllowance).toLocaleString()}</span></div>
                        <div>職務津貼: <span style="color: #3b82f6; font-weight: bold;">NT$ ${Number(data.employee.jobAllowance).toLocaleString()}</span></div>
                        <div>租屋津貼: <span style="color: #3b82f6; font-weight: bold;">NT$ ${Number(data.employee.rentAllowance).toLocaleString()}</span></div>
                        <div>代付款: <span style="color: #3b82f6; font-weight: bold;">NT$ ${Number(data.employee.advanceAllowance).toLocaleString()}</span></div>
                    </div>
                </div>
            `;
            document.getElementById('allowanceInfo').innerHTML = allowanceHtml;
            document.getElementById('allowanceInfoBox').style.display = 'flex';
            
            // 顯示勞健保明細
            const insuranceHtml = `
                <div style="margin-top: 10px; line-height: 1.8;">
                    <strong>每月固定扣款：</strong><br>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 8px;">
                        <div>勞保費: <span style="color: #ef4444; font-weight: bold;">NT$ ${Number(data.employee.laborInsurance).toLocaleString()}</span></div>
                        <div>健保費: <span style="color: #ef4444; font-weight: bold;">NT$ ${Number(data.employee.healthInsurance).toLocaleString()}</span></div>
                        <div>眷屬健保: <span style="color: #ef4444; font-weight: bold;">NT$ ${Number(data.employee.supplementaryHealthInsurance).toLocaleString()}</span></div>
                    </div>
                </div>
            `;
            document.getElementById('insuranceInfo').innerHTML = insuranceHtml;
            document.getElementById('insuranceInfoBox').style.display = 'flex';
            
            // 移除舊的提示訊息
            const infoMessages = document.querySelectorAll('.info-message');
            infoMessages.forEach(msg => msg.remove());
            
            showMessage('✅ 員工資料載入成功', 'success');
            
        } else {
            showMessage(`❌ ${data.message || '找不到該員工資料'}`, 'error');
            currentEmployeeData = null;
            document.getElementById('employeeInfoBox').style.display = 'none';
            document.getElementById('allowanceInfoBox').style.display = 'none';
            document.getElementById('insuranceInfoBox').style.display = 'none';
        }
        
    } catch (error) {
        console.error('❌ 載入員工資料失敗:', error);
        showMessage('❌ 載入員工資料失敗，請檢查網路連線或 Google Apps Script 設定', 'error');
        currentEmployeeData = null;
        document.getElementById('employeeInfoBox').style.display = 'none';
        document.getElementById('allowanceInfoBox').style.display = 'none';
        document.getElementById('insuranceInfoBox').style.display = 'none';
    }
}

// ============================================
// 💾 儲存員工資料到 Google Sheets
// ============================================

async function saveEmployeeData() {
    const employeeData = {
        action: 'saveEmployee',
        employeeId: (document.getElementById('employeeId').value || '').trim(),
        employeeName: (document.getElementById('employeeName').value || '').trim(),
        bloodType: document.getElementById('bloodType').value || '',
        phone: (document.getElementById('phone').value || '').trim(),
        email: (document.getElementById('email').value || '').trim(),
        birthDate: document.getElementById('birthDate').value || '',
        emergencyContact: (document.getElementById('emergencyContact').value || '').trim(),
        emergencyPhone: (document.getElementById('emergencyPhone').value || '').trim(),
        address: (document.getElementById('address').value || '').trim(),
        dailyWage: parseFloat(document.getElementById('dailyWage').value) || 0,
        overtimeWage: parseFloat(document.getElementById('overtimeWage').value) || 0,
        mealAllowance: parseFloat(document.getElementById('mealAllowance').value) || 0,
        attendanceAllowance: parseFloat(document.getElementById('attendanceAllowance').value) || 0,
        jobAllowance: parseFloat(document.getElementById('jobAllowance').value) || 0,
        rentAllowance: parseFloat(document.getElementById('rentAllowance').value) || 0,
        advanceAllowance: parseFloat(document.getElementById('advanceAllowance').value) || 0,
        laborInsurance: parseFloat(document.getElementById('laborInsurance').value) || 0,
        healthInsurance: parseFloat(document.getElementById('healthInsurance').value) || 0,
        supplementaryHealthInsurance: parseFloat(document.getElementById('supplementaryHealthInsurance').value) || 0,
        dependents: parseInt(document.getElementById('dependents').value) || 0,
        bankCode: document.getElementById('bankCode').value || '',
        bankBranch: (document.getElementById('bankBranch').value || '').trim(),
        bankAccount: (document.getElementById('bankAccount').value || '').trim(),
        notes: (document.getElementById('notes').value || '').trim(),
        timestamp: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
    };

    // 驗證必填欄位
    if (!employeeData.employeeId) {
        showMessage('❌ 請填寫員工ID', 'error');
        document.getElementById('employeeId').focus();
        return;
    }

    if (!employeeData.employeeName) {
        showMessage('❌ 請填寫員工姓名', 'error');
        document.getElementById('employeeName').focus();
        return;
    }

    if (!isNaN(employeeData.employeeName)) {
        showMessage('❌ 員工姓名不能是純數字，請輸入正確的姓名', 'error');
        document.getElementById('employeeName').focus();
        return;
    }

    console.log('=== 準備送出員工資料 ===');
    console.log('📤 SCRIPT_URL:', SCRIPT_URL);
    console.log('📦 資料:', JSON.stringify(employeeData, null, 2));

    showMessage('正在儲存資料...', 'info');

    try {
        const formData = new URLSearchParams();
        formData.append('data', JSON.stringify(employeeData));
        
        console.log('📤 FormData:', formData.toString());
        
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData
        });

        console.log('📥 Response status:', response.status);
        
        const responseText = await response.text();
        console.log('📥 Response text:', responseText);
        
        let result;
        try {
            result = JSON.parse(responseText);
            console.log('📥 Parsed result:', result);
        } catch (e) {
            console.error('❌ JSON 解析失敗:', e);
            showMessage('❌ 伺服器回應格式錯誤', 'error');
            return;
        }
        
        if (result.status === 'success') {
            console.log('✅ 儲存成功');
            showMessage('✅ 員工資料已成功儲存到 Google 試算表！', 'success');
            
            setTimeout(() => {
                if (confirm('是否要清除表單以新增下一位員工？')) {
                    clearEmployeeForm();
                }
            }, 2000);
        } else {
            console.error('❌ 儲存失敗:', result.message);
            showMessage('❌ 儲存失敗: ' + result.message, 'error');
        }

    } catch (error) {
        console.error('❌ 錯誤:', error);
        showMessage('❌ 儲存失敗: ' + error.message, 'error');
    }
}

// ============================================
// 🧮 計算薪資並儲存（包含完整津貼和保險資料）
// ============================================

async function calculateSalary() {
    const employeeId = document.getElementById('calcEmployeeId').value;
    const calcMonth = document.getElementById('calcMonth').value;
    const workDays = parseFloat(document.getElementById('workDays').value) || 0;

    console.log('=== 開始計算薪資 ===');

    // 驗證必填欄位
    if (!employeeId || !calcMonth) {
        showMessage('❌ 請填寫必填欄位（員工ID和計算年月）', 'error');
        return;
    }
    
    if (!currentEmployeeData) {
        showMessage('❌ 請先選擇員工以載入薪資資料', 'error');
        return;
    }

    if (!currentEmployeeData.employeeName) {
        showMessage('❌ 錯誤: 員工姓名資料遺失，請重新選擇員工', 'error');
        return;
    }

    showMessage('正在計算薪資...', 'info');

    // ⭐⭐⭐ 關鍵：包含完整的員工薪資、津貼和保險資料
    const calculationData = {
        action: 'calculateSalary',
        employeeId: String(employeeId),
        employeeName: String(currentEmployeeData.employeeName),
        calcMonth: String(calcMonth),
        workDays: Number(workDays),
        overtimeHours: Number(parseFloat(document.getElementById('overtimeHours').value) || 0),
        leaveDeduction: Number(parseFloat(document.getElementById('leaveDeduction').value) || 0),
        advancePayment: Number(parseFloat(document.getElementById('advancePayment').value) || 0),
        proxy6hrDeduction: Number(parseFloat(document.getElementById('proxy6hrDeduction').value) || 0),
        otherDeduction: Number(parseFloat(document.getElementById('otherDeduction').value) || 0),
        fineShare: Number(parseFloat(document.getElementById('fineShare').value) || 0),
        
        // ⭐ 從 currentEmployeeData 取得完整的員工薪資、津貼和保險資料
        dailyWage: Number(currentEmployeeData.dailyWage) || 0,
        overtimeWage: Number(currentEmployeeData.overtimeWage) || 0,
        mealAllowance: Number(currentEmployeeData.mealAllowance) || 0,
        attendanceAllowance: Number(currentEmployeeData.attendanceAllowance) || 0,
        jobAllowance: Number(currentEmployeeData.jobAllowance) || 0,
        rentAllowance: Number(currentEmployeeData.rentAllowance) || 0,
        advanceAllowance: Number(currentEmployeeData.advanceAllowance) || 0,
        laborInsurance: Number(currentEmployeeData.laborInsurance) || 0,
        healthInsurance: Number(currentEmployeeData.healthInsurance) || 0,
        supplementaryHealthInsurance: Number(currentEmployeeData.supplementaryHealthInsurance) || 0,
        
        timestamp: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
    };

    console.log('📤 準備送出的完整計算資料:');
    console.log(JSON.stringify(calculationData, null, 2));
    
    console.log('\n✅ 確認包含的員工資料:');
    console.log('   員工姓名:', calculationData.employeeName);
    console.log('   基本薪資:', calculationData.dailyWage);
    console.log('   加班時薪:', calculationData.overtimeWage);
    console.log('   伙食津貼:', calculationData.mealAllowance);
    console.log('   開車津貼:', calculationData.attendanceAllowance);
    console.log('   職務津貼:', calculationData.jobAllowance);
    console.log('   租屋津貼:', calculationData.rentAllowance);
    console.log('   代付款:', calculationData.advanceAllowance);
    console.log('   勞保費:', calculationData.laborInsurance);
    console.log('   健保費:', calculationData.healthInsurance);
    console.log('   眷屬健保:', calculationData.supplementaryHealthInsurance);

    try {
        // 本地計算結果顯示
        const result = calculateLocalSalary(calculationData);
        
        if (!result) {
            return;
        }
        
        displayResult(result);
        
        // 發送完整資料到 Google Sheets
        const formData = new URLSearchParams();
        formData.append('data', JSON.stringify(calculationData));
        
        console.log('📤 發送資料到後端...');
        
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData
        });
        
        console.log('📥 Response status:', response.status);
        
        const responseText = await response.text();
        console.log('📥 Response text:', responseText);
        
        let backendResult;
        try {
            backendResult = JSON.parse(responseText);
            console.log('📥 Parsed result:', backendResult);
        } catch (e) {
            console.error('❌ JSON 解析失敗:', e);
            showMessage('⚠️ 資料已顯示但儲存狀態未知', 'error');
            return;
        }
        
        if (backendResult.status === 'success') {
            console.log('✅ 資料已成功儲存到試算表');
            showMessage('✅ 薪資計算完成並已儲存到 Google 試算表！', 'success');
        } else {
            console.error('❌ 後端儲存失敗:', backendResult.message);
            showMessage('⚠️ 資料已顯示但儲存失敗: ' + backendResult.message, 'error');
        }

    } catch (error) {
        console.error('❌ 錯誤:', error);
        showMessage('⚠️ 資料已顯示但儲存失敗: ' + error.message, 'error');
    }
}

// ============================================
// 🧮 本地計算薪資（用於前端顯示）
// ============================================

function calculateLocalSalary(data) {
    if (!currentEmployeeData) {
        showMessage('❌ 請先選擇員工', 'error');
        return null;
    }
    
    const dailyWage = currentEmployeeData.dailyWage;
    const overtimeWage = currentEmployeeData.overtimeWage;
    const mealAllowance = currentEmployeeData.mealAllowance;
    const attendanceAllowance = currentEmployeeData.attendanceAllowance;
    const jobAllowance = currentEmployeeData.jobAllowance;
    const rentAllowance = currentEmployeeData.rentAllowance;
    const advanceAllowance = currentEmployeeData.advanceAllowance;
    const laborInsurance = currentEmployeeData.laborInsurance;
    const healthInsurance = currentEmployeeData.healthInsurance;
    const supplementaryHealthInsurance = currentEmployeeData.supplementaryHealthInsurance;

    const basicSalary = dailyWage * data.workDays;
    const overtimePay = overtimeWage * data.overtimeHours;
    const mealTotal = mealAllowance * data.workDays;
    const totalAllowance = mealTotal + attendanceAllowance + jobAllowance + rentAllowance + advanceAllowance;
    
    const totalDeduction = 
        laborInsurance + 
        healthInsurance + 
        supplementaryHealthInsurance +
        data.leaveDeduction +
        data.advancePayment +
        data.proxy6hrDeduction +
        data.otherDeduction +
        data.fineShare;
    
    const netSalary = basicSalary + overtimePay + totalAllowance - totalDeduction;

    return {
        basicSalary: basicSalary,
        overtimePay: overtimePay,
        mealAllowance: mealTotal,
        attendanceAllowance: attendanceAllowance,
        jobAllowance: jobAllowance,
        rentAllowance: rentAllowance,
        advanceAllowance: advanceAllowance,
        totalAllowance: totalAllowance,
        laborInsurance: laborInsurance,
        healthInsurance: healthInsurance,
        supplementaryHealthInsurance: supplementaryHealthInsurance,
        leaveDeduction: data.leaveDeduction,
        advancePayment: data.advancePayment,
        proxy6hrDeduction: data.proxy6hrDeduction,
        otherDeduction: data.otherDeduction,
        fineShare: data.fineShare,
        totalDeduction: totalDeduction,
        netSalary: netSalary
    };
}

// ============================================
// 📊 顯示計算結果
// ============================================

function displayResult(result) {
    document.getElementById('resultBasicSalary').textContent = `NT$ ${result.basicSalary.toLocaleString()}`;
    document.getElementById('resultOvertime').textContent = `NT$ ${result.overtimePay.toLocaleString()}`;
    
    document.getElementById('resultMealAllowance').textContent = `NT$ ${result.mealAllowance.toLocaleString()}`;
    document.getElementById('resultAttendanceAllowance').textContent = `NT$ ${result.attendanceAllowance.toLocaleString()}`;
    document.getElementById('resultJobAllowance').textContent = `NT$ ${result.jobAllowance.toLocaleString()}`;
    document.getElementById('resultRentAllowance').textContent = `NT$ ${result.rentAllowance.toLocaleString()}`;
    document.getElementById('resultAdvanceAllowance').textContent = `NT$ ${result.advanceAllowance.toLocaleString()}`;
    document.getElementById('resultAllowanceTotal').textContent = `NT$ ${result.totalAllowance.toLocaleString()}`;
    
    document.getElementById('resultLaborInsurance').textContent = `NT$ ${result.laborInsurance.toLocaleString()}`;
    document.getElementById('resultHealthInsurance').textContent = `NT$ ${result.healthInsurance.toLocaleString()}`;
    document.getElementById('resultSupplementaryHealthInsurance').textContent = `NT$ ${result.supplementaryHealthInsurance.toLocaleString()}`;
    document.getElementById('resultLeaveDeduction').textContent = `NT$ ${result.leaveDeduction.toLocaleString()}`;
    document.getElementById('resultAdvancePayment').textContent = `NT$ ${result.advancePayment.toLocaleString()}`;
    document.getElementById('resultProxy6hrDeduction').textContent = `NT$ ${result.proxy6hrDeduction.toLocaleString()}`;
    document.getElementById('resultOtherDeduction').textContent = `NT$ ${result.otherDeduction.toLocaleString()}`;
    document.getElementById('resultFineShare').textContent = `NT$ ${result.fineShare.toLocaleString()}`;
    document.getElementById('resultDeductionTotal').textContent = `NT$ ${result.totalDeduction.toLocaleString()}`;
    
    document.getElementById('resultNetSalary').textContent = `NT$ ${result.netSalary.toLocaleString()}`;
    
    document.getElementById('resultSection').style.display = 'block';
    document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================
// 🧹 清除員工表單
// ============================================

function clearEmployeeForm() {
    document.getElementById('employeeId').value = '';
    document.getElementById('employeeName').value = '';
    document.getElementById('bloodType').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('email').value = '';
    document.getElementById('birthDate').value = '';
    document.getElementById('dependents').value = '0';
    document.getElementById('emergencyContact').value = '';
    document.getElementById('emergencyPhone').value = '';
    document.getElementById('address').value = '';
    document.getElementById('dailyWage').value = '1500';
    document.getElementById('overtimeWage').value = '200';
    document.getElementById('mealAllowance').value = '0';
    document.getElementById('attendanceAllowance').value = '0';
    document.getElementById('jobAllowance').value = '0';
    document.getElementById('rentAllowance').value = '0';
    document.getElementById('advanceAllowance').value = '0';
    document.getElementById('laborInsurance').value = '0';
    document.getElementById('healthInsurance').value = '0';
    document.getElementById('supplementaryHealthInsurance').value = '0';
    document.getElementById('bankCode').value = '';
    document.getElementById('bankBranch').value = '';
    document.getElementById('bankAccount').value = '';
    document.getElementById('notes').value = '';
    
    document.getElementById('employeeId').focus();
}

// ============================================
// 💬 顯示訊息
// ============================================

function showMessage(message, type) {
    const existingMessages = document.querySelectorAll('.success-message, .error-message, .info-message');
    existingMessages.forEach(msg => msg.remove());

    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : type === 'error' ? 'error-message' : 'info-message';
    messageDiv.innerHTML = `<span>${message}</span>`;
    
    const activePage = document.querySelector('.page.active');
    activePage.insertBefore(messageDiv, activePage.firstChild);

    if (type !== 'info') {
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }
}

// ============================================
// 🎨 新增資訊訊息的 CSS
// ============================================

const style = document.createElement('style');
style.textContent = `
    .info-message {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        margin: 20px 0;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: fadeIn 0.5s ease;
    }
`;
document.head.appendChild(style);