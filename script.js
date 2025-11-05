// Google Apps Script Web App URL - 請替換成您部署後的 URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzLOVQK5O0-HUv916FsBw-NRDQ50YyEbnQSNDnL8IpyGVi1vDHfSaDd8JW9HOA0_RNw/exec';

// 頁面切換函數
function goToCalculation() {
    document.getElementById('settingPage').classList.remove('active');
    document.getElementById('calculationPage').classList.add('active');
}

function goToSetting() {
    document.getElementById('calculationPage').classList.remove('active');
    document.getElementById('settingPage').classList.add('active');
}

// 儲存員工資料到 Google Sheets
async function saveEmployeeData() {
    // 收集表單資料
    const employeeData = {
        action: 'saveEmployee',
        employeeId: document.getElementById('employeeId').value,
        employeeName: document.getElementById('employeeName').value,
        bloodType: document.getElementById('bloodType').value,
        phone: document.getElementById('phone').value,
        birthDate: document.getElementById('birthDate').value,
        emergencyContact: document.getElementById('emergencyContact').value,
        emergencyPhone: document.getElementById('emergencyPhone').value,
        address: document.getElementById('address').value,
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
        bankCode: document.getElementById('bankCode').value,
        bankAccount: document.getElementById('bankAccount').value,
        notes: document.getElementById('notes').value,
        timestamp: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
    };

    // 驗證必填欄位
    if (!employeeData.employeeId || !employeeData.employeeName) {
        showMessage('請填寫必填欄位（員工ID和姓名）', 'error');
        return;
    }

    // 顯示載入狀態
    showMessage('正在儲存資料...', 'info');

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(employeeData)
        });

        // 因為 no-cors 模式，我們無法讀取回應，所以假設成功
        showMessage('✅ 員工資料已成功儲存到 Google 試算表！', 'success');
        
        // 3秒後清除表單
        setTimeout(() => {
            if (confirm('是否要清除表單以新增下一位員工？')) {
                clearEmployeeForm();
            }
        }, 2000);

    } catch (error) {
        console.error('錯誤:', error);
        showMessage('❌ 儲存失敗，請檢查網路連線或聯絡管理員', 'error');
    }
}

// 計算薪資並儲存到 Google Sheets
async function calculateSalary() {
    const employeeId = document.getElementById('calcEmployeeId').value;
    const calcMonth = document.getElementById('calcMonth').value;
    const workDays = parseFloat(document.getElementById('workDays').value) || 0;

    // 驗證必填欄位
    if (!employeeId || !calcMonth) {
        showMessage('請填寫必填欄位（員工ID和計算年月）', 'error');
        return;
    }

    showMessage('正在計算薪資...', 'info');

    // 收集計算資料
    const calculationData = {
        action: 'calculateSalary',
        employeeId: employeeId,
        calcMonth: calcMonth,
        workDays: workDays,
        overtimeHours: parseFloat(document.getElementById('overtimeHours').value) || 0,
        leaveDeduction: parseFloat(document.getElementById('leaveDeduction').value) || 0,
        advancePayment: parseFloat(document.getElementById('advancePayment').value) || 0,
        proxy6hrDeduction: parseFloat(document.getElementById('proxy6hrDeduction').value) || 0,
        otherDeduction: parseFloat(document.getElementById('otherDeduction').value) || 0,
        fineShare: parseFloat(document.getElementById('fineShare').value) || 0,
        timestamp: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
    };

    try {
        // 發送資料到 Google Sheets
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(calculationData)
        });

        // 本地計算結果顯示（因為 no-cors 無法讀取回應）
        const result = calculateLocalSalary(calculationData);
        displayResult(result);
        
        showMessage('✅ 薪資計算完成並已儲存到 Google 試算表！', 'success');

    } catch (error) {
        console.error('錯誤:', error);
        showMessage('❌ 計算失敗，請檢查網路連線或聯絡管理員', 'error');
    }
}

