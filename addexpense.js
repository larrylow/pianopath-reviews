import wixData from 'wix-data';

let expenseRows = [{
    _id: String(Date.now()),
    reference: '',
    description: '',
    amount: '',
    category: '',
    paymentMethod: '',
    date: null,
    receipt: null
}];

// Helper: Get next available expense number (auto-increment)
async function getNextExpenseNumber() {
    // Query ALL expense numbers (or use a higher .limit if needed)
    let maxNum = 0;
    let hasMore = true;
    let skip = 0;
    const limit = 100; // Adjust as needed, handle pagination for large collections

    while (hasMore) {
        const result = await wixData.query("Expenses")
            .ascending("expenseNumber")
            .skip(skip)
            .limit(limit)
            .find();

        result.items.forEach(item => {
            const parts = (item.expenseNumber || '').split('-');
            const num = parseInt(parts[2]) || 0;
            if (num > maxNum) maxNum = num;
        });

        if (result.items.length < limit) {
            hasMore = false;
        } else {
            skip += limit;
        }
    }

    return `EXP-2025-${(maxNum + 1).toString().padStart(4, '0')}`;
}


$w.onReady(function () {
    $w("#expenseRepeater").data = expenseRows;

    $w("#expenseRepeater").onItemReady(($item, itemData, index) => {
        // Setup all inputs
        $item("#descInput").value = itemData.description || "";
        $item("#dateInput").value = itemData.date || null;
        $item("#amtInput").value = itemData.amount || "";
        $item("#catDropdown").value = itemData.category || "";
        $item("#payDropdown").value = itemData.paymentMethod || "";
        $item("#refNumberInput").value = itemData.reference || "";

        // Change handlers for all fields
        $item("#descInput").onInput(e => {
            expenseRows[index].description = e.target.value;
        });
        $item("#dateInput").onChange(e => {
            expenseRows[index].date = e.target.value;
        });
        $item("#amtInput").onInput(e => {
            expenseRows[index].amount = e.target.value;
        });
        $item("#catDropdown").onChange(e => {
            expenseRows[index].category = e.target.value;
        });
        $item("#payDropdown").onChange(e => {
            expenseRows[index].paymentMethod = e.target.value;
        });
        $item("#refNumberInput").onInput(e => {
            expenseRows[index].reference = e.target.value;
        });

        // Upload handler
        $item("#receiptUpload").onChange(() => {
            const uploadBtn = $item("#receiptUpload");
            if (uploadBtn.value.length > 0) {
                // Start upload
                uploadBtn.uploadFiles()
                .then(uploadedFiles => {
                    if (uploadedFiles.length > 0) {
                        expenseRows[index].receipt = uploadedFiles[0].fileUrl;
                        // Show "uploaded" tick or link if you want
                    }
                });
            }
        });

        // Show receipt info if uploaded
        if (itemData.receipt) {
            // Optional: Show link or tick (customize to your UI)
            // $item("#receiptLink").link = itemData.receipt;
            // $item("#receiptLink").show();
        }

        // Remove button logic
        if (index === 0) {
            $item("#deleteRowBtn").hide();
        } else {
            $item("#deleteRowBtn").show();
            $item("#deleteRowBtn").onClick(() => {
                expenseRows.splice(index, 1);
                $w("#expenseRepeater").data = [...expenseRows];
            });
        }
    });

    // Add new row
    $w("#addExpenseRowBtn").onClick(() => {
        expenseRows.push({
            _id: String(Date.now()) + Math.floor(Math.random() * 10000),
            reference: '',
            description: '',
            amount: '',
            category: '',
            paymentMethod: '',
            date: null,
            receipt: null
        });
        $w("#expenseRepeater").data = [...expenseRows];
    });

    // Submit all rows
    $w("#saveAllExpensesButton").onClick(async () => {
        let failedRows = 0;
        for (let i = 0; i < expenseRows.length; i++) {
            const row = expenseRows[i];
            // Validate fields
            if (!row.description || !row.amount || !row.category || !row.paymentMethod || !row.date) {
                failedRows++;
                continue;
            }
            try {
                const expenseNumber = await getNextExpenseNumber();
                await wixData.insert("Expenses", {
                    expenseNumber,
                    reference: row.reference,
                    description: row.description,
                    amount: Number(row.amount),
                    category: row.category,
                    paymentMethod: row.paymentMethod,
                    date: row.date ? new Date(row.date) : null,
                    receipt: row.receipt || null
                });
            } catch (e) {
                failedRows++;
            }
        }
        if (failedRows === 0) {
            $w("#statusText").text = "✅ All expenses saved!";
            // Reset to a single empty row
            expenseRows = [{
                _id: String(Date.now()),
                reference: '',
                description: '',
                amount: '',
                category: '',
                paymentMethod: '',
                date: null,
                receipt: null
            }];
            $w("#expenseRepeater").data = [...expenseRows];
        } else {
            $w("#statusText").text = `❌ ${failedRows} entry(s) failed. Please check for missing fields.`;
        }
        setTimeout(() => $w("#statusText").text = "", 2500);
    });
});
