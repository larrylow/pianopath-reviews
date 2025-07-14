import wixData from 'wix-data';

// Start empty
let expenseRows = [];

async function getNextExpenseNumber() {
    const result = await wixData.query("Expenses")
        .descending("_createdDate")
        .limit(1)
        .find();

    let lastNumber = 0;
    if (result.items.length > 0) {
        const lastExpense = result.items[0];
        const parts = (lastExpense.expenseNumber || '').split('-');
        lastNumber = parseInt(parts[2]) || 0;
    }
    return `EXP-2025-${(lastNumber + 1).toString().padStart(4, '0')}`;
}

$w.onReady(function () {
    $w("#container1").collapse();
    $w("#expenseRepeater").data = [];

    $w("#expenseRepeater").onItemReady(($item, itemData, index) => {
        $item("#descInput").value = itemData.description || "";
        $item("#dateInput").value = itemData.date || null;
        $item("#amtInput").value = itemData.amount || "";
        $item("#catDropdown").value = itemData.category || "";
        $item("#payDropdown").value = itemData.paymentMethod || "";
        $item("#refNumberInput").value = itemData.reference || "";
        $item("#fileTypeDropdown").value = itemData.fileType || "Image";

        // Set upload file type initially
        setUploadBtnFileType($item, $item("#fileTypeDropdown").value);

        $item("#fileTypeDropdown").onChange(e => {
            expenseRows[index].fileType = e.target.value;
            setUploadBtnFileType($item, e.target.value);
        });

        // Input handlers
        $item("#descInput").onInput(e => { expenseRows[index].description = e.target.value; });
        $item("#dateInput").onChange(e => { expenseRows[index].date = e.target.value; });
        $item("#amtInput").onInput(e => { expenseRows[index].amount = e.target.value; });
        $item("#catDropdown").onChange(e => { expenseRows[index].category = e.target.value; });
        $item("#payDropdown").onChange(e => { expenseRows[index].paymentMethod = e.target.value; });
        $item("#refNumberInput").onInput(e => { expenseRows[index].reference = e.target.value; });

        // Upload handler
        $item("#receiptUploadBtn").onChange(() => {
            const fileTypeSelected = $item("#fileTypeDropdown").value;
            $item("#receiptUploadBtn").uploadFiles()
                .then(files => {
                    if (files.length > 0) {
                        if (fileTypeSelected === "Image") {
                            expenseRows[index].receiptImage = files[0].fileUrl;
                            expenseRows[index].receiptDocument = null;
                        } else if (fileTypeSelected === "Document") {
                            expenseRows[index].receiptImage = null;
                            expenseRows[index].receiptDocument = files[0].fileUrl;
                        }
                    }
                });
        });

        // Remove row button logic
        if (expenseRows.length === 1) $item("#deleteRowBtn").hide();
        else {
            $item("#deleteRowBtn").show();
            $item("#deleteRowBtn").onClick(() => {
                expenseRows.splice(index, 1);
                $w("#expenseRepeater").data = [...expenseRows];
                if (expenseRows.length === 0) {
                    $w("#container1").collapse();
                }
            });
        }
    });

    // Add row
    $w("#addExpenseRowBtn").onClick(() => {
        expenseRows.push({
            _id: String(Date.now()) + Math.floor(Math.random() * 10000),
            reference: '',
            description: '',
            amount: '',
            category: '',
            paymentMethod: '',
            date: null,
            fileType: 'Image',
            receiptImage: null,
            receiptDocument: null
        });
        $w("#expenseRepeater").data = [...expenseRows];
        $w("#container1").expand();
    });

    // Submit/save logic unchanged, just include both fields in the insert
    $w("#saveAllExpensesButton").onClick(async () => {
        let failedRows = 0;
        for (let i = 0; i < expenseRows.length; i++) {
            const row = expenseRows[i];
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
                    fileType: row.fileType || "Image",
                    receiptImage: row.receiptImage || null,
                    receiptDocument: row.receiptDocument || null
                });
            } catch (e) {
                failedRows++;
            }
        }
        if (failedRows === 0) {
            $w("#statusText").text = "✅ All expenses saved!";
            expenseRows = [];
            $w("#expenseRepeater").data = [];
            $w("#container1").collapse();
        } else {
            $w("#statusText").text = `❌ ${failedRows} entry(s) failed. Please check for missing fields.`;
        }
        setTimeout(() => $w("#statusText").text = "", 2500);
    });
});

// ---- Helper ----
function setUploadBtnFileType($item, type) {
    $item("#receiptUploadBtn").fileType = type; // Must be "Image" or "Document"
    console.log("[fileType] Set to:", type);
}