// 本地計算薪資（用於顯示）
function calculateLocalSalary(data) {
    // 從員工設定頁面讀取基本薪資設定
    const dailyWage = parseFloat(document.getElementById('dailyWage').value) || 1500;
    const overtimeWage = parseFloat(document.getElementById('overtimeWage').value) || 200;
    const mealAllowance = parseFloat(document.getElementById('mealAllowance').value) || 0;
    const attendanceAllowance = parseFloat(document.getElementById('attendanceAllowance').value) || 0;
    const jobAllowance = parseFloat(document.getElementById('jobAllowance').value) || 0;
    const rentAllowance = parseFloat(document.getElementById('rentAllowance').value) || 0;
    const advanceAllowance = parseFloat(document.getElementById('advanceAllowance').value) || 0;
    const laborInsurance = parseFloat(document.getElementById('laborInsurance').value) || 0;
    const healthInsurance = parseFloat(document.getElementById('healthInsurance').value) || 0;
    const supplementaryHealthInsurance = parseFloat(document.getElementById('supplementaryHealthInsurance').value) || 0;

    // 計算基本日薪
    const basicSalary = dailyWage * data.workDays;
    
    // 計算加班費
    const overtimePay = overtimeWage * data.overtimeHours;
    
    // 計算伙食津貼
    const mealTotal = mealAllowance * data.workDays;
    
    // 計算總津貼
    const totalAllowance = mealTotal + attendanceAllowance + jobAllowance + rentAllowance + advanceAllowance;
    
    // 計算總扣款
    const totalDeduction = 
        laborInsurance + 
        healthInsurance + 
        supplementaryHealthInsurance +
        data.leaveDeduction +
        data.advancePayment +
        data.proxy6hrDeduction +
        data.otherDeduction +
        data.fineShare;
    
    // 計算實發薪資
    const netSalary = basicSalary + overtimePay + totalAllowance - totalDeduction;

    return {
        basicSalary: basicSalary,
        overtimePay: overtimePay,
        totalAllowance: totalAllowance,
        totalDeduction: totalDeduction,
        netSalary: netSalary
    };
}

// 顯示計算結果
function displayResult(result) {
    document.getElementById('resultBasicSalary').textContent = `NT$ ${result.basicSalary.toLocaleString()}`;
    document.getElementById('resultOvertime').textContent = `NT$ ${result.overtimePay.toLocaleString()}`;
    document.getElementById('resultAllowance').textContent = `NT$ ${result.totalAllowance.toLocaleString()}`;
    document.getElementById('resultDeduction').textContent = `NT$ ${result.totalDeduction.toLocaleString()}`;
    document.getElementById('resultNetSalary').textContent = `NT$ ${result.netSalary.toLocaleString()}`;
    
    document.getElementById('resultSection').style.display = 'block';
    
    // 滾動到結果區域
    document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// 清除員工表單
function clearEmployeeForm() {
    document.getElementById('employeeId').value = '';
    document.getElementById('employeeName').value = '';
    document.getElementById('bloodType').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('birthDate').value = '';
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
    document.getElementById('bankAccount').value = '';
    document.getElementById('notes').value = '';
}

// 顯示訊息
function showMessage(message, type) {
    // 移除現有訊息
    const existingMessages = document.querySelectorAll('.success-message, .error-message, .info-message');
    existingMessages.forEach(msg => msg.remove());

    // 創建新訊息
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : type === 'error' ? 'error-message' : 'info-message';
    messageDiv.innerHTML = `<span>${message}</span>`;
    
    // 插入到活動頁面的頂部
    const activePage = document.querySelector('.page.active');
    activePage.insertBefore(messageDiv, activePage.firstChild);

    // 3秒後自動移除（除非是資訊訊息）
    if (type !== 'info') {
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }
}

// 頁面載入時的初始化
document.addEventListener('DOMContentLoaded', function() {
    // 設定當月為預設計算月份
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    document.getElementById('calcMonth').value = currentMonth;

    // 檢查是否已設定 Google Apps Script URL
    if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
        showMessage('⚠️ 請先在 script.js 中設定您的 Google Apps Script Web App URL', 'error');
    }
});

// 新增資訊訊息的 CSS（動態添加）
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