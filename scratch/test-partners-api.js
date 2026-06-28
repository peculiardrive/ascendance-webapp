async function runTests() {
  const host = "http://127.0.0.1:3000";
  
  console.log("=== Testing GET /api/partners ===");
  let res = await fetch(`${host}/api/partners`);
  let data = await res.json();
  console.log("Initial Partners count:", data.partners?.length);
  console.log("Initial Partners:", data.partners.map(p => ({ name: p.name, circle: p.circle })));

  console.log("\n=== Testing POST /api/partners (Donate) ===");
  res = await fetch(`${host}/api/partners`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Sec-Fetch-Site": "same-origin", // To bypass assertSameOrigin
    },
    body: JSON.stringify({
      action: "donate",
      email: "test.donor@example.com",
      fullName: "Test Donor",
      country: "US",
      circle: "Collectors",
      amount: 350,
      currency: "USD"
    })
  });
  
  data = await res.json();
  console.log("Donate Response:", data);
  const newPartnerId = data.partner?.id;

  if (newPartnerId) {
    console.log("\n=== Testing POST /api/partners (Remark) ===");
    res = await fetch(`${host}/api/partners`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "remark",
        partnerId: newPartnerId,
        title: "Test Remark Title",
        content: "This is a test remark experience."
      })
    });
    data = await res.json();
    console.log("Remark Response:", data);

    console.log("\n=== Testing POST /api/partners (Like) ===");
    res = await fetch(`${host}/api/partners`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "like",
        partnerId: newPartnerId,
        visitorId: "test-visitor-1"
      })
    });
    data = await res.json();
    console.log("Like Response (Likes Count):", data.partner?.remark?.likes);

    console.log("\n=== Testing POST /api/partners (Comment) ===");
    res = await fetch(`${host}/api/partners`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "comment",
        partnerId: newPartnerId,
        text: "This is a reply to the test remark.",
        userName: "Admin Tester",
        countryCode: "NG"
      })
    });
    data = await res.json();
    console.log("Comment Response (Comments Count):", data.partner?.remark?.comments?.length);
  }

  console.log("\n=== Testing GET /api/partners (Verify order and new entry) ===");
  res = await fetch(`${host}/api/partners`);
  data = await res.json();
  console.log("Updated Partners List ranking:");
  data.partners.forEach((p, index) => {
    console.log(`${index + 1}. ${p.name} (${p.circle}) - Remark: ${p.remark ? p.remark.title : "None"}`);
  });
}

runTests().catch(err => console.error("Test failed:", err));
