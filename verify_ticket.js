import wixLocation from 'wix-location';
import wixData from 'wix-data';

$w.onReady(function () {

const today = new Date();
const unlockDate = new Date("2025-06-08T00:00:00"); // YYYY-MM-DD
const code = wixLocation.query.code;

if (today < unlockDate) {
  // Show loading text
  $w("#checkingText").show();
  $w("#checkingText").text = "🔒 Ticket verification opens on 8th September.";
  $w("#verifyStatus").hide();
  $w("#verifyName").hide();
  $w("#verifyCode").hide();
  return;
}else{
  $w("#checkingText").show();
  $w("#verifyStatus").hide();
  $w("#verifyName").hide();
  $w("#verifyCode").hide();

}

  wixData.query("Tickets")
    .eq("ticketCode", code)
    .find()
    .then((results) => {
      if (results.items.length === 0) {
        $w("#verifyStatus").text = "❌ Ticket not found.";
      } else {
        const item = results.items[0];
        $w("#verifyName").text = `Name: ${item.buyerName}`;
        $w("#verifyCode").text = `Ticket Code: ${item.ticketCode}`;

        if (item.used) {
          $w("#verifyStatus").text = "❌ Ticket is already used.";
        } else {
          $w("#verifyStatus").text = "✅ Ticket is valid and unused.\nMarking as used now.";
          item.used = true;
          wixData.update("Tickets", item);
        }

        // Show content
        $w("#verifyStatus").show();
        $w("#verifyName").show();
        $w("#verifyCode").show();
      }

      // Hide loading text
      $w("#checkingText").hide();
    });
});
