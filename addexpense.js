import wixData from 'wix-data';

let expenseRows = [
  {
    _id: String(Date.now()) + Math.floor(Math.random() * 10000),
    description: "",
    date: null,
    amount: "",
    category: "",
    paymentMethod: "",
    reference: "",
    fileType: "",
    receipt: null
  }
];

function updateRow(id, changes) {
  const idx = expenseRows.findIndex(row => row._id === id);
  if (idx !== -1) {
    expenseRows[idx] = { ...expenseRows[idx], ...changes };
    console.log(`[updateRow] Updated row ${id}:`, expenseRows[idx]);
  }
}

function syncRepeaterInputsToRows() {
  let rows = [];
  $w("#expenseRepeater").forEachItem(($item, itemData, i) => {
    rows.push({
      _id: itemData._id,
      description: $item("#descInput").value,
      date: $item("#dateInput").value,
      amount: $item("#amtInput").value,
      category: $item("#catDropdown").value,
      paymentMethod: $item("#payDropdown").value,
      reference: $item("#refNumberInput").value,
      fileType: $item("#dropdown1").value,
      receipt: itemData.receipt || null
    });
  });
  expenseRows = rows;
  console.log("[syncRepeaterInputsToRows] All rows after sync:", expenseRows);
}

$w.onReady(() => {
  console.log("=== onReady. Initial expenseRows:", JSON.stringify(expenseRows));
  $w("#expenseRepeater").data = [...expenseRows];

  $w("#expenseRepeater").onItemReady(($item, itemData, idx) => {
    const rowId = itemData._id;
    $item("#descInput").value = itemData.description || "";
    $item("#dateInput").value = itemData.date || null;
    $item("#amtInput").value = itemData.amount || "";
    $item("#catDropdown").value = itemData.category || "";
    $item("#payDropdown").value = itemData.paymentMethod || "";
    $item("#refNumberInput").value = itemData.reference || "";
    $item("#dropdown1").value = itemData.fileType || "";

    // Input handlers (just updateRow, NOT sync)
    $item("#descInput").onInput(e => {
      updateRow(rowId, { description: e.target.value });
    });
    $item("#dateInput").onChange(e => {
      updateRow(rowId, { date: e.target.value });
    });
    $item("#amtInput").onInput(e => {
      updateRow(rowId, { amount: e.target.value });
    });
    $item("#catDropdown").onChange(e => {
      updateRow(rowId, { category: e.target.value });
    });
    $item("#payDropdown").onChange(e => {
      updateRow(rowId, { paymentMethod: e.target.value });
    });
    $item("#refNumberInput").onInput(e => {
      updateRow(rowId, { reference: e.target.value });
    });
    $item("#dropdown1").onChange(e => {
      updateRow(rowId, { fileType: e.target.value });
    });

    // Upload Button Handler
    $item("#receiptUploadBtn").onChange(async () => {
      if ($item("#receiptUploadBtn").value.length > 0) {
        $item("#receiptUploadBtn").uploadFiles()
          .then(uploadedFiles => {
            if (uploadedFiles.length > 0 && uploadedFiles[0].fileUrl) {
              updateRow(rowId, { receipt: uploadedFiles[0].fileUrl });
              console.log(`[uploadBtn] File uploaded for row ${rowId}:`, uploadedFiles[0].fileUrl);
            } else {
              updateRow(rowId, { receipt: null });
              console.warn(`[uploadBtn] File upload failed for row ${rowId}`, uploadedFiles);
            }
          })
          .catch(err => {
            updateRow(rowId, { receipt: null });
            console.error(`[uploadBtn] Error uploading for row ${rowId}:`, err);
          });
      }
    });

    // Delete button
    if (idx === 0) {
      $item("#deleteRowBtn").hide();
      console.log(`[deleteRowBtn] HIDDEN for FIRST row (id=${rowId})`);
    } else {
      $item("#deleteRowBtn").show();
      console.log(`[deleteRowBtn] SHOWING for row idx=${idx}, id=${rowId}`);
      $item("#deleteRowBtn").onClick(() => {
        syncRepeaterInputsToRows(); // 🔥 sync UI before removing!
        expenseRows = expenseRows.filter(row => row._id !== rowId);
        console.log(`[deleteRowBtn] Deleted row ${rowId}. Now rows:`, expenseRows.map(x=>x._id));
        $w("#expenseRepeater").data = [...expenseRows];
      });
    }
  });

  $w("#addExpenseRowBtn").onClick(() => {
    syncRepeaterInputsToRows(); // 🔑
    const newRow = {
      _id: String(Date.now()) + Math.floor(Math.random() * 10000),
      description: "",
      date: null,
      amount: "",
      category: "",
      paymentMethod: "",
      reference: "",
      fileType: "",
      receipt: null
    };
    expenseRows.push(newRow);
    console.log("[addExpenseRowBtn] Added row:", newRow, "| Rows:", expenseRows.map(x=>x._id));
    $w("#expenseRepeater").data = [...expenseRows];
  });

  $w("#saveAllExpensesButton").onClick(() => {
    syncRepeaterInputsToRows();
    console.log("[saveAllExpensesButton] SUBMIT, all rows:", JSON.stringify(expenseRows));
    $w("#statusText").text = "✅ All rows logged in console.";
  });
});
