import wixData from 'wix-data';

// 🔐 Secure random slug generator
function generateRandomSlug(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < length; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)];
  }
  return slug;
}

// Sequential invoice number (for internal reference)
async function getNextInvoiceNumber() {
  const result = await wixData.query("Invoices")
    .descending("_createdDate")
    .limit(1)
    .find();

  if (result.items.length > 0) {
    const lastInvoice = result.items[0];
    const lastNumber = parseInt(lastInvoice.invoiceNumber?.split('-')[2]) || 0;
    const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
    return `INV-2025-${nextNumber}`;
  } else {
    return "INV-2025-0001";
  }
}

let invoiceItems = [
  {
    _id: String(Date.now()) + Math.floor(Math.random() * 10000),
    description: "",
    quantity: 0,
    rate: 0,
    amount: 0
  }
];

$w.onReady(() => {
  $w("#itemRepeater").data = invoiceItems;
  $w("#whatsappButton").hide(); // Initially hide WhatsApp button

  $w("#itemRepeater").onItemReady(($item, itemData) => {
    $item("#descriptionInput").value = itemData.description;
    $item("#quantityInput").value = itemData.quantity;
    $item("#rateInput").value = itemData.rate;

    function recalculateAmount() {
      const qty = Number($item("#quantityInput").value);
      const rate = Number($item("#rateInput").value);
      const amt = qty * rate;
      const index = invoiceItems.findIndex(i => i._id === itemData._id);
      invoiceItems[index].quantity = qty;
      invoiceItems[index].rate = rate;
      invoiceItems[index].amount = amt;
      $item("#amountInput").value = amt.toFixed(2);
    }

    recalculateAmount();

    $item("#descriptionInput").onInput((e) => {
      const index = invoiceItems.findIndex(i => i._id === itemData._id);
      invoiceItems[index].description = e.target.value;
    });

    $item("#quantityInput").onInput(() => {
      recalculateAmount();
    });

    $item("#rateInput").onInput(() => {
      recalculateAmount();
    });

    $item("#deleteButton").onClick(() => {
      const index = invoiceItems.findIndex(i => i._id === itemData._id);
      invoiceItems.splice(index, 1);
      $w("#itemRepeater").data = [...invoiceItems];
    });

    const index = invoiceItems.findIndex(i => i._id === itemData._id);
    if (index > 0) {
      $item("#deleteButton").show();
    } else {
      $item("#deleteButton").hide();
    }
  });

  $w("#addItemButton").onClick(() => {
    const newItem = {
      _id: String(Date.now()) + Math.floor(Math.random() * 10000),
      description: "",
      quantity: 0,
      rate: 0,
      amount: 0
    };
    invoiceItems.push(newItem);
    $w("#itemRepeater").data = [...invoiceItems];
  });

  $w("#createInvoiceButton").onClick(async () => {
    const studentName = $w("#studentNameInput").value;
    const invoiceDate = $w("#invoiceDateInput").value;
    const parentContact = $w("#parentContactInput").value;
    const paymentMethod = $w("#paymentMethodDropdown").value;

    if (!studentName || !invoiceDate || !parentContact || !paymentMethod) {
      $w("#invoiceText").text = "❌ Please fill in all required fields.";
      return;
    }

    $w("#invoiceText").text = "⏳ Generating invoice...";

    const totalAmount = invoiceItems.reduce((sum, item) => {
      return sum + (isNaN(item.amount) ? 0 : item.amount);
    }, 0);

    const invoiceNumber = await getNextInvoiceNumber();
    const invoiceSlug = generateRandomSlug(); // 🔐 Random secure slug

    const invoiceData = {
      studentName,
      invoiceDate,
      parentContact,
      paymentMethod,
      amount: totalAmount,
      invoiceNumber,
      invoiceSlug
    };

    try {
      const savedInvoice = await wixData.insert("Invoices", invoiceData);
      const invoiceId = savedInvoice._id;

      const itemInsertions = invoiceItems.map(item => {
        return wixData.insert("InvoiceItems", {
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
          invoiceRef: invoiceId
        });
      });

      await Promise.all(itemInsertions);

      const invoiceLink = `https://pianopathstudio.com/invoice/${invoiceSlug}`;

      const messageText = `Hi Parents,
We’ve updated our fee payment method — you can now simply click the link to view your invoice: ${invoiceLink}
Once opened, just scan the QR code inside the invoice to make the transfer. The amount will be preset for your convenience.

This is the invoice for July. Please check if all the details are correct and let me know once payment is made. Thanks! 😊

各位家长您好，
我们更新了付款方式，您现在只需点击链接查看账单：${invoiceLink}
直接扫描账单内的二维码即可转账，金额已为您设定好，非常方便。

这是七月份的账单，请您确认内容无误后再进行转账，转账后请告诉我一声，谢谢您！😊`;

      const phone = parentContact.replace(/[^0-9]/g, ''); // clean number
      const whatsappLink = `https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`;

      $w("#invoiceText").text = `✅ Invoice ${invoiceNumber} saved!\n🔗 Link: ${invoiceLink}`;
      $w("#whatsappButton").label = "Send to WhatsApp";
      $w("#whatsappButton").link = whatsappLink;
      $w("#whatsappButton").target = "_blank";
      $w("#whatsappButton").show();

    } catch (err) {
      console.error(err);
      $w("#invoiceText").text = "❌ Error saving invoice.";
    }
  });
});
