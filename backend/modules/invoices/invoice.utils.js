export const roundMoney = (num) => {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
};

export const calculateInvoiceFinancials = (rawItems = [], rawInvoiceDiscount = {}) => {
  let subtotal = 0;
  let itemDiscountTotal = 0;
  let taxTotal = 0;

  const verifiedItems = rawItems.map((item) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.unitPrice) || 0;
    const discRate = Number(item.discountRate) || 0;
    const tRate = Number(item.taxRate) || 0;

    const baseAmount = roundMoney(qty * price);
    const itemDiscount = roundMoney(baseAmount * (discRate / 100));
    const taxableLine = Math.max(0, roundMoney(baseAmount - itemDiscount));
    const itemTax = roundMoney(taxableLine * (tRate / 100));
    const lineTotal = roundMoney(taxableLine + itemTax);

    subtotal = roundMoney(subtotal + baseAmount);
    itemDiscountTotal = roundMoney(itemDiscountTotal + itemDiscount);
    taxTotal = roundMoney(taxTotal + itemTax);

    return {
      productId: item.productId || null,
      name: item.name ? item.name.trim() : "Custom Item",
      sku: item.sku ? item.sku.trim() : "",
      unit: item.unit ? item.unit.trim().toLowerCase() : "piece",
      quantity: qty,
      unitPrice: price,
      discountRate: discRate,
      discountAmount: itemDiscount,
      taxRate: tRate,
      taxAmount: itemTax,
      lineTotal,
    };
  });

  // Calculate invoice-level discount
  let invDiscountAmount = 0;
  const netAfterItemDiscount = Math.max(0, roundMoney(subtotal - itemDiscountTotal));
  const discountType = rawInvoiceDiscount.type === "PERCENTAGE" ? "PERCENTAGE" : "FIXED";
  const discountValue = Number(rawInvoiceDiscount.value) || 0;

  if (discountType === "PERCENTAGE") {
    invDiscountAmount = roundMoney(netAfterItemDiscount * (discountValue / 100));
  } else {
    invDiscountAmount = roundMoney(Math.min(discountValue, netAfterItemDiscount));
  }

  const taxableAmount = Math.max(0, roundMoney(netAfterItemDiscount - invDiscountAmount));
  const grandTotal = roundMoney(taxableAmount + taxTotal);

  return {
    verifiedItems,
    subtotal,
    itemDiscountTotal,
    invoiceDiscount: {
      type: discountType,
      value: discountValue,
      amount: invDiscountAmount,
    },
    taxableAmount,
    taxTotal,
    grandTotal,
  };
};
