// Load bank statement data from JSON file
async function loadBankStatement() {
    try {
        const response = await fetch('bank-statement.json');
        const data = await response.json();
        populateStatement(data);
    } catch (error) {
        console.error('Error loading bank statement:', error);
        alert('Failed to load bank statement data. Please ensure the JSON file exists.');
    }
}

// Format currency
function formatCurrency(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
}

// Populate the statement with data
function populateStatement(data) {
    // Bank header
    document.getElementById('bankLogo').textContent = data.bankLogo;
    document.getElementById('bankName').textContent = data.bankName;

    // Statement info
    document.getElementById('statementNumber').textContent = `Statement No: ${data.accountDetails.statementNumber}`;

    // Account holder details
    document.getElementById('holderName').textContent = data.accountHolder.name;
    document.getElementById('accountNumber').textContent = data.accountHolder.accountNumber;
    document.getElementById('accountType').textContent = data.accountHolder.accountType;
    document.getElementById('customerID').textContent = data.accountDetails.customerID;

    // Statement period
    document.getElementById('periodFrom').textContent = formatDate(data.statementPeriod.from);
    document.getElementById('periodTo').textContent = formatDate(data.statementPeriod.to);
    document.getElementById('branchName').textContent = data.accountDetails.branchName;
    document.getElementById('ifscCode').textContent = data.accountDetails.ifscCode;

    // Address
    const address = `${data.accountHolder.address}, ${data.accountHolder.city}, ${data.accountHolder.state} ${data.accountHolder.zipCode}, ${data.accountHolder.country}`;
    document.getElementById('address').textContent = address;

    // Balance summary
    const currency = data.balance.currency;
    document.getElementById('openingBalance').textContent = formatCurrency(data.balance.openingBalance, currency);
    document.getElementById('closingBalance').textContent = formatCurrency(data.balance.closingBalance, currency);
    document.getElementById('totalCredits').textContent = formatCurrency(data.summary.totalCredits, currency);
    document.getElementById('totalDebits').textContent = formatCurrency(data.summary.totalDebits, currency);

    // Transactions
    const transactionsBody = document.getElementById('transactionsBody');
    transactionsBody.innerHTML = '';

    data.transactions.forEach((transaction, index) => {
        const row = document.createElement('tr');

        // Add special styling for opening balance
        if (index === 0) {
            row.style.fontWeight = 'bold';
            row.style.backgroundColor = '#e0f2fe';
        }

        row.innerHTML = `
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.description}</td>
            <td>${transaction.referenceNumber}</td>
            <td class="amount ${transaction.debit > 0 ? 'debit-amount' : ''}">${transaction.debit > 0 ? formatCurrency(transaction.debit, currency) : '-'}</td>
            <td class="amount ${transaction.credit > 0 ? 'credit-amount' : ''}">${transaction.credit > 0 ? formatCurrency(transaction.credit, currency) : '-'}</td>
            <td class="amount balance-amount">${formatCurrency(transaction.balance, currency)}</td>
        `;

        transactionsBody.appendChild(row);
    });

    // Summary
    document.getElementById('numTransactions').textContent = data.summary.numberOfTransactions;
    document.getElementById('avgBalance').textContent = formatCurrency(data.summary.averageBalance, currency);

    // Footer
    document.getElementById('disclaimer').textContent = data.footer.disclaimer;
    document.getElementById('customerCare').textContent = data.footer.contactInfo.customerCare;
    document.getElementById('email').textContent = data.footer.contactInfo.email;
    document.getElementById('website').textContent = data.footer.contactInfo.website;

    // Important notes
    const notesList = document.getElementById('notesList');
    notesList.innerHTML = '';
    data.footer.importantNotes.forEach(note => {
        const li = document.createElement('li');
        li.textContent = note;
        notesList.appendChild(li);
    });
}

// Load the statement when page loads
document.addEventListener('DOMContentLoaded', loadBankStatement);
