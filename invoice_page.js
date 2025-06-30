import wixLocation from 'wix-location';
import wixData from 'wix-data';

$w.onReady(async function () {
  const slug = wixLocation.path[0];
  console.log("Slug from URL:", slug);

  try {
    const invoiceResults = await wixData.query("Invoices")
      .eq("invoiceSlug", slug)
      .limit(1)
      .find();

    if (invoiceResults.items.length === 0) {
      console.warn("No invoice found for slug:", slug);
      return;
    }

    const invoice = invoiceResults.items[0];
    const invoiceId = invoice._id;

    const itemResults = await wixData.query("InvoiceItems")
      .eq("invoiceRef", invoiceId)
      .find();

    const items = itemResults.items;
    $w("#itemRepeater").data = items;

    // Format repeater items
    $w("#itemRepeater").onItemReady(($item, itemData) => {
      $item("#descriptionTxt").text = itemData.description;
      $item("#rateTxt").text = "$" + itemData.rate.toFixed(2);
      $item("#qtyTxt").text = itemData.quantity.toString();
      $item("#amountTxt").text = "$" + itemData.amount.toFixed(2);
    });

    // Set total amount
    const total = invoice.amount.toFixed(2);
    $w("#totalAmount").text = "$" + total;

    // ✅ Generate PayNow QR
    const uen = "202520210E";
    const reference = invoice.invoiceNumber;
    const qrData = generatePaynowQR(uen, total, reference);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;
    $w("#qrImage").src = qrUrl;

    // Set T&C text
    $w("#text88").html = `
Dear Parents,
<br><br>
We hope this message finds you well and that this month brings your family much joy and success.
<br><br>
Please be reminded that the total amount for this month’s school fees and/or any other items is <strong>$${invoice.amount}</strong>.
<br><br>
For regular students:
Payment is due by the 1st of the month. To avoid a $10 late fee, please ensure payment is completed by the 5th.
<br><br>
For trial lessons:
Trial lesson payment must be made within 24 hours of confirming the trial schedule.
<br><br>
You may conveniently pay via PayNow using our UEN QR code or transfer to:
<strong>UEN202520210E</strong>
<br><br>
—
Lesson & Trial Fee Terms:<br>
• Monthly lesson fees are based on 4 lessons per month, unless the month has 5 weeks, in which case an additional fee applies.<br>
• Trial lesson payment must be made within 24 hours of confirming the trial lesson time.<br>
• Monthly fees must be paid before the first lesson of the month.<br>
<br><br>
—
<br>
Thank you for your cooperation and support.
<br><br>
Best regards,
<br>
PianoPath Studio
    `;

  } catch (error) {
    console.error("Error loading invoice:", error);
  }
});


// ✅ Outside of $w.onReady — Helper functions

function generatePaynowQR(uen, amount, reference) {
  const payload = [
    formatTLV("00", "01"),
    formatTLV("01", "12"),
    formatTLV("26", [
      formatTLV("00", "SG.PAYNOW"),
      formatTLV("01", "2"),
      formatTLV("02", uen)
    ].join("")),
    formatTLV("52", "0000"),
    formatTLV("53", "702"),
    formatTLV("54", amount),
    formatTLV("58", "SG"),
    formatTLV("59", "PianoPath"),
    formatTLV("60", "Singapore"),
    formatTLV("62", formatTLV("01", reference)),
    "6304" // CRC placeholder
  ].join("");

  const crc = getCRC16(payload);
  return payload + crc;
}

function formatTLV(id, value) {
  const length = value.length.toString().padStart(2, '0');
  return id + length + value;
}

function getCRC16(input) {
  const polynomial = 0x1021;
  let crc = 0xFFFF;

  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ polynomial) : (crc << 1);
    }
  }

  crc &= 0xFFFF;
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
