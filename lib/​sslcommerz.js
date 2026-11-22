const SANDBOX_INIT_URL = "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";
const LIVE_INIT_URL = "https://securepay.sslcommerz.com/gwprocess/v4/api.php";

const SANDBOX_VALIDATE_URL =
  "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php";
const LIVE_VALIDATE_URL =
  "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php";

function getEndpoints() {
  const isLive = process.env.SSLCOMMERZ_IS_LIVE === "true";
  return {
    initUrl: process.env.SSLCOMMERZ_INIT_URL || (isLive ? LIVE_INIT_URL : SANDBOX_INIT_URL),
    validateUrl:
      process.env.SSLCOMMERZ_VALIDATE_URL ||
      (isLive ? LIVE_VALIDATE_URL : SANDBOX_VALIDATE_URL),
  };
}

/**
 * SSLCommerz পেমেন্ট সেশন শুরু করে এবং GatewayPageURL রিটার্ন করে।
 */
export async function createPayment({
  amount,
  tranId,
  currency = "BDT",
  productName = "Print Job",
  productCategory = "Printing",
  customerName = "Customer",
  customerEmail = "customer@example.com",
  customerPhone = "01700000000",
  customerAddress = "Dhaka, Bangladesh",
  customerCity = "Dhaka",
  customerPostcode = "1219",
  customerCountry = "Bangladesh",
}) {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
  const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;

  if (!storeId || !storePassword) {
    throw new Error("SSLCOMMERZ_STORE_ID অথবা SSLCOMMERZ_STORE_PASSWORD সেট করা নেই।");
  }

  if (!baseUrl) {
    throw new Error("APP_URL অথবা NEXT_PUBLIC_APP_URL সেট করা নেই।");
  }

  const { initUrl } = getEndpoints();

  const params = new URLSearchParams({
    store_id: storeId,
    store_passwd: storePassword,
    total_amount: String(Number(amount).toFixed(2)),
    currency,
    tran_id: tranId,
    success_url: `${baseUrl}/api/payment/success`,
    fail_url: `${baseUrl}/api/payment/fail`,
    cancel_url: `${baseUrl}/api/payment/cancel`,
    ipn_url: `${baseUrl}/api/payment/ipn`,
    shipping_method: "NO",
    product_name: productName,
    product_category: productCategory,
    product_profile: "non-physical-goods",
    cus_name: customerName,
    cus_email: customerEmail,
    cus_add1: customerAddress,
    cus_city: customerCity,
    cus_postcode: customerPostcode,
    cus_country: customerCountry,
    cus_phone: customerPhone,
    num_of_item: "1",
  });

  const response = await fetch(initUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await response.json();

  if (!response.ok || data.status !== "SUCCESS" || !data.GatewayPageURL) {
    throw new Error(data.failedreason || "SSLCommerz পেমেন্ট শুরু করা যায়নি।");
  }

  return {
    gatewayUrl: data.GatewayPageURL,
    sessionKey: data.sessionkey,
    tranId,
    raw: data,
  };
}

/**
 * val_id ব্যবহার করে SSLCommerz Validation API থেকে পেমেন্ট যাচাই করে।
 */
export async function verifyPayment(valId) {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;

  if (!storeId || !storePassword) {
    throw new Error("SSLCOMMERZ_STORE_ID অথবা SSLCOMMERZ_STORE_PASSWORD সেট করা নেই।");
  }

  const { validateUrl } = getEndpoints();

  const url = new URL(validateUrl);
  url.searchParams.set("val_id", valId);
  url.searchParams.set("store_id", storeId);
  url.searchParams.set("store_passwd", storePassword);
  url.searchParams.set("format", "json");

  const response = await fetch(url.toString(), {
    method: "GET",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error("SSLCommerz ভ্যালিডেশন রিকোয়েস্ট ব্যর্থ হয়েছে।");
  }

  return data;
}
